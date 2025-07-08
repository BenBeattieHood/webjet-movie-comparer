import { generatedTestMovieData } from "./localdata";

// Process env variables are loaded in during infrastructure deployment:
// const client = new DynamoDBClient({
//     region: process.env.AWS_REGION,
//     endpoint: process.env.AWS_ENDPOINT,
//     credentials: {
//         accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
//         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
//     },
// });
// const movieSummaryDynamoTableName = process.env.MOVIE_SUMMARY_DYNAMO_TABLE_NAME!;

export const getAllMovieTitleHashes = async (): Promise<string[]> => {
    // To use localstack, replace the code below with this commented out code:
    // const data = await client.send(new ScanCommand({ TableName: movieSummaryDynamoTableName })); // Full table scan, see note below around productionization for this function
    // const movies = (data.Items ?? []).map((item) => movieSummarySchema.parse(unmarshall(item)));
    const movies = generatedTestMovieData;
    return movies.map(movie => movie.titleHash);
}