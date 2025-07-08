import Image from "next/image"
import { Star, StarOff, Calendar, TrendingUpDown, ThumbsDown, ThumbsUp } from "lucide-react"

import { Badge } from "@/components/generic/badge"
import { MovieDetail } from "../../lib/types"

export const Hero: React.FC<React.PropsWithChildren<Pick<MovieDetail,
    | "largeImageUrl"
    | "title"
    | "released"
    | "metascore"
    | "rating"
    | "genre"
    | "description"
>>> = ({
    largeImageUrl,
    title,
    released,
    metascore,
    rating,
    genre,
    description,
    children,
}) => (
        <section className="relative h-[60vh] overflow-hidden">
            <div className="absolute inset-0">
                <Image
                    src={largeImageUrl || "/placeholder.svg"}
                    alt={title}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            <div className="relative container px-6 h-full flex items-end pb-16">
                <div className="max-w-2xl text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            Featured
                        </Badge>
                        <div className="flex items-center gap-2 text-sm text-white/80">
                            <Calendar className="h-4 w-4" />
                            {released ?? 'Unknown Release Date'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-white/80">
                            {metascore === undefined ?
                                <>
                                    <TrendingUpDown className="h-4 w-4" />
                                </>
                                : metascore > 60 ?
                                    <>
                                        <ThumbsUp className="h-4 w-4" />
                                        positive
                                    </>
                                    : <>
                                        <ThumbsDown className="h-4 w-4" />
                                        negative
                                    </>}
                        </div>
                        {rating &&
                            <div className="flex items-center gap-1 text-sm text-white/80">
                                {rating >= 5 ?
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    :
                                    <StarOff className="h-4 w-4 text-yellow-400" />
                                }
                                {rating}
                            </div>
                        }
                    </div>

                    <h1 className="text-5xl font-bold mb-4 leading-tight">{title}</h1>

                    <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="outline" className="border-white/30 text-white/90 bg-white/10">
                            {genre}
                        </Badge>
                    </div>

                    <p className="text-lg text-white/90 mb-6 leading-relaxed max-w-xl">{description}</p>

                    {children}
                </div>
            </div>
        </section>
    );
