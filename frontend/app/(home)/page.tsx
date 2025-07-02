import { Suspense } from "react";
import { sortOptionSchema } from "../../_lib/types";
import { MovieList } from "./_components/movie-list";
import { searchMovies } from "../../_lib/db/search-movies";
import { z } from "zod";
import { Pagination } from "../../_components/pagination";
import { SearchForm } from "./_components/search-form";
import { searchPageUrlParamsSchema } from "./_lib/url-params";

export default async function Page({ searchParams }: { searchParams?: Promise<unknown> }) {
    const parsedSearchParams = searchParams === undefined ? {} : searchPageUrlParamsSchema.parse(await searchParams);
    const {
        sort,
        genre,
        minRating,
        minMetascore,
        maxPrice,
        page = 1,
    } = parsedSearchParams;
    const { movies, totalPages, genres } = await searchMovies({
        sort,
        genre,
        minRating,
        minMetascore,
        maxPrice,
        page,
    });
    // Here we let nextjs's default error handling take care of any issues with the searchMovies function
    return (
        <main className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Search Movies</h1>
            <SearchForm genres={genres} />
            <Suspense fallback={<div>Loading movies...</div>}>
                <MovieList movies={movies} />
            </Suspense>
            <Pagination page={page} totalPages={totalPages} searchParams={parsedSearchParams} />
        </main>
    );
}
