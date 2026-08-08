export type MediaFormat = 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC'
export type MediaSeason = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL'

export interface AnimeTitle {
  romaji: string
  english: string | null
  native: string
}

export interface Anime {
  id: number
  title: AnimeTitle
  coverImage: string
  bannerImage: string | null
  format: MediaFormat | null
  episodes: number | null
  duration: number | null
  seasonYear: number | null
  season: MediaSeason | null
  genres: string[]
  averageScore: number | null
  popularity: number | null
  status: string | null
  studios: string[]
  description: string | null
}

export interface AnimeDetail extends Anime {
  relations: Anime[]
}
