import { SearchForm } from "../../components/search-form"
import { searchMovies } from "../../lib/db/search-movies"
import { searchPageUrlParamsSchema } from "../../lib/url-params"
import { MoviesGrid } from "../../components/movies-grid"
import { Pagination } from "../../components/pagination"
import { Header } from "../../components/header"

interface PageProps {
    searchParams: Promise<unknown>
}

export default async function Page({ searchParams }: PageProps) {
    const parsedSearchParams = searchParams === undefined ? {} : searchPageUrlParamsSchema.parse(await searchParams);
    const {
        sort,
        genre,
        minRating,
        minMetascore,
        maxPrice,
        page = 1,
        show = 50,
    } = parsedSearchParams;
    const { movies, totalPages, genres } = await searchMovies({
        sort,
        genre,
        minRating,
        minMetascore,
        maxPrice,
        page,
        show,
    });
    const stringSearchParams = Object.fromEntries(Object.entries(parsedSearchParams).map(([k, v]) => [k, String(v)] as const));

    return (
        <div className="min-h-screen bg-background">
            <Header backHref="/" backLabel="Back to Home" />

            <main className="container px-6 py-8">
                <SearchForm genres={genres} />

                <MoviesGrid movies={movies} emptyStateSuggestion="Try adjusting your search or filters" />

                <Pagination currentPage={page} totalPages={totalPages} basePath="/movies" searchParams={stringSearchParams} />

            </main>
        </div>
    )
}
