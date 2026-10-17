import { afterEach, describe, expect, it, vi } from 'vitest'
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

describe('storage — fremde Daten', () => {
  it('ignores JSON that is not a list', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ entries: [entry] }))
    expect(loadWatchlist()).toEqual([])
  })

  it('drops list items that are not entries', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([null, 42, 'x', entry]))
    expect(loadWatchlist()).toEqual([entry])
  })
})

describe('storage — auf dem Server', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads nothing and writes nothing without window', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([entry]))
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    vi.stubGlobal('window', undefined)

    expect(loadWatchlist()).toEqual([])
    saveWatchlist([entry])
    expect(setItem).not.toHaveBeenCalled()
    setItem.mockRestore()
  })
})
