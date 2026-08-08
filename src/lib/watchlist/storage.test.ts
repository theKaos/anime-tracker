import { describe, expect, it } from 'vitest'
import { loadWatchlist, saveWatchlist } from './storage'
import { STORAGE_KEY } from '@/constants/config'
import type { WatchlistEntry } from '@/types/watchlist'

const entry: WatchlistEntry = {
  animeId: 1,
  status: 'PLANNING',
  progress: 0,
  totalEpisodes: 12,
  addedAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  snapshot: { title: { romaji: 'Test', english: null, native: 'テスト' }, coverImage: '/cover.jpg', format: 'TV' },
}

describe('storage', () => {
  it('returns empty array when nothing stored', () => {
    expect(loadWatchlist()).toEqual([])
  })

  it('saves and loads entries', () => {
    saveWatchlist([entry])
    expect(loadWatchlist()).toEqual([entry])
  })

  it('returns empty array for corrupted data', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadWatchlist()).toEqual([])
  })
})
