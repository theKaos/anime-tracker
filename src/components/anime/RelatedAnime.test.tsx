import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RelatedAnime } from './RelatedAnime'
import type { Anime } from '@/types/anime'

const related: Anime = {
  id: 2,
  title: { romaji: 'Sequel', english: null, native: 'シークエル' },
  coverImage: '/cover2.jpg',
  bannerImage: null,
  format: 'TV',
  episodes: 12,
  duration: 24,
  seasonYear: 2021,
  season: 'FALL',
  genres: [],
  averageScore: 80,
  popularity: 100,
  status: 'FINISHED',
  studios: [],
  description: null,
}

describe('RelatedAnime', () => {
  it('links to each related anime', () => {
    render(<RelatedAnime relations={[related]} />)
    expect(screen.getByRole('link', { name: /Sequel/ })).toHaveAttribute('href', '/anime/2')
  })

  it('renders nothing when there are no relations', () => {
    const { container } = render(<RelatedAnime relations={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
