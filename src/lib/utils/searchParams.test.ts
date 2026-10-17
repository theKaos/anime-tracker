import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FILTERS,
  filtersToSearchParams,
  parseSearchParams,
  parseSearchParamsFromRecord,
  removeFilter,
} from './searchParams'

describe('parseSearchParams', () => {
  it('returns defaults for empty params', () => {
    expect(parseSearchParams(new URLSearchParams())).toEqual(DEFAULT_FILTERS)
  })

  it('parses all filter fields', () => {
    const params = new URLSearchParams(
      'search=bocchi&year=2022&season=FALL&format=TV&genres=Comedy,Music&sort=SCORE_DESC'
    )
    expect(parseSearchParams(params)).toEqual({
      search: 'bocchi',
      year: 2022,
      season: 'FALL',
      format: 'TV',
      genres: ['Comedy', 'Music'],
      sort: 'SCORE_DESC',
      page: 1,
    })
  })

  it('falls back to null for an invalid season value', () => {
    const params = new URLSearchParams('season=BOGUS')
    expect(parseSearchParams(params).season).toBeNull()
  })

  it('falls back to null for an invalid format value', () => {
    const params = new URLSearchParams('format=BOGUS')
    expect(parseSearchParams(params).format).toBeNull()
  })

  it('falls back to the default sort for an invalid sort value', () => {
    const params = new URLSearchParams('sort=BOGUS')
    expect(parseSearchParams(params).sort).toBe(DEFAULT_FILTERS.sort)
  })
})

describe('parseSearchParamsFromRecord', () => {
  it('parses string values and ignores array/undefined values', () => {
    const result = parseSearchParamsFromRecord({ search: 'bocchi', year: '2022', genres: undefined })
    expect(result.search).toBe('bocchi')
    expect(result.year).toBe(2022)
  })
})

describe('filtersToSearchParams', () => {
  it('omits default values', () => {
    expect(filtersToSearchParams(DEFAULT_FILTERS).toString()).toBe('')
  })

  it('includes set values', () => {
    const params = filtersToSearchParams({
      ...DEFAULT_FILTERS,
      search: 'bocchi',
      year: 2022,
      genres: ['Comedy'],
    })
    expect(params.get('search')).toBe('bocchi')
    expect(params.get('year')).toBe('2022')
    expect(params.get('genres')).toBe('Comedy')
  })
})

describe('removeFilter', () => {
  it('removes only the given genre, keeping others', () => {
    const filters = { ...DEFAULT_FILTERS, genres: ['Action', 'Drama'] }
    expect(removeFilter(filters, 'genres', 'Action').genres).toEqual(['Drama'])
  })

  it('clears the search text', () => {
    const filters = { ...DEFAULT_FILTERS, search: 'bocchi' }
    expect(removeFilter(filters, 'search').search).toBe('')
  })

  it('nulls out a single-value filter like year', () => {
    const filters = { ...DEFAULT_FILTERS, year: 2022 }
    expect(removeFilter(filters, 'year').year).toBeNull()
  })
})

describe('filtersToSearchParams — alle Filter gesetzt', () => {
  it('writes season, format, genres and a non-default sort', () => {
    const params = filtersToSearchParams({
      ...DEFAULT_FILTERS,
      season: 'WINTER',
      format: 'MOVIE',
      genres: ['Action', 'Drama'],
      sort: 'SCORE_DESC',
    })

    expect(params.get('season')).toBe('WINTER')
    expect(params.get('format')).toBe('MOVIE')
    expect(params.get('genres')).toBe('Action,Drama')
    expect(params.get('sort')).toBe('SCORE_DESC')
  })
})
