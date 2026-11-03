import * as z from 'zod'

export const MediaFormatSchema = z.enum(['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC'])
export type MediaFormat = z.infer<typeof MediaFormatSchema>

export const MediaSeasonSchema = z.enum(['WINTER', 'SPRING', 'SUMMER', 'FALL'])
export type MediaSeason = z.infer<typeof MediaSeasonSchema>

/** Unbekannte Werte werden zu null. AniList kennt mehr Formate als die App (z. B. MANGA bei Relationen). */
export const MediaFormatOrNullSchema = MediaFormatSchema.nullable().catch(null)
export const MediaSeasonOrNullSchema = MediaSeasonSchema.nullable().catch(null)

export const AnimeTitleSchema = z.object({
  romaji: z.string(),
  english: z.string().nullable(),
  native: z.string(),
})
export type AnimeTitle = z.infer<typeof AnimeTitleSchema>

export const AnimeSchema = z.object({
  id: z.number(),
  title: AnimeTitleSchema,
  coverImage: z.string(),
  bannerImage: z.string().nullable(),
  format: MediaFormatSchema.nullable(),
  episodes: z.number().nullable(),
  duration: z.number().nullable(),
  seasonYear: z.number().nullable(),
  season: MediaSeasonSchema.nullable(),
  genres: z.array(z.string()),
  averageScore: z.number().nullable(),
  popularity: z.number().nullable(),
  status: z.string().nullable(),
  studios: z.array(z.string()),
  description: z.string().nullable(),
})
export type Anime = z.infer<typeof AnimeSchema>

export const AnimeDetailSchema = AnimeSchema.extend({
  relations: z.array(AnimeSchema),
})
export type AnimeDetail = z.infer<typeof AnimeDetailSchema>
