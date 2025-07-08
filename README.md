# WebJet Movie Comparer

This full stack application displays a comparison of prices for movies from two competitor APIs. The APIs are assumed to be randomly failing, and so this application has been designed to demonstrate resilient failure handling.

Note I have switched the frontend over to use mock data to demonstrate the baseline I'd use for smoke testing against. These can be switched to use the infrastructure (or localstack) by uncommenting the code within `frontend\lib\db`. If I were to productionize this, I'd move this into a nextjs automock instead.

## Assumptions

The application design assumes that:

- Movie titles are unique, or at least can be sanitised to be so
- We are running on AWS
- Our development environments are preferred to be Windows machines (based on the C# requirement)

## Approach

The backend design of this application is as follows:

- DynamoDb table, initially empty, designed to hold one record per movie summary (title, cinemaworld price, filmworld price, and some rating metadata)
- S3 bucket, initially empty, designed to hold one blob per movie detail (title, description, rating metadata, and eventually more information), - held separately from the dynamodb data as a cost optimisation for later scaling, but also to demonstrate how the independent lambda steps can be made
- S3 bucket, initially empty, designed to hold static assets
- Unordered SQS queue
- Lambda, which:
  - on recieving a 'query-all' message from the queue, will fetch the API for the appropriate provider (with backoff once) and add 'query-single' messages to the queue for each movie
  - on recieving a 'query-single' message from the queue, will fetch the API for the appropriate provider and movie (with backoff once) and upsert the data into the DynamoDb table, asset bucket, and detail bucket
  - on error, will re-enqueue the message for delayed retry and continue with other queued requests
- Associated IAM permissions and alerts (incl budget), and a baseline dashboard to monitor resource usage

The front end for this is a barebones NextJs application, using tailwind for styling (I'd use tailwind for prototypes, but would migrate to domain-specific styling for productionization for maintainability and optimisations to delivery)

## Exclusions

The code currently EXCLUDES (but allows for addition of) the following, which are excluded for now to show where I'd set the boundary of a code-design prototype's MVP:

- tests, although these would be part of production-readiness
- search, as this is out of scope for this demonstration, but would likely
- login/auth/favs/etc, as these are not included as part of the scope
- front end CSS (tailwind is used as a mvp, but I would at least change this to tailwind apply if not use a more baselevel framework such as vanilla css js)
- front end observability and error monitoring
- performance optimisations (eg indexes, cdn, more careful splitting)

## Demo

As outlined above, the front end is currently configured to run in isolation from backend, using randomized data, to demonstrate a baseline for building smoke tests. Uncomment the lines within `frontend\lib\db` to switch back to using the infrastructure.

The above infrastructure, as well as a dev setup of the front end, can either be run locally using localstack as follows if you have docker and localstack installed and configured already:

```powershell
./localdev/start-localdev.sh
```

...or, can be deployed to a AWS free tier (staging or prod) and run from there.
