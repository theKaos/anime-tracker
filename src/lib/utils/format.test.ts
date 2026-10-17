import { describe, expect, it } from 'vitest'
import { displayTitle, formatDuration, formatScore, formatSeasonYear, formatRelativeTime } from './format'

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

describe('displayTitle', () => {
  it('prefers the English title when present', () => {
    expect(displayTitle({ romaji: 'Shingeki', english: 'Attack on Titan', native: '進撃' })).toBe(
      'Attack on Titan'
    )
  })

  it('falls back to the romaji title when English is missing', () => {
    expect(displayTitle({ romaji: 'Shingeki', english: null, native: '進撃' })).toBe('Shingeki')
  })
})

describe('formatRelativeTime', () => {
  const now = new Date('2026-08-25T12:00:00.000Z')

  function ago(minutes: number): string {
    return new Date(now.getTime() - minutes * 60_000).toISOString()
  }

  it('says "gerade eben" for anything under a minute', () => {
    expect(formatRelativeTime(ago(0), now)).toBe('gerade eben')
  })

  it('uses the singular for exactly one minute', () => {
    expect(formatRelativeTime(ago(1), now)).toBe('vor 1 Minute')
  })

  it('counts minutes below an hour', () => {
    expect(formatRelativeTime(ago(42), now)).toBe('vor 42 Minuten')
  })

  it('switches to hours', () => {
    expect(formatRelativeTime(ago(60), now)).toBe('vor 1 Stunde')
    expect(formatRelativeTime(ago(300), now)).toBe('vor 5 Stunden')
  })

  it('switches to days', () => {
    expect(formatRelativeTime(ago(60 * 24), now)).toBe('vor 1 Tag')
    expect(formatRelativeTime(ago(60 * 24 * 3), now)).toBe('vor 3 Tagen')
  })

  it('does not crash on an unreadable timestamp', () => {
    expect(formatRelativeTime('irgendwann', now)).toBe('unbekannt')
  })
})

describe('formatSeasonYear — nur Saison', () => {
  it('shows the season alone when the year is unknown', () => {
    expect(formatSeasonYear(null, 'SPRING')).toBe('Spring')
  })
})
