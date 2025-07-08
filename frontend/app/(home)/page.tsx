import { Search, ChevronRight } from "lucide-react"

import { Button } from "@/components/generic/button"
import { searchMovies } from "@/lib/db/search-movies"
import { searchPageUrlParamsSchema } from "../../lib/url-params"
import { getMovie } from "@/lib/db/get-movie"
import { Header } from "@/components/header"
import Link from "next/link"
import { SearchForm } from "../../components/search-form"
import { MoviesGrid } from "../../components/movies-grid"
import { Hero } from "../../components/hero"

export default async function Page({ searchParams }: { searchParams?: Promise<any> }) {
    const parsedSearchParams = searchParams === undefined ? {} : searchPageUrlParamsSchema.parse({ ...(await searchParams) });
    const {
        sort,
        genre,
        minRating,
        minMetascore,
        maxPrice,
        page = 1,
    } = parsedSearchParams;
    const { movies } = await searchMovies({
        sort,
        genre,
        minRating,
        minMetascore,
        maxPrice,
        page,
    });

    const featuredMovieHash = (movies.find((m) => m.isFeatured) ?? movies[0])?.titleHash;
    const featuredMovie = (await getMovie(featuredMovieHash))!;

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <Hero {...featuredMovie}>
                <div className="flex items-center gap-4">
                    <Link href={`/movie/${featuredMovie.titleHash}`}>
                        <Button size="lg" className="gap-2 bg-white text-black hover:bg-white/90">
                            <Search className="h-4 w-4 fill-current" />
                            View
                        </Button>
                    </Link>
                </div>
            </Hero>

            <main className="container px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Popular Movies</h2>
                        <p className="text-muted-foreground text-lg">Compare prices across the latest releases</p>
                    </div>
                    <Link href="/movies">
                        <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                            View All
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                <MoviesGrid movies={movies} emptyStateSuggestion="Try adjusting your search or filters" />
            </main>
        </div>
    )
}
