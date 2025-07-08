using Amazon.Lambda.Core;
using Amazon.Lambda.SQSEvents;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.S3;
using Amazon.SimpleEmail;
using Amazon.CloudWatchLogs;
using System.Text.Json;
using System.Security.Cryptography;
using System.Text;
using System.Net.Http;
using System.Net.Http.Headers;
using Amazon.SQS;
using Amazon.SQS.Model;
using Amazon.SecretsManager;
using Amazon.SecretsManager.Model;
using System.Collections.Generic;
using System.Linq;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace MovieComparerProcessor;

public class Function
{
    private const string CinemaWorldBase = "https://webjetapitest.azurewebsites.net/api/cinemaworld";
    private const string FilmWorldBase = "https://webjetapitest.azurewebsites.net/api/filmworld";

    private static readonly HttpClient _httpClient = new();
    private readonly AmazonDynamoDBClient _ddbClient = new();
    private readonly AmazonS3Client _s3Client = new();
    private readonly AmazonSimpleEmailServiceClient _sesClient = new();
    private readonly AmazonCloudWatchLogsClient _cwClient = new();
    private readonly AmazonSQSClient _sqsClient = new();
    private readonly AmazonSecretsManagerClient _secretsManagerClient = new();
    private readonly string _movieDetailS3BucketName = Environment.GetEnvironmentVariable("MOVIE_DETAIL_S3_BUCKET_NAME")!;
    private readonly string _sqsQueueUrl = Environment.GetEnvironmentVariable("QUEUE_URL")!;
    private readonly string _apiKeySecretName = Environment.GetEnvironmentVariable("API_KEY_SECRET_NAME")!;
    private readonly string _movieSummaryDynamoTableName = Environment.GetEnvironmentVariable("MOVIE_SUMMARY_DYNAMO_TABLE_NAME")!;

    public async Task FunctionHandler(SQSEvent evnt, ILambdaContext context)
    {
        string apiKey = (await _secretsManagerClient.GetSecretValueAsync(new GetSecretValueRequest
        {
            SecretId = _apiKeySecretName
        })).SecretString;

        foreach (var record in evnt.Records)
        {
            try
            {
                var msg = JsonSerializer.Deserialize<QueueMessage>(record.Body);
                if (msg == null) throw new Exception("Invalid message");

                switch (msg.Type)
                {
                    case "query-all":
                        await HandleQueryAllAsync(msg, context, apiKey);
                        break;
                    case "query-single":
                        await HandleQuerySingleAsync(msg, context, apiKey);
                        break;
                    default:
                        throw new Exception($"Unknown message type: {msg.Type}");
                }
            }
            catch (Exception ex)
            {
                await HandleErrorAsync($"Error: {ex.Message}", null, context);
            }
        }
    }

    private async Task HandleQueryAllAsync(QueueMessage msg, ILambdaContext context, string apiKey)
    {
        string url = msg.Provider.ToLower() switch
        {
            "cinemaworld" => $"{CinemaWorldBase}/movies",
            "filmworld" => $"{FilmWorldBase}/movies",
            _ => throw new Exception($"Unknown provider: {msg.Provider}")
        };
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("x-access-token", apiKey!);
        HttpResponseMessage response = null!;
        for (int attempt = 0; attempt < 2; attempt++)
        {
            response = await _httpClient.SendAsync(request);
            if (response.IsSuccessStatusCode) break;
            if (attempt == 1) throw new Exception($"Failed to fetch movies from {msg.Provider}");
            await Task.Delay(1000);
        }
        var json = await response.Content.ReadAsStringAsync();
        var movies = JsonSerializer.Deserialize<MovieListResponse>(json);
        if (movies?.Movies == null) throw new Exception("No movies found in response");
        foreach (var m in movies.Movies)
        {
            var singleMsg = new QueueMessage
            {
                Type = "query-single",
                Provider = msg.Provider,
                Id = m.ID,
                LastDelay = 0
            };
            var sendRequest = new SendMessageRequest
            {
                QueueUrl = _sqsQueueUrl!,
                MessageBody = JsonSerializer.Serialize(singleMsg)
            };
            await _sqsClient.SendMessageAsync(sendRequest);
        }
    }

