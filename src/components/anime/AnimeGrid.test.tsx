import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { AnimeGrid } from './AnimeGrid'
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
  averageScore: 85,
  popularity: 100,
  status: 'FINISHED',
  studios: [],
  description: null,
}

describe('AnimeGrid', () => {
  it('renders a card per anime', () => {
    renderWithProviders(<AnimeGrid anime={[anime, { ...anime, id: 2, title: { ...anime.title, romaji: 'Second' } }]} />)
    expect(screen.getAllByRole('link')).toHaveLength(2)
  })

  it('shows an empty state when there are no results', () => {
    renderWithProviders(<AnimeGrid anime={[]} />)
    expect(screen.getByText('Keine Ergebnisse gefunden.')).toBeInTheDocument()
  })
})
