import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnimeStats } from './AnimeStats'
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

describe('AnimeStats', () => {
  it('shows episodes, duration, season, score, and status', () => {
    render(<AnimeStats anime={anime} />)
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('24 min')).toBeInTheDocument()
    expect(screen.getByText('Fall 2020')).toBeInTheDocument()
    expect(screen.getByText('8.5')).toBeInTheDocument()
    expect(screen.getByText('FINISHED')).toBeInTheDocument()
  })
})
