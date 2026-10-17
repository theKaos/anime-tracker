import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Anime } from '@/types/anime'
import { STORAGE_KEY } from '@/constants/config'
import { useWatchlistStore } from './watchlistStore'
import { makeEntry } from '@/test/utils/watchlistFactory'
import { getWatchlistEntries, resetWatchlistStore } from '@/test/utils/watchlistStoreTestUtils'

const anime = {
  id: 7,
  title: { romaji: 'Mushishi', english: 'Mushi-Shi', native: '蟲師' },
  coverImage: '/mushishi.jpg',
  format: 'TV',
  episodes: 26,
} as Anime

const store = () => useWatchlistStore.getState()

function storedEntries() {
  return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
}

beforeEach(() => {
  resetWatchlistStore()
})

describe('useWatchlistStore — Aktionen', () => {
  it('adds an anime as planned with a snapshot for offline display', () => {
    store().addToWatchlist(anime)

    expect(getWatchlistEntries()).toEqual([
      expect.objectContaining({
        animeId: 7,
        status: 'PLANNING',
        progress: 0,
        totalEpisodes: 26,
        deletedAt: null,
        snapshot: { title: anime.title, coverImage: '/mushishi.jpg', format: 'TV' },
      }),
    ])
    expect(store().isInWatchlist(7)).toBe(true)
  })

  it('removes by leaving a tombstone', () => {
    store().addToWatchlist(anime)
    store().removeFromWatchlist(7)

    expect(getWatchlistEntries()[0].deletedAt).not.toBeNull()
    expect(store().isInWatchlist(7)).toBe(false)
  })

  it('sets progress and status', () => {
    store().addToWatchlist(anime)
    store().setProgress(7, 12)
    store().setStatus(7, 'WATCHING')

    expect(getWatchlistEntries()[0]).toMatchObject({ progress: 12, status: 'WATCHING' })
  })

  it('replaces everything with an import result', () => {
    store().addToWatchlist(anime)
    const imported = [makeEntry({ animeId: 1 }), makeEntry({ animeId: 2 })]

    store().replaceAll(imported)

    expect(getWatchlistEntries()).toBe(imported)
    expect(store().isInWatchlist(7)).toBe(false)
  })
})

describe('useWatchlistStore — Persistenz', () => {
  it('writes every change to localStorage once hydrated', () => {
    store().addToWatchlist(anime)

    expect(storedEntries()).toEqual([expect.objectContaining({ animeId: 7 })])
  })

  it('does not overwrite localStorage before hydration finished', () => {
    useWatchlistStore.setState({ hydrated: false })
    window.localStorage.clear()
    store().addToWatchlist(anime)

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('does not write when something other than the entries changes', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    useWatchlistStore.setState({ hydrated: true })

    expect(setItem).not.toHaveBeenCalled()
    setItem.mockRestore()
  })

  it('hydrates from localStorage when the module loads', async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([makeEntry({ animeId: 99 })]))
    vi.resetModules()

    const { useWatchlistStore: fresh } = await import('./watchlistStore')

    expect(fresh.getState().hydrated).toBe(true)
    expect(fresh.getState().isInWatchlist(99)).toBe(true)
  })
})
