import { Star, ExternalLink } from "lucide-react";

import { ProviderPrice } from "@/lib/types";
import { Button } from "@/components/generic/button";
import { Badge } from "@/components/generic/badge";
import { Card, CardContent } from "@/components/generic/card";
import { getLowestPrice } from "@/lib/get-lowest-price";
import { getProviderColor } from "@/lib/get-provider-color";
import { EmptyState } from "@/components/empty-state";

export const PriceList: React.FC<{
    prices: ProviderPrice[]
}> = ({ prices }) => {
    const lowestPrice = getLowestPrice(prices)

    return (
        <>
            <h2 className="text-2xl font-bold mb-6">Prices</h2>
            <div className="grid gap-4">
                {prices.length === 0 ? (
                    <EmptyState
                        message="No Prices Available"
                        suggestion="Our providers are still indexing this movie. Please check back later."
                    />
                ) : prices
                    .slice()
                    .sort((a, b) => a.price - b.price || a.provider.localeCompare(b.provider))
                    .map((price, index) => (
                        <Card key={index} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${getProviderColor(price.provider)}`}
                                        >
                                            {price.provider.at(0)?.toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-lg">{price.provider}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {
                                            lowestPrice &&
                                            lowestPrice.provider === price.provider &&
                                            lowestPrice.price === price.price && (
                                                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 gap-2">
                                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                    Best Price
                                                </Badge>
                                            )
                                        }
                                        <div className="font-bold text-2xl">${price.price}</div>
                                        <Button className="gap-2">
                                            <ExternalLink className="h-4 w-4" />
                                            Visit
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
            </div>
        </>
    );
}