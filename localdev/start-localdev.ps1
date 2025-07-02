#requires -Version 7.0
$ErrorActionPreference = 'Stop'

Write-Host "[INFO] Checking for required tools..."
$required = @('cdklocal', 'jq', 'localstack', 'docker-compose')
foreach ($cmd in $required) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Error "Error: '$cmd' is required but not installed. Please install it and try again."
        exit 1
    }
}

try {
    Set-Location $PSScriptRoot

    Write-Host "[INFO] Building the backend..."
    Set-Location ../backend/MovieComparerProcessor
    dotnet restore .\src\MovieComparerProcessor\MovieComparerProcessor.csproj
    dotnet build .\src\MovieComparerProcessor\MovieComparerProcessor.csproj -c Release

    Write-Host "[INFO] Backend build successful."

    # Start LocalStack
    Set-Location $PSScriptRoot
    Set-Location ../localdev
    Write-Host "[INFO] Starting LocalStack via docker-compose..."
    docker-compose up -d
    Write-Host "[INFO] Waiting for LocalStack to be ready..."
    do {
        Start-Sleep -Seconds 2
        $health = try { (Invoke-RestMethod -Uri 'http://localhost:4566/_localstack/health').services } catch { $null }
    } while (-not $health -or $health.dynamodb -ne 'available' -and $health.dynamodb -ne 'running')

    $env:AWS_ACCESS_KEY_ID = 'test'
    $env:AWS_SECRET_ACCESS_KEY = 'test'
    $env:AWS_DEFAULT_REGION = 'us-east-1'
    $env:AWS_REGION = 'us-east-1'
    $env:AWS_ENDPOINT_URL = 'http://localhost:4566'
    $env:AWS_ENDPOINT_URL_S3 = 'http://localhost:4566'
    $env:AWS_ENDPOINT_URL_SQS = 'http://localhost:4566'
    $env:AWS_ENDPOINT_URL_DYNAMODB = 'http://localhost:4566'
    $env:AWS_ENDPOINT_URL_SECRETSMANAGER = 'http://localhost:4566'
    $env:AWS_ENDPOINT_URL_CLOUDFORMATION = 'http://localhost:4566'
    $env:AWS_ENDPOINT_URL_LAMBDA = 'http://localhost:4566'

    Write-Host "[INFO] LocalStack is ready."

    Write-Host "[INFO] Deploying resources to LocalStack..."
    Set-Location $PSScriptRoot
    Set-Location ../infra

    # Create unmanaged Secrets Manager secret
    $API_KEY_SECRET_NAME = 'movie-comparer/api-key'
    awslocal secretsmanager create-secret --name "$API_KEY_SECRET_NAME" --secret-string "dummy-api-key" 2>$null

    # Deploy CDK with API_KEY_SECRET_NAME from localstack env
    cdklocal bootstrap --require-approval never
    cdklocal deploy --parameters apiKeySecretName=$API_KEY_SECRET_NAME --require-approval never

    # Get stack outputs from CloudFormation (LocalStack)
    awslocal cloudformation wait stack-create-complete --stack-name InfraStack --endpoint-url $env:AWS_ENDPOINT_URL --region $env:AWS_DEFAULT_REGION
    $stackName = "InfraStack"
    $cfOutputs = awslocal cloudformation describe-stacks --stack-name $stackName --endpoint-url $env:AWS_ENDPOINT_URL --region $env:AWS_DEFAULT_REGION | ConvertFrom-Json
    $outputs = @{}
    foreach ($output in $cfOutputs.Stacks[0].Outputs) {
        $outputs[$output.OutputKey] = $output.OutputValue
    }

    # Set environment variables from outputs
    $env:QUEUE_URL = $outputs['QueueUrl']
    $env:DLQ_URL = $outputs['DLQUrl']
    $env:TABLE_NAME = $outputs['TableName']
    $env:MOVIE_JSON_BUCKET_NAME = $outputs['MovieJsonBucketName']
    $env:ASSET_BUCKET_NAME = $outputs['AssetBucketName']
    $env:CLOUDFRONT_URL = $outputs['CloudFrontUrl']
    $env:BUDGET_TOPIC_ARN = $outputs['BudgetTopicArn']

    # Output environment variables for local dev
    "QUEUE_URL=$env:QUEUE_URL\n" +
    "DLQ_URL=$env:DLQ_URL\n" +
    "TABLE_NAME=$env:TABLE_NAME\n" +
    "MOVIE_JSON_BUCKET_NAME=$env:MOVIE_JSON_BUCKET_NAME\n" +
    "ASSET_BUCKET_NAME=$env:ASSET_BUCKET_NAME\n" +
    "CLOUDFRONT_URL=$env:CLOUDFRONT_URL\n" +
    "BUDGET_TOPIC_ARN=$env:BUDGET_TOPIC_ARN\n"
    | Set-Content .env.localstack

    # Export environment variables for this session
    Get-Content .env.localstack | ForEach-Object {
        if ($_ -match "^(\w+)=(.*)$") {
            Set-Item -Path "Env:$($matches[1])" -Value $matches[2]
        }
    }
    Write-Host "[INFO] LocalStack resources are ready."

    # Start frontend (in background)
    Write-Host "[INFO] Running the frontend..."

    Set-Location $PSScriptRoot
    Set-Location ../frontend
    if (-not (Test-Path node_modules)) { pnpm install }
    pnpm run dev
}
finally {
    Set-Location $PSScriptRoot
    Set-Location ..
}