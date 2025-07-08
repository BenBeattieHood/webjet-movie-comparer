import { SearchPageUrlParams } from "../url-params";
import { MovieDetail, MovieSummary } from "../types";

export function sortMovies<Movie extends MovieSummary | MovieDetail>(movies: Movie[], sort: string): Movie[] {
    switch (sort) {
        case "release":
            return [...movies].sort((a, b) => (a.released ?? '').localeCompare(b.released ?? ''));
        case "metascore":
            return [...movies].sort((a, b) => (b.metascore ?? 0) - (a.metascore ?? 0));
        case "rating":
            return [...movies].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        case "price":
            return [...movies].sort((a, b) => Math.min(a.cinemaworldPrice ?? Infinity, a.filmworldPrice ?? Infinity) - Math.min(b.cinemaworldPrice ?? Infinity, b.filmworldPrice ?? Infinity));
        default:
            return movies;
    }
}

export function filterMovies<Movie extends MovieSummary | MovieDetail>(movies: Movie[], filters: Pick<SearchPageUrlParams, "genre" | "minRating" | "minMetascore" | "maxPrice">): Movie[] {
    return movies.filter((movie) => {
        if (filters.genre && movie.genre !== filters.genre) return false;
        if (filters.minRating && (movie.rating === undefined || movie.rating <= filters.minRating)) return false;
        if (filters.minMetascore && (movie.metascore === undefined || movie.metascore <= filters.minMetascore)) return false;
        if (filters.maxPrice && Math.min(movie.cinemaworldPrice ?? Infinity, movie.filmworldPrice ?? Infinity) >= filters.maxPrice) return false;
        return true;
    });
}

// Pagination helper
export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
}
