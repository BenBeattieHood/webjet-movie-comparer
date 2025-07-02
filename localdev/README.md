# Local Development for Webjet Movie Comparer

This setup allows you to run the entire stack locally using LocalStack for AWS resources and Next.js for the frontend.

## Quick Start

From this folder, run:

**Bash:**
```bash
./start-localdev.sh
```
**PowerShell:**
```powershell
./start-localdev.sh
```

This will:
- Start LocalStack (via Docker Compose)
- Create all required AWS resources (DynamoDB, S3, SQS, Secrets Manager)
- Output and export environment variables for local dev
- Start the Next.js frontend (on http://localhost:3000)
- Open your browser to the site

## Backend Lambda

To run the backend Lambda locally (in a new terminal, with the same environment variables loaded):

**Bash:**
```bash
cd backend/MovieComparerProcessor/src/MovieComparerProcessor
# Example using Amazon.Lambda.Tools:
dotnet lambda invoke-function FunctionHandler --payload '{"Records":[]}'
# Or use your preferred .NET Lambda runner or test harness
```
**PowerShell:**
```powershell
cd backend/MovieComparerProcessor/src/MovieComparerProcessor
# Example using Amazon.Lambda.Tools:
dotnet lambda invoke-function FunctionHandler --payload '{"Records":[]}'
# Or use your preferred .NET Lambda runner or test harness
```

## Stopping Local Development

To stop LocalStack and the Next.js dev server:

**Bash:**
```bash
# Stop LocalStack
  docker-compose down
# Stop Next.js (if running in background)
  pkill -f "pnpm dev"
```
**PowerShell:**
```powershell
# Stop LocalStack
  docker-compose down
# Stop Next.js (if running in background)
  Get-Process | Where-Object { $_.Path -like '*pnpm*' -and $_.ProcessName -eq 'node' } | Stop-Process
```

---

For more details, see `./start-localdev.sh` and your Lambda/Next.js configuration.
