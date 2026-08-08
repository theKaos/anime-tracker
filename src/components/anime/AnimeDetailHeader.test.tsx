import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnimeDetailHeader } from './AnimeDetailHeader'
import type { Anime } from '@/types/anime'

const anime: Anime = {
  id: 1,
  title: { romaji: 'Test Romaji', english: 'Test English', native: 'テスト' },
  coverImage: '/cover.jpg',
  bannerImage: '/banner.jpg',
  format: 'TV',
  episodes: 12,
  duration: 24,
  seasonYear: 2020,
  season: 'FALL',
  genres: [],
  averageScore: 85,
  popularity: 100,
  status: 'FINISHED',
  studios: ['Test Studio'],
  description: null,
}

describe('AnimeDetailHeader', () => {
  it('shows the title, native title, and studio', () => {
    render(<AnimeDetailHeader anime={anime} />)
    expect(screen.getByRole('heading', { name: 'Test English' })).toBeInTheDocument()
    expect(screen.getByText('テスト')).toBeInTheDocument()
    expect(screen.getByText('Test Studio')).toBeInTheDocument()
  })
})
