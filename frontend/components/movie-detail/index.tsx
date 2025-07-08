
import { Badge } from "@/components/generic/badge"
import { DialogHeader, DialogTitle } from "@/components/generic/dialog"

import { Star } from "lucide-react"
import { getMovie } from "@/lib/db/get-movie"
import Image from "next/image"
import { getProviderColor } from "@/lib/get-provider-color"

interface MovieDetailProps {
    selectedMovieTitleHash: string;
}

export const MovieDetail: React.FC<MovieDetailProps> = async ({ selectedMovieTitleHash }) => {
    const selectedMovie = await getMovie(selectedMovieTitleHash);
    if (!selectedMovie) {
        return null;
    }

    return (
        <>
            <DialogHeader className="sr-only">
                <DialogTitle>{selectedMovie.title}</DialogTitle>
            </DialogHeader>

            {/* Hero Section */}
            <div className="relative h-80 overflow-hidden">
                <Image
                    src={selectedMovie.largeImageUrl || "/placeholder.svg"}
                    alt={selectedMovie.title}
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute bottom-6 left-6 right-6 text-white">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{selectedMovie.rating}</span>
                        </div>
                        <span>{selectedMovie.released}</span>
                    </div>
                    <h2 className="text-3xl font-bold mb-2">{selectedMovie.title}</h2>
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="border-white/30 text-white bg-white/10">
                            {selectedMovie.genre}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                <div>
                    <h3 className="text-lg font-semibold mb-3">Overview</h3>
                    <p className="text-muted-foreground leading-relaxed">{selectedMovie.description}</p>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-4">Price Comparison</h3>
                    <div className="grid gap-3">
                        {selectedMovie.prices.map((price, index) => (
                            <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${getProviderColor(price.provider)}`}
                                    >
                                        {price.provider.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-medium">{price.provider}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-lg">{price.price}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}