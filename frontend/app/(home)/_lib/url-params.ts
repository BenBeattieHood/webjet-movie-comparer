import z from "zod";
import { sortOptionSchema } from "../../../_lib/types";

export const searchPageUrlParamsSchema = z.object({
    sort: sortOptionSchema.optional(),
    genre: z.string().optional(),
    minRating: z.string().transform(val => parseInt(val)).optional(),
    minMetascore: z.string().transform(val => parseInt(val)).optional(),
    maxPrice: z.string().transform(val => parseFloat(val)).optional(),
    page: z.string().transform(val => parseInt(val)).optional(),
})
export type SearchPageUrlParams = z.infer<typeof searchPageUrlParamsSchema>;