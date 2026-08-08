import { describe, expect, it } from 'vitest'
import { formatDuration, formatScore, formatSeasonYear } from './format'

describe('formatSeasonYear', () => {
  it('formats season and year', () => {
    expect(formatSeasonYear(2013, 'SPRING')).toBe('Spring 2013')
  })

  it('falls back to year only when season missing', () => {
    expect(formatSeasonYear(2013, null)).toBe('2013')
  })

  it('falls back to Unbekannt when both missing', () => {
    expect(formatSeasonYear(null, null)).toBe('Unbekannt')
  })
})

describe('formatDuration', () => {
  it('appends min', () => {
    expect(formatDuration(24)).toBe('24 min')
  })

  it('returns dash for null', () => {
    expect(formatDuration(null)).toBe('—')
  })
})

describe('formatScore', () => {
  it('converts 0-100 to 0-10 scale', () => {
    expect(formatScore(85)).toBe('8.5')
  })

  it('returns dash for null', () => {
    expect(formatScore(null)).toBe('—')
  })
})
