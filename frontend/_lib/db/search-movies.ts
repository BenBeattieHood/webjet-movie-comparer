import { MovieSummary } from "../types";
import { filterMovies, sortMovies, paginate } from "./localdata-utils";
import { generatedTestMovieData } from "./localdata";
import { SearchPageUrlParams } from "../../app/(home)/_lib/url-params";

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

export async function searchMovies(
    searchParams: SearchPageUrlParams,
): Promise<{ movies: MovieSummary[]; totalPages: number, genres: string[] }> {
    const page = Math.max(1, searchParams?.page || 1);
    const pageSize = 12;

    // To use localstack, replace the code below with this commented out code:
    // const data = await client.send(new ScanCommand({ TableName: movieSummaryDynamoTableName })); // Full table scan, see note below around productionization for this function
    // const movies = (data.Items ?? []).map((item) => movieSummarySchema.parse(unmarshall(item)));
    const movies = generatedTestMovieData;

    // Note: the below is because this repo is proof of concept code for robustness not searching. Building a real system, I'd use a search/index on top of the DB to filter/sort the values PRIOR to loading them in memory - but I want to demonstrate here the need for pragmatism in an initial cut.
    const filteredMovies = filterMovies(movies, searchParams);
    const sortedMovies = searchParams.sort ? sortMovies(filteredMovies, searchParams.sort) : filteredMovies;
    const pagedMovies = paginate(sortedMovies, page, pageSize);
    const totalPages = Math.ceil(sortedMovies.length / pageSize);

    return {
        movies: pagedMovies,
        totalPages,
        genres: Array.from(new Set(movies.map(m => m.genre))).filter(Boolean) as string[],
    }
}