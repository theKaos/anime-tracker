import { describe, expect, it } from 'vitest'
import { DEFAULT_FILTERS, filtersToSearchParams, parseSearchParams } from './searchParams'

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
