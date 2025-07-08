import { notFound } from "next/navigation"

import { Header } from "../../../components/header"
import { getMovie } from "../../../lib/db/get-movie"
import { Hero } from "../../../components/hero"
import { searchMovies } from "../../../lib/db/search-movies"
import { getLowestPrice } from "../../../lib/get-lowest-price"
import { PriceList } from "./_components/price-list"

interface PageProps {
    params: Promise<{
        titleHash: string
    }>
}

export default async function MoviePage({ params }: PageProps) {
    const movie = await getMovie((await params).titleHash)

    if (!movie) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-background">
            <Header backHref="/" backLabel="Back to Movies" />

            <Hero {...movie} />

            <main className="container px-6 py-12">
                <div className="max-w-6xl mx-auto space-y-12">
                    <section>
                        <PriceList prices={movie.prices} />
                    </section>
                </div>
            </main>
        </div>
    )
}

export async function generateStaticParams() {
    const { movies } = await searchMovies({})
    return movies.map((movie) => ({
        titleHash: movie.titleHash,
    }))
}

export async function generateMetadata({ params }: PageProps) {
    const movie = await getMovie((await params).titleHash)

    if (!movie) {
        return {
            title: "Movie Not Found",
        }
    }

    return {
        title: `${movie.title} (${movie.released}): ${getLowestPrice(movie.prices)?.price ?? "N/A"}`,
        description: movie.description,
    }
}
