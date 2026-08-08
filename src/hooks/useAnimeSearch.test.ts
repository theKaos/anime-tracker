import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAnimeSearch } from './useAnimeSearch'
import { DEFAULT_FILTERS } from '@/lib/utils/searchParams'
import type { Anime } from '@/types/anime'
import * as anilistClient from '@/lib/anilist/client'

const initialAnime: Anime[] = [
  {
    id: 1,
    title: { romaji: 'First', english: null, native: 'ファースト' },
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
  },
]

describe('useAnimeSearch', () => {
  it('starts with the initial page and appends loadMore results', async () => {
    const { result } = renderHook(() => useAnimeSearch(initialAnime, true, DEFAULT_FILTERS))

    expect(result.current.anime).toHaveLength(1)
    expect(result.current.hasNextPage).toBe(true)

    await act(async () => {
      await result.current.loadMore()
    })

    expect(result.current.anime.length).toBeGreaterThan(1)
    expect(result.current.hasNextPage).toBe(true)
  })

  it('resets when initialAnime changes (new filters)', () => {
    const { result, rerender } = renderHook(
      ({ initial }) => useAnimeSearch(initial, true, DEFAULT_FILTERS),
      { initialProps: { initial: initialAnime } }
    )

    const secondPage: Anime[] = []
    rerender({ initial: secondPage })

    expect(result.current.anime).toEqual(secondPage)
  })

  it('recovers from a failed loadMore instead of getting stuck loading forever', async () => {
    const spy = vi.spyOn(anilistClient, 'fetchAnimeList').mockRejectedValueOnce(new Error('network down'))

    const { result } = renderHook(() => useAnimeSearch(initialAnime, true, DEFAULT_FILTERS))

    await act(async () => {
      await result.current.loadMore()
    })

    // The failed request must not leave isLoading stuck true.
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeTruthy()
    expect(result.current.anime).toHaveLength(1)

    // A subsequent call must not be blocked by the earlier failure.
    await act(async () => {
      await result.current.loadMore()
    })

    expect(spy).toHaveBeenCalledTimes(2)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.anime.length).toBeGreaterThan(1)

    spy.mockRestore()
  })
})
