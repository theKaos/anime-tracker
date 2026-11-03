import * as z from 'zod'
import { MediaFormatSchema, MediaSeasonSchema } from './anime'

export const SortOptionSchema = z.enum([
  'TRENDING_DESC',
  'POPULARITY_DESC',
  'SCORE_DESC',
  'START_DATE_DESC',
])
export type SortOption = z.infer<typeof SortOptionSchema>

export const SearchFiltersSchema = z.object({
  search: z.string(),
  year: z.number().nullable(),
  season: MediaSeasonSchema.nullable(),
  format: MediaFormatSchema.nullable(),
  genres: z.array(z.string()),
  sort: SortOptionSchema,
  page: z.number(),
})
export type SearchFilters = z.infer<typeof SearchFiltersSchema>
