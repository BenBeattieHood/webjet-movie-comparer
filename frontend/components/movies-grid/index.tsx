import { MovieSummary } from "../../lib/types"
import { EmptyState } from "../empty-state";
import { MovieCard } from "../movie-card";

export const MoviesGrid: React.FC<{ movies: MovieSummary[], emptyStateSuggestion?: string }> = ({ movies, emptyStateSuggestion }) =>
    movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {movies.map((movie) => (
                <MovieCard
                    key={movie.titleHash}
                    {...movie}
                />
            ))}
        </div>
    )
        : (
            <EmptyState suggestion={emptyStateSuggestion} />
        )
    ;