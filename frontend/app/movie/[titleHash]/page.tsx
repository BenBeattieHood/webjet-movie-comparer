import Image from "next/image";
import { notFound } from "next/navigation";
import { getMovie } from "../../../_lib/db/get-movie";

export default async function Page({ params }: { params: { titleHash: string } }) {
    const movie = await getMovie(params.titleHash);
    if (!movie) {
        notFound();
    }
    const imageUrl = movie.largeImageUrl ?? movie.smallImageUrl
    return (
        <main className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">{movie.title}</h1>
            <div className="mb-4">
                {imageUrl && <Image src={imageUrl} alt={movie.title} width={192} height={288} className="w-48 h-72 object-cover" />}
            </div>
            <div className="mb-2">Genre: {movie.genre}</div>
            <div className="mb-2">Released: {movie.released}</div>
            <div className="mb-2">Metascore: {movie.metascore}</div>
            <div className="mb-2">Rating: {movie.rating}</div>
            <div className="mb-2 font-semibold">Provider Prices:</div>
            <ul className="mb-2 ml-4 list-disc">
                <li>CinemaWorld: <span className="font-mono">${movie.cinemaworldPrice ?? 'Not found'}</span></li>
                <li>FilmWorld: <span className="font-mono">${movie.filmworldPrice ?? 'Not found'}</span></li>
            </ul>
            <div className="mb-2 font-semibold">Cheapest Price: {movie.cinemaworldPrice === undefined && movie.filmworldPrice === undefined ? 'Not found' : <span className="text-green-700">${Math.min(movie.cinemaworldPrice ?? Infinity, movie.filmworldPrice ?? Infinity)}</span>}</div>
            <div className="mt-4 p-2 bg-gray-50 rounded">
                <span className="font-semibold">Price History:</span> <span className="italic text-gray-500">(Coming soon)</span>
            </div>
        </main>
    );
}
