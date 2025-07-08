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

namespace MovieComparerProcessor;

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
