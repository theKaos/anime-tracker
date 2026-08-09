import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { AnimeCard } from './AnimeCard'
import type { Anime } from '@/types/anime'

const anime: Anime = {
  id: 1,
  title: { romaji: 'Test Romaji', english: 'Test English', native: 'テスト' },
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

describe('AnimeCard', () => {
  it('links to the detail page using the english title', () => {
    renderWithProviders(<AnimeCard anime={anime} />)
    const link = screen.getByRole('link', { name: /Test English/ })
    expect(link).toHaveAttribute('href', '/anime/1')
  })

  it('shows the formatted score', () => {
    renderWithProviders(<AnimeCard anime={anime} />)
    expect(screen.getByText('8.5')).toBeInTheDocument()
  })

  it('shows a hover overlay with season/year, status, and genres', () => {
    renderWithProviders(
      <AnimeCard anime={{ ...anime, genres: ['Action', 'Drama'], seasonYear: 2020, season: 'FALL' }} />
    )
    expect(screen.getByText('Fall 2020')).toBeInTheDocument()
    expect(screen.getByText('FINISHED')).toBeInTheDocument()
    expect(screen.getByText('Action')).toBeInTheDocument()
    expect(screen.getByText('Drama')).toBeInTheDocument()
  })
})
