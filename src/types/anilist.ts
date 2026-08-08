export interface AniListTitle {
  romaji: string
  english: string | null
  native: string
}

export interface AniListStudioNode {
  name: string
}

export interface AniListMedia {
  id: number
  title: AniListTitle
  coverImage: { large: string | null }
  bannerImage: string | null
  format: string | null
  episodes: number | null
  duration: number | null
  seasonYear: number | null
  season: string | null
  genres: string[]
  averageScore: number | null
  popularity: number | null
  status: string | null
  studios: { nodes: AniListStudioNode[] }
  description?: string | null
  relations?: { edges: { relationType: string; node: AniListMedia }[] }
}

export interface AniListPageResponse {
  Page: {
    pageInfo: { hasNextPage: boolean }
    media: AniListMedia[]
  }
}

export interface AniListMediaResponse {
  Media: AniListMedia
}
