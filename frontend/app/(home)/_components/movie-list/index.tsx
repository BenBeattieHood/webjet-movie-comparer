import Link from "next/link";
import { MovieSummary } from "../../../../_lib/types";

export function MovieList({ movies }: { movies: MovieSummary[] }) {
    if (!movies.length) return <div>No movies found.</div>;
    return (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {movies.map((movie) => (
                <li key={movie.titleHash} className="border rounded p-4 flex flex-col items-center">
                    <Link href={`/movie/${movie.titleHash}`} className="w-full flex flex-col items-center">
                        {movie.smallImageUrl && <img src={movie.smallImageUrl} alt={movie.title} className="w-32 h-48 object-cover mb-2" />}
                        <div className="font-bold text-lg mb-1">{movie.title}</div>
                        <div className="text-sm text-gray-500 mb-1">{movie.genre ?? 'Unknown'}</div>
                        <div className="text-sm">Released: {movie.released ?? 'Unknown'}</div>
                        <div className="text-sm">Metascore: {movie.metascore ?? 'Unknown'}</div>
                        <div className="text-sm">Rating: {movie.rating ?? 'Unknown'}</div>
                        <div className="text-sm font-semibold mt-2">
                            {
                                (movie.cinemaworldPrice && movie.filmworldPrice)
                                    ? <>
                                        Cheapest: ${Math.min(movie.cinemaworldPrice ?? Infinity, movie.filmworldPrice ?? Infinity)}
                                        ({(movie.cinemaworldPrice ?? Infinity) <= (movie.filmworldPrice ?? Infinity) ? 'CinemaWorld' : 'FilmWorld'})
                                    </>
                                    : 'Prices not available'
                            }
                        </div>
                    </Link>
                </li>
            ))}
        </ul>
    );
}
