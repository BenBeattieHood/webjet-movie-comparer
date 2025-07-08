import z from "zod";
import { movieDetailSchema, MovieDetail, movieSummarySchema, MovieSummary } from "../types";
import { faker } from "@faker-js/faker";

// I use generated data here for local development, to ensure our devs (in this case, me ;D) don't test or develop against preknown data.

type ShallowMerge<A, B> = Omit<A, keyof B> & B;

type TestMovieData = ShallowMerge<MovieSummary, MovieDetail>[];

// Restart the node process if you change this function, as the result is cached in process.env.LOCAL_DEV_DATA to support SSR
const generateTestMovieData = (): ShallowMerge<MovieSummary, MovieDetail>[] => Array.from({ length: 100 }, () => ({
    title: faker.book.title(),
    titleHash: faker.string.uuid(),
    genre: faker.helpers.arrayElement(['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi']),
    released: faker.date.past({ years: 20 }).toISOString().split('T')[0],
    metascore: faker.number.float({ min: 0, max: 100, fractionDigits: 1 }),
    rating: faker.number.float({ min: 0, max: 10, fractionDigits: 1 }),
    smallImageUrl: faker.image.urlPicsumPhotos({ width: 200, height: 300, blur: 0 }),
    largeImageUrl: faker.image.urlPicsumPhotos({ width: 1800, height: 900, blur: 0 }),
    prices: [
        Math.random() > 0.5 ? {
            provider: 'CinemaWorld',
            price: faker.number.float({ min: 5, max: 20, fractionDigits: 2 }),
        } : null,
        Math.random() > 0.5 ? {
            provider: 'FilmWorld',
            price: faker.number.float({ min: 5, max: 20, fractionDigits: 2 }),
        } : null,
    ].filter(Boolean) as { provider: string; price: number }[],
    isFeatured: faker.datatype.boolean(),
    priceHistory: Array.from({ length: 5 }, () => ({
        date: faker.date.past({ years: 2 }).toISOString().split('T')[0],
        price: faker.number.int({ min: 5, max: 20 }),
        provider: faker.helpers.arrayElement(['CinemaWorld', 'FilmWorld']),
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    description: faker.lorem.paragraph(),
    actors: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => faker.person.fullName()),
    director: faker.person.fullName(),
    writer: faker.person.fullName(),
    imdbRating: faker.number.int({ min: 0, max: 10 }),
    imdbId: faker.string.uuid(),
    imdbUrl: `https://www.imdb.com/title/${faker.string.uuid()}/`,
    runtime: faker.number.int({ min: 60, max: 180 }),
    trailerUrl: `https://www.youtube.com/watch?v=${faker.string.uuid()}`,
    reviews: Array.from({ length: faker.number.int({ min: 1, max: 10 }) }, () => ({
        rating: faker.number.int({ min: 0, max: 10 }),
        comment: faker.lorem.sentence(),
        reviewer: faker.person.fullName(),
        date: faker.date.past({ years: 2 }).toISOString().split('T')[0],
    })),
    similarMovies: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
        title: faker.book.title(),
        titleHash: faker.string.uuid(),
        smallImageUrl: faker.image.urlLoremFlickr({ category: 'movies', width: 200, height: 300 }),
        largeImageUrl: faker.image.urlLoremFlickr({ category: 'movies', width: 400, height: 600 }),
    })),
}));

export const generatedTestMovieData = process.env.LOCAL_DEV_DATA !== undefined ? z.array(movieSummarySchema.and(movieDetailSchema)).parse(JSON.parse(process.env.LOCAL_DEV_DATA!)) : generateTestMovieData();
process.env.LOCAL_DEV_DATA = process.env.LOCAL_DEV_DATA ?? JSON.stringify(generatedTestMovieData);