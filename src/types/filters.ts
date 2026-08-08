import type { MediaFormat, MediaSeason } from './anime'

export type SortOption = 'TRENDING_DESC' | 'POPULARITY_DESC' | 'SCORE_DESC' | 'START_DATE_DESC'

export interface SearchFilters {
  search: string
  year: number | null
  season: MediaSeason | null
  format: MediaFormat | null
  genres: string[]
  sort: SortOption
  page: number
}
