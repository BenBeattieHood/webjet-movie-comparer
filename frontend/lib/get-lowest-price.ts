import { ProviderPrice } from "./types";

export const getLowestPrice = (prices: ProviderPrice[]): ProviderPrice | null =>
    prices.reduce<ProviderPrice | null>((lowest, current) => {
        if (!lowest) return current;
        return current.price < lowest.price ? current : lowest;
    }, null);