'use client'

import { useState } from "react";
import { useDebouncedCallback } from 'use-debounce';
import { metascoreSchema, priceSchema, ratingSchema, SortOption, sortOptionSchema } from "../../../../_lib/types";
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { SearchPageUrlParams, searchPageUrlParamsSchema } from "../../_lib/url-params";

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
        const newSearchParamsAsStrings = Object.fromEntries(Object.entries(newSearchParams).map(([k, v]) => [k, String(v)] as const));
        setError(undefined);
        replace(`${pathname}?${new URLSearchParams(newSearchParamsAsStrings).toString()}`);
    }, 300);

    return (
        <>
            {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
            <form className="mb-4 flex flex-wrap gap-2 items-end" method="get">
                <label>Sort by:</label>
                <select name="sort" defaultValue={sort} className="border rounded p-1" onChange={(e) => {
                    try {
                        const selectedSort = sortOptionSchema.parse(e.target.value);
                        onChangeDebounced({
                            sort: selectedSort,
                        })
                    } catch (err) {
                        setError("Invalid sort option selected.");
                    }
                }}>
                    <option value="">Default</option>
                    <option value="release">Release Date</option>
                    <option value="metascore">Metascore</option>
                    <option value="rating">Rating</option>
                    <option value="price">Cheapest Price</option>
                </select>
                <label>Genre:</label>
                <select name="genre" defaultValue={genre} className="border rounded p-1" onChange={(e) => {
                    try {
                        const selectedGenre = e.target.value && genres.find(g => g === e.target.value);
                        if (selectedGenre === undefined) {
                            throw new Error("Invalid genre");
                        }
                        onChangeDebounced({
                            genre: selectedGenre,
                        })
                    } catch (err) {
                        setError("Invalid genre selected.");
                    }
                }}>
                    <option value="">All</option>
                    {genres.map((g) => (
                        <option key={g} value={g}>{g}</option>
                    ))}
                </select>
                <label>Min Rating:</label>
                <input name="rating" type="number" min="0" max="10" step="0.1" defaultValue={minRating} className="border rounded p-1 w-20" onChange={(e) => {
                    try {
                        const rating = ratingSchema.parse(e.target.value);
                        onChangeDebounced({
                            minRating: rating,
                        })
                    }
                    catch (err) {
                        setError("Invalid rating selected.");
                    }
                }} />
                <label>Min Metascore:</label>
                <input name="metascore" type="number" min="0" max="100" step="1" defaultValue={minMetascore} className="border rounded p-1 w-20" onChange={(e) => {
                    try {
                        const metascore = metascoreSchema.parse(e.target.value);
                        onChangeDebounced({
                            minMetascore: metascore,
                        })
                    } catch (err) {
                        setError("Invalid metascore selected.");
                    }
                }}
                />
                <label>Max Price:</label>
                <input name="price" type="number" min="0" step="0.01" defaultValue={maxPrice} className="border rounded p-1 w-20" onChange={(e) => {
                    try {
                        const price = priceSchema.parse(e.target.value);
                        onChangeDebounced({
                            maxPrice: price,
                        })
                    } catch (err) {
                        setError("Invalid price selected.");
                    }
                }} />
            </form>
        </>
    )
};