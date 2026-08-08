import type { SearchFilters } from '@/types/filters'
import type { MediaFormat, MediaSeason } from '@/types/anime'

export const DEFAULT_FILTERS: SearchFilters = {
  search: '',
  year: null,
  season: null,
  format: null,
  genres: [],
  sort: 'TRENDING_DESC',
  page: 1,
}

export function parseSearchParams(params: URLSearchParams): SearchFilters {
  const year = params.get('year')
  const genres = params.get('genres')
  return {
    search: params.get('search') ?? DEFAULT_FILTERS.search,
    year: year ? Number(year) : null,
    season: (params.get('season') as MediaSeason | null) ?? null,
    format: (params.get('format') as MediaFormat | null) ?? null,
    genres: genres ? genres.split(',').filter(Boolean) : [],
    sort: (params.get('sort') as SearchFilters['sort']) ?? DEFAULT_FILTERS.sort,
    page: 1,
  }
}

export function filtersToSearchParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.year) params.set('year', String(filters.year))
  if (filters.season) params.set('season', filters.season)
  if (filters.format) params.set('format', filters.format)
  if (filters.genres.length) params.set('genres', filters.genres.join(','))
  if (filters.sort !== DEFAULT_FILTERS.sort) params.set('sort', filters.sort)
  return params
}
