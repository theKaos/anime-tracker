import { describe, expect, it } from 'vitest'
import { sortWatchlistEntries } from './sort'
import type { WatchlistEntry } from '@/types/watchlist'

function makeEntry(overrides: Partial<WatchlistEntry> & { title: string; progress: number }): WatchlistEntry {
  return {
    animeId: overrides.progress,
    status: 'WATCHING',
    progress: overrides.progress,
    totalEpisodes: 24,
    addedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    snapshot: {
      title: { romaji: overrides.title, english: null, native: overrides.title },
      coverImage: '/cover.jpg',
      format: 'TV',
    },
    ...overrides,
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
