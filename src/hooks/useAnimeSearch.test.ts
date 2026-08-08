import { describe, expect, it } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAnimeSearch } from './useAnimeSearch'
import { DEFAULT_FILTERS } from '@/lib/utils/searchParams'
import type { Anime } from '@/types/anime'

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
})
