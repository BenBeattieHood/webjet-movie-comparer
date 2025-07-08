import { date, z } from 'zod';

export const ratingSchema = z.number().min(0).max(10);
export type Rating = z.infer<typeof ratingSchema>;

export const metascoreSchema = z.number().min(0).max(100);
export type Metascore = z.infer<typeof metascoreSchema>;

export const priceSchema = z.number().min(0);
export type Price = z.infer<typeof priceSchema>;

const providerPriceSchema = z.object({
    provider: z.string(),
    price: priceSchema,
    lastUpdated: z.string().optional(),
});
export type ProviderPrice = z.infer<typeof providerPriceSchema>;

export const movieSummarySchema = z.object({
    title: z.string(),
    titleHash: z.string(),
    prices: z.array(providerPriceSchema),
    smallImageUrl: z.string().optional(),
    largeImageUrl: z.string().optional(),
    genre: z.string().optional(),
    rating: ratingSchema.optional(),
    released: z.string().optional(),
    metascore: metascoreSchema.optional(),
    isFeatured: z.boolean().optional(),
});

export const movieDetailSchema = z.object({
    title: z.string(),
    titleHash: z.string(),
    prices: z.array(providerPriceSchema),
    smallImageUrl: z.string().optional(),
    largeImageUrl: z.string().optional(),
    genre: z.string().optional(),
    rating: ratingSchema.optional(),
    released: z.string().optional(),
    metascore: metascoreSchema.optional(),
    description: z.string().optional(),
});

export type MovieSummary = z.infer<typeof movieSummarySchema>;
export type MovieDetail = z.infer<typeof movieDetailSchema>;

export const sortOptionSchema = z.union([z.literal("release"), z.literal("metascore"), z.literal("rating"), z.literal("price")]);
export type SortOption = z.infer<typeof sortOptionSchema>;