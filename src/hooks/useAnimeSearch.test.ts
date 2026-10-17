import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
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

// Stabile Referenz: Ein frisches [] bei jedem Render würde den Reset-Effekt
// endlos neu auslösen. Die Komponente reicht ebenfalls eine stabile Prop durch.
const EMPTY: Anime[] = []

describe('useAnimeSearch — Browser-Fallback, wenn der Server nichts liefern konnte', () => {
  it('loads the first page in the browser when the server fetch failed', async () => {
    const { result } = renderHook(() => useAnimeSearch(EMPTY, true, DEFAULT_FILTERS, true))

    await waitFor(() => expect(result.current.anime.length).toBeGreaterThan(0))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('does not fetch on its own when the server delivered the page', async () => {
    const spy = vi.spyOn(anilistClient, 'fetchAnimeList')

    renderHook(() => useAnimeSearch(initialAnime, true, DEFAULT_FILTERS, false))
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('shows an error when the browser cannot reach AniList either', async () => {
    const spy = vi
      .spyOn(anilistClient, 'fetchAnimeList')
      .mockRejectedValueOnce(new Error('AniList ist nicht erreichbar: failed to fetch'))

    const { result } = renderHook(() => useAnimeSearch(EMPTY, true, DEFAULT_FILTERS, true))

    await waitFor(() => expect(result.current.error).toMatch(/nicht erreichbar/))
    expect(result.current.isLoading).toBe(false)
    spy.mockRestore()
  })

  it('retries the initial load on demand', async () => {
    const spy = vi
      .spyOn(anilistClient, 'fetchAnimeList')
      .mockRejectedValueOnce(new Error('einmal daneben'))

    const { result } = renderHook(() => useAnimeSearch(EMPTY, true, DEFAULT_FILTERS, true))
    await waitFor(() => expect(result.current.error).toBeTruthy())

    spy.mockRestore()
    act(() => result.current.retry())

    await waitFor(() => expect(result.current.anime.length).toBeGreaterThan(0))
    expect(result.current.error).toBeNull()
  })
})

describe('useAnimeSearch — Randfälle', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not load more when there is no next page', async () => {
    const spy = vi.spyOn(anilistClient, 'fetchAnimeList')
    const { result } = renderHook(() => useAnimeSearch(initialAnime, false, DEFAULT_FILTERS))

    await act(async () => {
      await result.current.loadMore()
    })

    expect(spy).not.toHaveBeenCalled()
  })

  it('uses a generic message when something other than an Error is thrown', async () => {
    vi.spyOn(anilistClient, 'fetchAnimeList').mockRejectedValueOnce('kaputt')
    const { result } = renderHook(() => useAnimeSearch(initialAnime, true, DEFAULT_FILTERS))

    await act(async () => {
      await result.current.loadMore()
    })

    expect(result.current.error).toBe('Die Anime konnten nicht geladen werden.')
  })

  it('retry loads the next page again after a failed loadMore', async () => {
    const spy = vi
      .spyOn(anilistClient, 'fetchAnimeList')
      .mockRejectedValueOnce(new Error('weg'))
      .mockResolvedValueOnce({ anime: [{ ...initialAnime[0], id: 2 }], hasNextPage: false })
    const { result } = renderHook(() => useAnimeSearch(initialAnime, true, DEFAULT_FILTERS))

    await act(async () => {
      await result.current.loadMore()
    })
    act(() => result.current.retry())

    await waitFor(() => expect(result.current.anime).toHaveLength(2))
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))
    expect(result.current.error).toBeNull()
  })

  it('drops a late browser result after unmount', async () => {
    let resolve!: (value: { anime: Anime[]; hasNextPage: boolean }) => void
    vi.spyOn(anilistClient, 'fetchAnimeList').mockReturnValueOnce(
      new Promise((r) => {
        resolve = r
      })
    )
    const noAnime: Anime[] = []
    const { result, unmount } = renderHook(() => useAnimeSearch(noAnime, false, DEFAULT_FILTERS, true))

    unmount()
    await act(async () => {
      resolve({ anime: initialAnime, hasNextPage: true })
    })

    expect(result.current.anime).toEqual([])
  })
})
