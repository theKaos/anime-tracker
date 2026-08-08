import { describe, expect, it } from 'vitest'
import { watchlistReducer } from './reducer'
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

describe('watchlistReducer', () => {
  it('adds a new entry', () => {
    expect(watchlistReducer([], { type: 'ADD', entry })).toEqual([entry])
  })

  it('does not add a duplicate entry', () => {
    expect(watchlistReducer([entry], { type: 'ADD', entry })).toEqual([entry])
  })

  it('removes an entry', () => {
    expect(watchlistReducer([entry], { type: 'REMOVE', animeId: 1 })).toEqual([])
  })

  it('updates progress', () => {
    const result = watchlistReducer([entry], { type: 'SET_PROGRESS', animeId: 1, progress: 5 })
    expect(result[0].progress).toBe(5)
  })

  it('updates status', () => {
    const result = watchlistReducer([entry], { type: 'SET_STATUS', animeId: 1, status: 'WATCHING' })
    expect(result[0].status).toBe('WATCHING')
  })

  it('hydrates from stored entries', () => {
    expect(watchlistReducer([], { type: 'HYDRATE', entries: [entry] })).toEqual([entry])
  })
})