    private async Task HandleQuerySingleAsync(QueueMessage msg, ILambdaContext context, string apiKey)
    {
        string url = msg.Provider.ToLower() switch
        {
            "cinemaworld" => $"{CinemaWorldBase}/movie/{msg.Id}",
            "filmworld" => $"{FilmWorldBase}/movie/{msg.Id}",
            _ => throw new Exception($"Unknown provider: {msg.Provider}")
        };
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("x-access-token", apiKey!);
        HttpResponseMessage response = null!;
        for (int attempt = 0; attempt < 2; attempt++)
        {
            response = await _httpClient.SendAsync(request);
            if (response.IsSuccessStatusCode) break;
            if (attempt == 1) throw new Exception($"Failed to fetch movie {msg.Id} from {msg.Provider}");
            await Task.Delay(1000);
        }
        var json = await response.Content.ReadAsStringAsync();
        var movie = JsonSerializer.Deserialize<MovieDetailResponse>(json);
        if (movie?.Movie == null) throw new Exception("No movie found in response");
        // Compute MD5 hash of title
        var titleHash = BitConverter.ToString(MD5.HashData(Encoding.UTF8.GetBytes(movie.Movie.Title.ToUpper()))).Replace("-", "").ToLower();
        // Update DynamoDB (merge with existing)
        var table = Table.LoadTable(_ddbClient, _movieSummaryDynamoTableName); // Table name from env
        Document? existing = null;
        try { existing = await table.GetItemAsync(movie.Movie.Title); } catch { }
        var doc = existing ?? new Document();
        doc["title"] = movie.Movie.Title;
        doc["titleHash"] = titleHash;
        if (!string.IsNullOrEmpty(movie.Movie.Poster)) doc["smallImageUrl"] = movie.Movie.Poster;
        if (!string.IsNullOrEmpty(movie.Movie.Genre)) doc["genre"] = movie.Movie.Genre;
        if (!string.IsNullOrEmpty(movie.Movie.Rating)) doc["rating"] = movie.Movie.Rating;
        if (!string.IsNullOrEmpty(movie.Movie.Released)) doc["released"] = movie.Movie.Released;
        if (!string.IsNullOrEmpty(movie.Movie.Metascore)) doc["metascore"] = movie.Movie.Metascore;
        // Merge prices array
        var prices = FunctionHelpers.MergePrices(doc, msg.Provider, movie.Movie.Price);
        doc["prices"] = DynamoDBEntryConversion.ToEntry(prices);
        await table.PutItemAsync(doc);
        // Update S3 (conditional write)
        var s3Key = $"{titleHash}.json";
        var s3Obj = JsonSerializer.Serialize(movie.Movie);
        await _s3Client.PutObjectAsync(new Amazon.S3.Model.PutObjectRequest
        {
            BucketName = _movieDetailS3BucketName,
            Key = s3Key,
            ContentBody = s3Obj
        });
    }

    // Error handling: requeue with delay, SES, CloudWatch, Slack stub
    private async Task HandleErrorAsync(string message, QueueMessage? msg, ILambdaContext context)
    {
        context.Logger.LogError(message);
        // Requeue with delay
        if (msg != null)
        {
            var delay = (msg.LastDelay + 2) * 1000;
            var sendRequest = new SendMessageRequest
            {
                QueueUrl = _sqsQueueUrl,
                MessageBody = JsonSerializer.Serialize(msg),
                DelaySeconds = Math.Min(delay / 1000, 900)
            };
            await _sqsClient.SendMessageAsync(sendRequest);
        }
        // SES email (stub)
        await _sesClient.SendEmailAsync(new Amazon.SimpleEmail.Model.SendEmailRequest
        {
            Source = "noreply@example.com", // TODO: Set via env/config
            Destination = new Amazon.SimpleEmail.Model.Destination { ToAddresses = new List<string> { "admin@example.com" } },
            Message = new Amazon.SimpleEmail.Model.Message
            {
                Subject = new Amazon.SimpleEmail.Model.Content("MovieComparerProcessor Error"),
                Body = new Amazon.SimpleEmail.Model.Body { Text = new Amazon.SimpleEmail.Model.Content(message) }
            }
        });
        // CloudWatch log (already logged)
        // Slack webhook (stub)
        // TODO: Add Slack webhook integration if needed
    }
}

public static class FunctionHelpers
{
    public static List<PriceEntry> MergePrices(Document doc, string provider, decimal price)
    {
        var prices = new List<PriceEntry>();
        if (doc.ContainsKey("prices") && doc["prices"] is DynamoDBList dynList)
        {
            foreach (var entry in dynList)
            {
                if (entry is DynamoDBMap map)
                {
                    var p = new PriceEntry
                    {
                        Provider = map["provider"].AsString(),
                        Price = map.ContainsKey("price") ? decimal.Parse(map["price"].AsPrimitive().Value.ToString()) : 0,
                        LastUpdated = map.ContainsKey("lastUpdated") ? DateTime.Parse(map["lastUpdated"].AsPrimitive().Value.ToString()) : DateTime.MinValue
                    };
                    prices.Add(p);
                }
            }
        }
        var now = DateTime.UtcNow;
        var found = false;
        foreach (var p in prices)
        {
            if (p.Provider.ToLower() == provider.ToLower())
            {
                p.Price = price;
                p.LastUpdated = now;
                found = true;
                break;
            }
        }
        if (!found)
        {
            prices.Add(new PriceEntry
            {
                Provider = provider,
                Price = price,
                LastUpdated = now
            });
        }
        return prices;
    }
}

public class QueueMessage
{
    public string Type { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string? Id { get; set; }
    public int LastDelay { get; set; }
}

public class MovieListResponse { public List<MovieSummary> Movies { get; set; } = new(); }
public class MovieSummary { public string ID { get; set; } = string.Empty; public string Title { get; set; } = string.Empty; public string Poster { get; set; } = string.Empty; }
public class MovieDetailResponse { public MovieDetail Movie { get; set; } = new(); }
public class MovieDetail { public string ID { get; set; } = string.Empty; public string Title { get; set; } = string.Empty; public string Poster { get; set; } = string.Empty; public decimal Price { get; set; } public string Year { get; set; } = string.Empty; public string Rated { get; set; } = string.Empty; public string Released { get; set; } = string.Empty; public string Runtime { get; set; } = string.Empty; public string Genre { get; set; } = string.Empty; public string Director { get; set; } = string.Empty; public string Writer { get; set; } = string.Empty; public string Actors { get; set; } = string.Empty; public string Plot { get; set; } = string.Empty; public string Language { get; set; } = string.Empty; public string Country { get; set; } = string.Empty; public string Metascore { get; set; } = string.Empty; public string Rating { get; set; } = string.Empty; public string Votes { get; set; } = string.Empty; public string ImageUrl { get; set; } = string.Empty; }

public class PriceEntry
{
    public string Provider { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public DateTime LastUpdated { get; set; }
}
