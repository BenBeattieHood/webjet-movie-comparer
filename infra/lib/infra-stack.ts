import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as budgets from 'aws-cdk-lib/aws-budgets';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cloudwatch_targets from 'aws-cdk-lib/aws-cloudwatch-targets';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // SQS Queue
    const deadLetterQueue = new sqs.Queue(this, 'MovieComparerDLQ', {
      retentionPeriod: cdk.Duration.days(14),
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
    const queue = new sqs.Queue(this, 'MovieComparerQueue', {
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(14),
      deadLetterQueue: {
        maxReceiveCount: 300,
        queue: deadLetterQueue
      }
    });

    // DynamoDB Table
    const movieSummaryDynamoTable = new dynamodb.Table(this, 'MoviesTable', {
      partitionKey: { name: 'title', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
    // May add this later if needed, but for MVP it's a cost we can avoid
    // table.addGlobalSecondaryIndex({
    //   indexName: 'titleHash-index',
    //   partitionKey: { name: 'titleHash', type: dynamodb.AttributeType.STRING }
    // });

    // S3 Buckets
    const movieDetailS3Bucket = new s3.Bucket(this, 'MovieJsonBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });
    const assetBucket = new s3.Bucket(this, 'AssetBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // Secrets Manager: API Key
    const apiKeySecretName = new cdk.CfnParameter(this, 'apiKeySecretName', {
      type: 'String',
    }).valueAsString;
    const apiKeySecret = new secretsmanager.Secret(this, 'ApiKeySecret', {
      secretName: apiKeySecretName,
      description: 'API key for movie provider',
    });

    // Lambda Function
    const lambdaFn = new lambda.Function(this, 'MovieComparerProcessor', {
      runtime: lambda.Runtime.DOTNET_8,
      handler: 'MovieComparerProcessor::MovieComparerProcessor.QueueWorkerFunction::FunctionHandler',
      code: lambda.Code.fromAsset('../backend/MovieComparerProcessor/src/MovieComparerProcessor/bin/Release/net8.0'),
      environment: {
        QUEUE_URL: queue.queueUrl,
        TABLE_NAME: movieSummaryDynamoTable.tableName,
        MOVIE_DETAIL_S3_BUCKET_NAME: movieDetailS3Bucket.bucketName,
        ASSET_BUCKET: assetBucket.bucketName,
        API_KEY_SECRET_NAME: apiKeySecret.secretName
      },
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024,
      logRetention: logs.RetentionDays.ONE_WEEK
    });
    queue.grantConsumeMessages(lambdaFn);
    movieSummaryDynamoTable.grantReadWriteData(lambdaFn);
    movieDetailS3Bucket.grantReadWrite(lambdaFn);
    assetBucket.grantReadWrite(lambdaFn);
    apiKeySecret.grantRead(lambdaFn);
    lambdaFn.addEnvironment('API_KEY_SECRET_ARN', apiKeySecret.secretArn);

    // SQS Event Source Mapping
    lambdaFn.addEventSourceMapping('SQSEventSource', {
      eventSourceArn: queue.queueArn,
      batchSize: 10,
      enabled: true
    });

    // CloudFront Distribution for assets
    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI');
    assetBucket.grantRead(oai);
    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'SiteDistribution', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: assetBucket,
            originAccessIdentity: oai
          },
          behaviors: [{ isDefaultBehavior: true }]
        }
      ]
    });

    // SNS Topic for budget alerts
    const budgetTopic = new sns.Topic(this, 'BudgetAlerts');

    // CloudWatch Alarms (examples)
    new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      metric: lambdaFn.metricErrors(),
      threshold: 1,
      evaluationPeriods: 1
    });
    new cloudwatch.Alarm(this, 'QueueLengthAlarm', {
      metric: queue.metricApproximateNumberOfMessagesVisible(),
      threshold: 10,
      evaluationPeriods: 1
    });
    // DLQ Alarm
    new cloudwatch.Alarm(this, 'DLQHasMessagesAlarm', {
      metric: deadLetterQueue.metricApproximateNumberOfMessagesVisible(),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'Alarm if DLQ contains any messages',
      actionsEnabled: true
    });
    // S3 bucket size metric (CloudWatch metric directly)
    new cloudwatch.Alarm(this, 'S3SizeAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/S3',
        metricName: 'BucketSizeBytes',
        dimensionsMap: {
          BucketName: movieDetailS3Bucket.bucketName,
          StorageType: 'StandardStorage',
        },
        statistic: 'Average',
        period: cdk.Duration.days(1),
      }),
      threshold: 1000000000, // 1GB
      evaluationPeriods: 1
    });

    // Budget Alert (example, must be manually configured in AWS Console for full setup)
    new budgets.CfnBudget(this, 'ProjectBudget', {
      budget: {
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: { amount: 50, unit: 'USD' },
        budgetName: 'MovieComparerBudget'
      },
      notificationsWithSubscribers: [
        {
          notification: {
            notificationType: 'ACTUAL',
            threshold: 80,
            thresholdType: 'PERCENTAGE',
            comparisonOperator: 'GREATER_THAN'
          },
          subscribers: [{ subscriptionType: 'SNS', address: budgetTopic.topicArn }]
        }
      ]
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'MovieComparerDashboard', {
      dashboardName: 'MovieComparerDashboard'
    });
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [lambdaFn.metricInvocations()]
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [lambdaFn.metricErrors()]
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration',
        left: [lambdaFn.metricDuration()]
      }),
      new cloudwatch.GraphWidget({
        title: 'SQS Queue Messages',
        left: [queue.metricApproximateNumberOfMessagesVisible()],
        right: [queue.metricNumberOfMessagesDeleted()]
      }),
      new cloudwatch.GraphWidget({
        title: 'DLQ Messages',
        left: [deadLetterQueue.metricApproximateNumberOfMessagesVisible()]
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Consumed Read/Write Capacity',
        left: [
          movieSummaryDynamoTable.metricConsumedReadCapacityUnits(),
          movieSummaryDynamoTable.metricConsumedWriteCapacityUnits()
        ]
      }),
      new cloudwatch.GraphWidget({
        title: 'S3 MovieJsonBucket Size',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/S3',
            metricName: 'BucketSizeBytes',
            dimensionsMap: {
              BucketName: movieDetailS3Bucket.bucketName,
              StorageType: 'StandardStorage',
            },
            statistic: 'Average',
            period: cdk.Duration.days(1),
          })
        ]
      }),
      new cloudwatch.GraphWidget({
        title: 'S3 AssetBucket Size',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/S3',
            metricName: 'BucketSizeBytes',
            dimensionsMap: {
              BucketName: assetBucket.bucketName,
              StorageType: 'StandardStorage',
            },
            statistic: 'Average',
            period: cdk.Duration.days(1),
          })
        ]
      })
    );
    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${cdk.Stack.of(this).region}#dashboards:name=${dashboard.dashboardName}`
    });

    // Lambda to check DynamoDB activity and trigger 'request all' if needed
    const checkDynamoActivityFn = new lambda.Function(this, 'CheckDynamoActivity', {
      runtime: lambda.Runtime.DOTNET_8,
      handler: 'MovieComparerProcessor::MovieComparerProcessor.CheckDynamoActivity::FunctionHandler',
      code: lambda.Code.fromAsset('../backend/MovieComparerProcessor/src/MovieComparerProcessor/bin/Release/net8.0'),
      environment: {
        TABLE_NAME: movieSummaryDynamoTable.tableName,
        QUEUE_URL: queue.queueUrl
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logRetention: logs.RetentionDays.ONE_WEEK
    });
    movieSummaryDynamoTable.grantReadData(checkDynamoActivityFn);
    queue.grantSendMessages(checkDynamoActivityFn);

    // Schedule: run daily
    new events.Rule(this, 'CheckDynamoActivitySchedule', {
      schedule: events.Schedule.cron({ minute: '0', hour: '0' }), // every day at midnight UTC
      targets: [new targets.LambdaFunction(checkDynamoActivityFn)]
    });

    // Outputs
    new cdk.CfnOutput(this, 'QueueUrl', { value: queue.queueUrl });
    new cdk.CfnOutput(this, 'DeadLetterQueueUrl', { value: deadLetterQueue.queueUrl });
    new cdk.CfnOutput(this, 'MovieSummaryDynamoTableName', { value: movieSummaryDynamoTable.tableName });
    new cdk.CfnOutput(this, 'MovieDetailS3BucketName', { value: movieDetailS3Bucket.bucketName });
    new cdk.CfnOutput(this, 'AssetBucketName', { value: assetBucket.bucketName });
    new cdk.CfnOutput(this, 'CloudFrontDistributionDomainName', { value: distribution.distributionDomainName });
    new cdk.CfnOutput(this, 'BudgetTopicArn', { value: budgetTopic.topicArn });
  }
}
