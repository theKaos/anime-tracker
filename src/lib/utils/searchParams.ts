import type { SearchFilters, SortOption } from '@/types/filters'
import { SEASONS } from '@/constants/seasons'
import { FORMATS } from '@/constants/formats'

export const DEFAULT_FILTERS: SearchFilters = {
  search: '',
  year: null,
  season: null,
  format: null,
  genres: [],
  sort: 'TRENDING_DESC',
  page: 1,
}

const VALID_SEASONS: Set<string> = new Set(SEASONS.map((season) => season.value))
const VALID_FORMATS: Set<string> = new Set(FORMATS.map((format) => format.value))
const VALID_SORTS: Set<string> = new Set<SortOption>([
  'TRENDING_DESC',
  'POPULARITY_DESC',
  'SCORE_DESC',
  'START_DATE_DESC',
])

function parseSeason(value: string | null): SearchFilters['season'] {
  return value && VALID_SEASONS.has(value) ? (value as SearchFilters['season']) : null
}

function parseFormat(value: string | null): SearchFilters['format'] {
  return value && VALID_FORMATS.has(value) ? (value as SearchFilters['format']) : null
}

function parseSort(value: string | null): SortOption {
  return value && VALID_SORTS.has(value) ? (value as SortOption) : DEFAULT_FILTERS.sort
}

export function parseSearchParams(params: URLSearchParams): SearchFilters {
  const year = params.get('year')
  const genres = params.get('genres')
  return {
    search: params.get('search') ?? DEFAULT_FILTERS.search,
    year: year ? Number(year) : null,
    season: parseSeason(params.get('season')),
    format: parseFormat(params.get('format')),
    genres: genres ? genres.split(',').filter(Boolean) : [],
    sort: parseSort(params.get('sort')),
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
