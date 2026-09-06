import { describe, expect, it } from 'vitest'
import { loadWatchlist, saveWatchlist } from './storage'
import { STORAGE_KEY } from '@/constants/config'
import { makeEntry } from '@/test/utils/watchlistFactory'

const entry = makeEntry({ animeId: 1 })

describe('storage', () => {
  it('returns empty array when nothing stored', () => {
    expect(loadWatchlist()).toEqual([])
  })

  it('saves and loads entries', () => {
    saveWatchlist([entry])
    expect(loadWatchlist()).toEqual([entry])
  })

  it('keeps tombstones so they survive a reload', () => {
    const dead = makeEntry({ animeId: 2, deletedAt: '2026-02-01T00:00:00.000Z' })
    saveWatchlist([entry, dead])
    expect(loadWatchlist()).toEqual([entry, dead])
  })

  it('returns empty array for corrupted data', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadWatchlist()).toEqual([])
  })

  it('adds deletedAt to entries written by an older version', () => {
    const legacy = { ...entry } as Partial<typeof entry>
    delete legacy.deletedAt
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([legacy]))

    expect(loadWatchlist()).toEqual([entry])
  })
})
