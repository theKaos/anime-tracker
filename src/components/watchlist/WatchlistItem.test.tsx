import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { WatchlistItem } from './WatchlistItem'
import type { WatchlistEntry } from '@/types/watchlist'

const entry: WatchlistEntry = {
  animeId: 1,
  status: 'WATCHING',
  progress: 3,
  totalEpisodes: 12,
  addedAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deletedAt: null,
  snapshot: { title: { romaji: 'Test', english: 'Test English', native: 'テスト' }, coverImage: '/cover.jpg', format: 'TV' },
}

describe('WatchlistItem', () => {
  it('renders the title and links to the detail page', () => {
    renderWithProviders(<WatchlistItem entry={entry} />)
    const links = screen.getAllByRole('link', { name: /Test English/ })
    expect(links[0]).toHaveAttribute('href', '/anime/1')
  })
})
