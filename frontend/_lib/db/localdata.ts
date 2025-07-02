import { MovieDetail } from "../types";
import { faker } from "@faker-js/faker";

// I use generated data here for local development, to ensure our devs (in this case, me ;D) don't test or develop against preknown data.

export const generatedTestMovieData: MovieDetail[] = Array.from({ length: 100 }, (_, i) => ({
    title: faker.lorem.words(3),
    titleHash: faker.string.uuid(),
    genre: faker.helpers.arrayElement(['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi']),
    released: faker.date.past({ years: 20 }).toISOString().split('T')[0],
    metascore: faker.number.int({ min: 0, max: 100 }),
    rating: faker.number.float({ min: 0, max: 10 }),
    smallImageUrl: faker.image.urlLoremFlickr({ category: 'movies', width: 200, height: 300 }),
    largeImageUrl: faker.image.urlLoremFlickr({ category: 'movies', width: 400, height: 600 }),
    cinemaworldPrice: faker.number.float({ min: 5, max: 20 }),
    filmworldPrice: faker.number.float({ min: 5, max: 20 }),
    priceHistory: Array.from({ length: 5 }, () => ({
        date: faker.date.past({ years: 2 }).toISOString().split('T')[0],
        price: faker.number.float({ min: 5, max: 20 }),
        provider: faker.helpers.arrayElement(['CinemaWorld', 'FilmWorld']),
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    description: faker.lorem.paragraph(),
    actors: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => faker.person.fullName()),
    director: faker.person.fullName(),
    writer: faker.person.fullName(),
    imdbRating: faker.number.float({ min: 0, max: 10 }),
    imdbId: faker.string.uuid(),
    imdbUrl: `https://www.imdb.com/title/${faker.string.uuid()}/`,
    runtime: faker.number.int({ min: 60, max: 180 }),
    trailerUrl: `https://www.youtube.com/watch?v=${faker.string.uuid()}`,
    reviews: Array.from({ length: faker.number.int({ min: 1, max: 10 }) }, () => ({
        rating: faker.number.float({ min: 0, max: 10 }),
        comment: faker.lorem.sentence(),
        reviewer: faker.person.fullName(),
        date: faker.date.past({ years: 2 }).toISOString().split('T')[0],
    })),
    similarMovies: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
        title: faker.lorem.words(3),
        titleHash: faker.string.uuid(),
        smallImageUrl: faker.image.urlLoremFlickr({ category: 'movies', width: 200, height: 300 }),
        largeImageUrl: faker.image.urlLoremFlickr({ category: 'movies', width: 400, height: 600 }),
    })),
}));