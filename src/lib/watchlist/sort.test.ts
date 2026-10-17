import { describe, expect, it } from 'vitest'
import { filterWatchlistEntries, sortWatchlistEntries } from './sort'
import type { WatchlistEntry } from '@/types/watchlist'

function makeEntry({
  title,
  progress,
  ...rest
}: Partial<WatchlistEntry> & { title: string; progress: number }): WatchlistEntry {
  return {
    animeId: progress,
    status: 'WATCHING',
    progress,
    totalEpisodes: 24,
    addedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    snapshot: {
      title: { romaji: title, english: null, native: title },
      coverImage: '/cover.jpg',
      format: 'TV',
    },
    ...rest,
  }
}

const entries: WatchlistEntry[] = [
  makeEntry({ title: 'Zeta', progress: 5 }),
  makeEntry({ title: 'Alpha', progress: 20 }),
  makeEntry({ title: 'Mittel', progress: 12 }),
]

describe('sortWatchlistEntries', () => {
  it('sorts by title ascending', () => {
    const result = sortWatchlistEntries(entries, 'TITLE_ASC')
    expect(result.map((e) => e.snapshot.title.romaji)).toEqual(['Alpha', 'Mittel', 'Zeta'])
  })

  it('sorts by progress descending', () => {
    const result = sortWatchlistEntries(entries, 'PROGRESS_DESC')
    expect(result.map((e) => e.progress)).toEqual([20, 12, 5])
  })

  it('sorts by progress ascending', () => {
    const result = sortWatchlistEntries(entries, 'PROGRESS_ASC')
    expect(result.map((e) => e.progress)).toEqual([5, 12, 20])
  })

  it('does not mutate the input array', () => {
    const original = [...entries]
    sortWatchlistEntries(entries, 'TITLE_ASC')
    expect(entries).toEqual(original)
  })
})

describe('filterWatchlistEntries', () => {
  it('returns all entries for ALL', () => {
    expect(filterWatchlistEntries(entries, 'ALL')).toEqual(entries)
  })

  it('returns only entries matching the given status', () => {
    const mixed = [...entries, { ...entries[0], animeId: 99, status: 'COMPLETED' as const }]
    expect(filterWatchlistEntries(mixed, 'COMPLETED')).toEqual([mixed[3]])
  })

  it('never shows tombstones, not even for ALL', () => {
    const withTombstone = [
      ...entries,
      { ...entries[0], animeId: 99, deletedAt: '2026-02-01T00:00:00.000Z' },
    ]
    expect(filterWatchlistEntries(withTombstone, 'ALL')).toEqual(entries)
    expect(filterWatchlistEntries(withTombstone, 'WATCHING')).toEqual(entries)
  })
})

describe('sortWatchlistEntries — unbekannte Sortierung', () => {
  it('keeps the original order as a copy', () => {
    const entries = [makeEntry({ title: 'B', progress: 1 }), makeEntry({ title: 'A', progress: 2 })]
    const result = sortWatchlistEntries(entries, 'UNKNOWN' as never)

    expect(result).toEqual(entries)
    expect(result).not.toBe(entries)
  })
})
