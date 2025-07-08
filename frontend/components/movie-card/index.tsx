import Image from "next/image"
import { Star, Search } from "lucide-react"

import { Card, CardContent } from "@/components/generic/card"
import { getProviderColor } from "@/lib/get-provider-color"
import Link from "next/link"
import { MovieSummary } from "../../lib/types"

export const MovieCard: React.FC<Pick<MovieSummary,
    | "titleHash"
    | "smallImageUrl"
    | "title"
    | "rating"
    | "released"
    | "prices"
>> = ({
    titleHash,
    smallImageUrl,
    title,
    rating,
    released,
    prices,
}) => {
        return (<Link
            key={titleHash}
            href={`/movie/${titleHash}`}
        >
            <Card className="group cursor-pointer overflow-hidden border-0 bg-transparent shadow-none transition-all duration-300 hover:scale-105">
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-muted">
                    <Image
                        src={smallImageUrl || "/placeholder.svg"}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                            <Search className="h-8 w-8 text-white fill-current" />
                        </div>
                    </div>

                    {/* Rating Badge */}
                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm rounded-md px-2 py-1 flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-white text-xs font-medium">{rating}</span>
                    </div>
                </div>

                <CardContent className="p-0 pt-4">
                    <h3 className="font-semibold line-clamp-1 mb-2 leading-tight">{title}</h3>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                        <span>{released}</span>
                    </div>

                    {/* Platform Icons */}
                    <div className="flex items-center gap-1">
                        {prices.length === 0 && (
                            <div className="flex-1 w-6 h-6 rounded-sm bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                No Prices Yet
                            </div>
                        )}
                        {prices.slice(0, 4).map((price, index) => (
                            <div
                                key={index}
                                className={`flex-1 w-6 h-6 rounded-sm flex items-center justify-center text-xs ${getProviderColor(price.provider)}`}
                                title={`${price.provider} - ${price.price}`}
                            >
                                {price.provider.charAt(0).toUpperCase()}
                            </div>
                        ))}
                        {prices.length > 4 && (
                            <div className="flex-1 w-6 h-6 rounded-sm bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                +{prices.length - 4}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
        );
    }