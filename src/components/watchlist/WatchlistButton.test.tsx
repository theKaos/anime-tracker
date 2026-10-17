import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { WatchlistButton } from './WatchlistButton'
import { useWatchlistStore } from '@/store/watchlistStore'
import { resetWatchlistStore } from '@/test/utils/watchlistStoreTestUtils'
import type { Anime } from '@/types/anime'

const anime: Anime = {
  id: 1,
  title: { romaji: 'Test', english: null, native: 'テスト' },
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

describe('WatchlistButton', () => {
  it('adds and then removes the anime from the watchlist', async () => {
    renderWithProviders(<WatchlistButton anime={anime} />)

    const addButton = await screen.findByRole('button', { name: 'hinzufügen' })
    await userEvent.click(addButton)

    expect(await screen.findByRole('button', { name: 'entfernen' })).toBeInTheDocument()
  })
})

describe('WatchlistButton — entfernen', () => {
  it('removes an anime that is already in the watchlist', async () => {
    resetWatchlistStore()
    renderWithProviders(<WatchlistButton anime={anime} />)
    await userEvent.click(await screen.findByRole('button', { name: 'hinzufügen' }))

    await userEvent.click(await screen.findByRole('button', { name: 'entfernen' }))

    expect(await screen.findByRole('button', { name: 'hinzufügen' })).toBeInTheDocument()
    expect(useWatchlistStore.getState().isInWatchlist(anime.id)).toBe(false)
  })
})
