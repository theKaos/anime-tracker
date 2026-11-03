import * as z from 'zod'
import { MediaFormatOrNullSchema, MediaSeasonOrNullSchema } from '@/types/anime'
import { SortOptionSchema, type SearchFilters } from '@/types/filters'

export const DEFAULT_FILTERS: SearchFilters = {
  search: '',
  year: null,
  season: null,
  format: null,
  genres: [],
  sort: 'TRENDING_DESC',
  page: 1,
}

const YearParamSchema = z.coerce.number().int().positive().nullable().catch(null)
const SortParamSchema = SortOptionSchema.catch(DEFAULT_FILTERS.sort)

export function parseSearchParamsFromRecord(
  record: Record<string, string | string[] | undefined>
): SearchFilters {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === 'string') params.set(key, value)
  }
  return parseSearchParams(params)
}

export function parseSearchParams(params: URLSearchParams): SearchFilters {
  const genres = params.get('genres')
  return {
    search: params.get('search') ?? DEFAULT_FILTERS.search,
    year: YearParamSchema.parse(params.get('year') || null),
    season: MediaSeasonOrNullSchema.parse(params.get('season')),
    format: MediaFormatOrNullSchema.parse(params.get('format')),
    genres: genres ? genres.split(',').filter(Boolean) : [],
    sort: SortParamSchema.parse(params.get('sort')),
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

export type FilterKey = 'search' | 'year' | 'season' | 'format' | 'genres'

export function removeFilter(filters: SearchFilters, key: FilterKey, value?: string): SearchFilters {
  if (key === 'genres' && value) {
    return { ...filters, genres: filters.genres.filter((genre) => genre !== value) }
  }
  if (key === 'search') {
    return { ...filters, search: '' }
  }
  return { ...filters, [key]: null }
}
