import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Anime } from '@/types/anime'
import { DEFAULT_FILTERS } from '@/lib/utils/searchParams'
import * as anilistClient from '@/lib/anilist/client'
import { SearchExperience } from './SearchExperience'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

// jsdom kennt keinen IntersectionObserver; der Infinite-Scroll-Trigger baut aber
// einen, sobald es eine nächste Seite gibt.
class NoopObserver {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
  takeRecords = vi.fn(() => [])
  root = null
  rootMargin = ''
  thresholds = []
}
global.IntersectionObserver = NoopObserver as unknown as typeof IntersectionObserver

const anime: Anime[] = [
  {
    id: 1,
    title: { romaji: 'Bereits geladen', english: null, native: 'ロード済み' },
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

const EMPTY: Anime[] = []

describe('SearchExperience', () => {
  it('renders what the server delivered without fetching again', async () => {
    const spy = vi.spyOn(anilistClient, 'fetchAnimeList')
    render(
      <SearchExperience initialAnime={anime} initialHasNextPage={false} filters={DEFAULT_FILTERS} />
    )

    expect(await screen.findByText('Bereits geladen')).toBeInTheDocument()
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('loads the list in the browser when the server could not', async () => {
    render(
      <SearchExperience
        initialAnime={EMPTY}
        initialHasNextPage
        filters={DEFAULT_FILTERS}
        serverFetchFailed
      />
    )

    // Kommt aus dem MSW-Handler — entscheidend ist, dass die Seite überhaupt
    // etwas anzeigt, statt in die Error-Boundary zu laufen.
    expect(await screen.findByText('Attack on Titan')).toBeInTheDocument()
  })

  it('explains the failure and offers a working retry', async () => {
    const spy = vi
      .spyOn(anilistClient, 'fetchAnimeList')
      .mockRejectedValueOnce(new AniListErrorLike('AniList ist nicht erreichbar: 403'))

    render(
      <SearchExperience
        initialAnime={EMPTY}
        initialHasNextPage
        filters={DEFAULT_FILTERS}
        serverFetchFailed
      />
    )

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('nicht erreichbar')

    spy.mockRestore()
    await userEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }))

    await waitFor(() => expect(screen.getByText('Attack on Titan')).toBeInTheDocument())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('says so when a search simply has no results', async () => {
    render(
      <SearchExperience
        initialAnime={EMPTY}
        initialHasNextPage={false}
        filters={{ ...DEFAULT_FILTERS, search: 'gibtesnicht' }}
      />
    )

    expect(await screen.findByText(/Keine Anime gefunden/)).toBeInTheDocument()
  })
})

class AniListErrorLike extends Error {}
