import { describe, expect, it } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { WatchlistProvider } from './WatchlistProvider'
import { useWatchlist } from '@/hooks/useWatchlist'
import type { Anime } from '@/types/anime'

const anime: Anime = {
  id: 1,
  title: { romaji: 'Test', english: 'Test English', native: 'テスト' },
  coverImage: '/cover.jpg',
  bannerImage: null,
  format: 'TV',
  episodes: 12,
  duration: 24,
  seasonYear: 2020,
  season: 'FALL',
  genres: [],
  averageScore: 80,
  popularity: 100,
  status: 'FINISHED',
  studios: [],
  description: null,
}

function wrapper({ children }: { children: ReactNode }) {
  return <WatchlistProvider>{children}</WatchlistProvider>
}

describe('WatchlistProvider', () => {
  it('starts empty and adds an anime', async () => {
    const { result } = renderHook(() => useWatchlist(), { wrapper })
    await waitFor(() => expect(result.current.entries).toEqual([]))

    act(() => result.current.addToWatchlist(anime))

    expect(result.current.entries).toHaveLength(1)
    expect(result.current.entries[0].animeId).toBe(1)
    expect(result.current.isInWatchlist(1)).toBe(true)
  })

  it('updates progress and status', () => {
    const { result } = renderHook(() => useWatchlist(), { wrapper })
    act(() => result.current.addToWatchlist(anime))
    act(() => result.current.setProgress(1, 4))
    act(() => result.current.setStatus(1, 'WATCHING'))

    expect(result.current.entries[0].progress).toBe(4)
    expect(result.current.entries[0].status).toBe('WATCHING')
  })

  it('removes an anime', () => {
    const { result } = renderHook(() => useWatchlist(), { wrapper })
    act(() => result.current.addToWatchlist(anime))
    act(() => result.current.removeFromWatchlist(1))

    expect(result.current.entries).toEqual([])
  })
})
