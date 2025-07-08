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

public class CheckDynamoActivity
{
    private static readonly AmazonDynamoDBClient _ddbClient = new();
    private static readonly AmazonSQSClient _sqsClient = new();
    private static readonly string _tableName = Environment.GetEnvironmentVariable("TABLE_NAME")!;
    private static readonly string _queueUrl = Environment.GetEnvironmentVariable("QUEUE_URL")!;

    public async Task FunctionHandler(ILambdaContext context)
    {
        var table = Table.LoadTable(_ddbClient, _tableName);
        // Scan for the most recent item (by lastUpdated in prices array)
        var search = table.Scan(new ScanOperationConfig());
        DateTime? mostRecent = null;
        do
        {
            var set = await search.GetNextSetAsync();
            foreach (var doc in set)
            {
                if (doc.ContainsKey("prices") && doc["prices"] is DynamoDBList dynList)
                {
                    foreach (var entry in dynList)
                    {
                        if (entry is DynamoDBMap map && map.ContainsKey("lastUpdated"))
                        {
                            if (DateTime.TryParse(map["lastUpdated"].AsPrimitive().Value.ToString(), out var dt))
                            {
                                if (mostRecent == null || dt > mostRecent)
                                    mostRecent = dt;
                            }
                        }
                    }
                }
            }
        } while (!search.IsDone);
        if (mostRecent == null || (DateTime.UtcNow - mostRecent.Value).TotalDays > 1)
        {
            // No recent update, send 'request all' message
            var msg = new QueueMessage { Type = "query-all", Provider = "cinemaworld" };
            await _sqsClient.SendMessageAsync(new SendMessageRequest
            {
                QueueUrl = _queueUrl,
                MessageBody = JsonSerializer.Serialize(msg)
            });
            msg = new QueueMessage { Type = "query-all", Provider = "filmworld" };
            await _sqsClient.SendMessageAsync(new SendMessageRequest
            {
                QueueUrl = _queueUrl,
                MessageBody = JsonSerializer.Serialize(msg)
            });
        }
    }
}
