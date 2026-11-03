import * as z from 'zod'

/** Alle Titelteile sind im GraphQL-Schema von AniList nullable. */
export const AniListTitleSchema = z.object({
  romaji: z.string().nullable(),
  english: z.string().nullable(),
  native: z.string().nullable(),
})
export type AniListTitle = z.infer<typeof AniListTitleSchema>

export const AniListStudioNodeSchema = z.object({
  name: z.string(),
})
export type AniListStudioNode = z.infer<typeof AniListStudioNodeSchema>

export const AniListMediaSchema = z.object({
  id: z.number(),
  title: AniListTitleSchema,
  coverImage: z.object({ large: z.string().nullable() }),
  bannerImage: z.string().nullable(),
  format: z.string().nullable(),
  episodes: z.number().nullable(),
  duration: z.number().nullable(),
  seasonYear: z.number().nullable(),
  season: z.string().nullable(),
  genres: z.array(z.string()),
  averageScore: z.number().nullable(),
  popularity: z.number().nullable(),
  status: z.string().nullable(),
  studios: z.object({ nodes: z.array(AniListStudioNodeSchema) }),
  description: z.string().nullish(),
  get relations() {
    return z
      .object({
        edges: z.array(z.object({ relationType: z.string(), node: AniListMediaSchema })),
      })
      .nullish()
  },
})
export type AniListMedia = z.infer<typeof AniListMediaSchema>

export const AniListPageResponseSchema = z.object({
  Page: z.object({
    pageInfo: z.object({ hasNextPage: z.boolean() }),
    media: z.array(AniListMediaSchema),
  }),
})
export type AniListPageResponse = z.infer<typeof AniListPageResponseSchema>

export const AniListMediaResponseSchema = z.object({
  Media: AniListMediaSchema,
})
export type AniListMediaResponse = z.infer<typeof AniListMediaResponseSchema>
