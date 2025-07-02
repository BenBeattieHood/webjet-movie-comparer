import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { MovieDetail, movieDetailSchema } from "../types";
import { generatedTestMovieData } from "./localdata";

// Process env variables are loaded in during infrastructure deployment:
// const s3 = new S3Client({
//     region: process.env.AWS_REGION,
//     endpoint: process.env.AWS_ENDPOINT,
//     credentials: {
//         accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
//         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
//     },
//     forcePathStyle: true,
// });
// const movieDetailS3BucketName = process.env.MOVIE_DETAIL_S3_BUCKET_NAME!;

export async function getMovie(titleHash: string): Promise<MovieDetail | null> {
    // To use localstack, replace the code below with this commented out code:
    // const res = await s3.send(
    //     new GetObjectCommand({ Bucket: movieDetailS3BucketName, Key: `${titleHash.toLowerCase()}.json` })
    // );
    // const body = await res.Body?.transformToString();
    // return body ? movieDetailSchema.parse(JSON.parse(body)) : null;

    return generatedTestMovieData.find(movie => movie.titleHash === titleHash) || null;
}