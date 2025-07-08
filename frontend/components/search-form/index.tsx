'use client'

import { useState } from "react";
import { useDebouncedCallback } from 'use-debounce';
import { metascoreSchema, priceSchema, ratingSchema, sortOptionSchema } from "@/lib/types";
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { SearchPageUrlParams, searchPageUrlParamsSchema } from "@/lib/url-params";
import { Checkbox } from "@radix-ui/react-checkbox";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@radix-ui/react-collapsible";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@radix-ui/react-select";
import { Slider } from "@radix-ui/react-slider";
import { Search, X, SlidersHorizontal, Star, DollarSign } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../generic/card";
import { Input } from "../generic/input";
import { Button } from "../generic/button";
import { Label } from "../generic/label";
import Link from "next/link";
import { Badge } from "../generic/badge";

interface SearchFormProps {
    genres: string[];
}

export const SearchForm: React.FC<SearchFormProps> = ({ genres }) => {
    const [error, setError] = useState<string>();
    const searchParams = useSearchParams();
    const {
        sort,
        genre,
        minRating,
        minMetascore,
        maxPrice,
    } = searchPageUrlParamsSchema.parse({ ...searchParams });

    const pathname = usePathname();
    const { replace } = useRouter();

    const onChangeDebounced = useDebouncedCallback((sortAndFilters: Partial<SearchPageUrlParams>) => {
        const newSearchParams = {
            sort,
            genre,
            minRating,
            minMetascore,
            maxPrice,
            ...sortAndFilters,
            page: 1 // Reset to first page on filter change
        } satisfies SearchPageUrlParams;
        const newSearchParamsAsStrings = Object.fromEntries(Object.entries(newSearchParams).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, String(v)] as const));
        setError(undefined);
        replace(`${pathname}?${new URLSearchParams(newSearchParamsAsStrings).toString()}`);
    }, 300);

    const hasActiveFilters = Boolean(
        sort ||
        genre ||
        minRating ||
        minMetascore ||
        maxPrice
    );

    const clearFilters = () => {
        setError(undefined);
        replace(`${pathname}?${new URLSearchParams({ page: "1" }).toString()}`);
    };

    return (
        <>
            {error && <div className="mb-4 p-2 bg-blue-600 bg-red-600 bg-grey-600 bg-red-100 text-red-700 rounded">{error}</div>}

            <form className="space-y-6 block">
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Search className="h-5 w-5" />
                                Search & Filters
                            </CardTitle>
                            {hasActiveFilters && (
                                <Link href="/movies">
                                    <Button variant="ghost" size="sm" className="gap-2">
                                        <X className="h-4 w-4" />
                                        Clear All
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Sort By */}
                        <div className="space-y-2">
                            <Label>Sort By</Label>
                            <Select
                                name="sort"
                                defaultValue={sort}
                                onValueChange={(value) => onChangeDebounced({ sort: value ? sortOptionSchema.parse(value) : undefined })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="release">Release Date</SelectItem>
                                    <SelectItem value="metascore">Metascore</SelectItem>
                                    <SelectItem value="rating">Rating</SelectItem>
                                    <SelectItem value="price">Cheapest Price</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Genres */}
                        {/* I keep feeling like genres should be a list/array per movie, and this search would be a multiselect - but I'd leave this here as a prototype and talk about it with the PM first */}
                        <Collapsible>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                                    <Label className="cursor-pointer">
                                        Genres {genres !== undefined && `(1)`}
                                    </Label>
                                    <SlidersHorizontal className="h-4 w-4" />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-3 pt-3">
                                <div className="grid grid-cols-2 gap-3">
                                    {genres.map((g) => (
                                        <div key={g} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={g}
                                                defaultChecked={genre === g}
                                                onCheckedChange={(checked) => onChangeDebounced({ genre: checked ? g : undefined })}
                                                className="h-4 w-4"
                                            />
                                            <Label htmlFor={g} className="text-sm cursor-pointer">
                                                {g}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {genres.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {[genre].map((genre) => (
                                            <Badge key={genre} variant="secondary" className="gap-1">
                                                {genre}
                                                <X className="h-3 w-3 cursor-pointer" onClick={() => onChangeDebounced({ genre: undefined })} />
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </CollapsibleContent>
                        </Collapsible>

                        {/* Rating Filter */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <Label>Minimum Rating: {minRating === undefined ? "Any" : minRating.toFixed(1)}</Label>
                            </div>
                            <Slider
                                defaultValue={[minRating ?? 0]}
                                onValueChange={([value]) => onChangeDebounced({ minRating: ratingSchema.parse(value) })}
                                max={ratingSchema.maxValue ?? 10}
                                min={ratingSchema.minValue ?? 0}
                                step={1}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{ratingSchema.minValue ?? 0}</span>
                                <span>{ratingSchema.maxValue ?? 10}</span>
                            </div>
                        </div>

                        {/* Metascore Filter */}
                        <div className="space-y-3">
                            <Label>Minimum Metascore: {minMetascore === undefined ? "Any" : minMetascore.toFixed(1)}</Label>
                            <Slider
                                defaultValue={[minMetascore ?? 0]}
                                onValueChange={([value]) => onChangeDebounced({ minMetascore: metascoreSchema.parse(value) })}
                                max={metascoreSchema.maxValue ?? 100}
                                min={metascoreSchema.minValue ?? 0}
                                step={1}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{metascoreSchema.minValue ?? 0}</span>
                                <span>{metascoreSchema.maxValue ?? 10}</span>
                            </div>
                        </div>

                        {/* Max Price Filter */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-green-500" />
                                <Label>Maximum Price: {maxPrice === undefined ? "Any" : `$${maxPrice.toFixed(2)}`}</Label>
                            </div>
                            <Slider
                                defaultValue={[maxPrice ?? Infinity]}
                                onValueChange={([value]) => onChangeDebounced({ maxPrice: priceSchema.parse(value) })}
                                max={50}
                                min={0}
                                step={0.99}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Free</span>
                                <span>$50+</span>
                            </div>
                        </div>

                        {/* Active Filters Summary */}
                        {hasActiveFilters && (
                            <div className="pt-4 border-t">
                                <div className="flex items-center justify-between mb-3">
                                    <Label className="text-sm font-medium">Active Filters</Label>
                                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                                        Clear All
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {sort !== undefined && <Badge variant="outline">Sort: {sort}</Badge>}
                                    {[genre].map((genre) => (
                                        <Badge key={genre} variant="outline">
                                            {genre}
                                        </Badge>
                                    ))}
                                    {minRating !== undefined && <Badge variant="outline">Rating: {minRating.toFixed(1)}+</Badge>}
                                    {minMetascore !== undefined && <Badge variant="outline">Metascore: {minMetascore}+</Badge>}
                                    {maxPrice !== undefined && <Badge variant="outline">Price: ≤${maxPrice.toFixed(2)}</Badge>}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </form>
        </>
    )
};