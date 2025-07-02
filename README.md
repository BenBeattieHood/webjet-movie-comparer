# WebJet Movie Comparer

This full stack application displays a comparison of prices for movies from two competitor APIs. The APIs are assumed to be randomly failing, and so this application has been designed to demonstrate resilient failure handling.

The application design assumes that:

- Movie titles are unique, or at least can be sanitised to be so
- We are running on AWS
- Our development environments are preferred to be Windows machines (based on the C# requirement)

The infrastructure of this application is as follows:

- DynamoDb table, initially empty, designed to hold one record per movie summary (title, cinemaworld price, filmworld price, and some rating metadata)
- S3 bucket, initially empty, designed to hold one blob per movie detail (title, description, rating metadata, and eventually more information), - a cost optimisation for later scaling, but also to demonstrate how the independent lambda steps can be made
- S3 bucket, initially empty, designed to hold static assets
- Unordered SQS queue
- Lambda, which:
  - on recieving a 'query-all' message from the queue, will fetch the API for the appropriate provider (with backoff once) and add 'query-single' messages to the queue for each movie
  - on recieving a 'query-single' message from the queue, will fetch the API for the appropriate provider and movie (with backoff once) and store the data in the DynamoDb table, asset bucket, and detail bucket
  - on error, will re-enqueue the message for later retry
- Associated IAM permissions and alerts, and a dashboard to monitor resource usage

The code allows for but excludes the following, which are excluded for now to show where I'd set the boundary of a code-design prototype's MVP:

- tests, although these would be part of production-readiness
- search, as this is out of scope for this demonstration, but would likely
- login/auth/favs/etc, as these are not included as part of the scope
- front end CSS (tailwind is used as a mvp, but I would at least change this to tailwind apply if not use a more baselevel framework such as vanilla css js)
- front end observability and error monitoring
- performance optimisations (eg indexes, cdn, more careful splitting)

The above infrastructure, as well as a dev setup of the front end, can be run locally using localstack as follows:

```powershell
./localdev/start-localdev.sh
```
