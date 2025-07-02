# Frontend

This folder contains the frontend for the Movie Comparer app.

## Install

To install dependencies, run:
```powershell
npm install -g pnpm
pnpm install
```

## Dev

This frontend app requires environment variables of the dynamodb & s3 stores, and so is easiest to run locally alongside localstack via `~/localdev/start-localdev.ps1` rather than directly.

However, if you _do_ want to run this yourself, then set up `./.env.development.local` to include the correct environment variables, and then start in dev mode as follows:

```powershell
pnpm run dev
```

To run lint:
```powershell
pnpm run lint
```

## Deploy

Deployment of this app should be performed via the infrastructure project in `~/infra`.