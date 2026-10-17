import { beforeEach, describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { getWatchlistEntries, setWatchlistEntries } from '@/test/utils/watchlistStoreTestUtils'
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

describe('WatchlistItem — Layout', () => {
  it('lets the content column shrink below its content width', () => {
    // Ohne min-w-0 kann diese Spalte nicht schrumpfen (Flex-Kinder haben
    // min-width:auto) und schiebt den Entfernen-Button aus der Kachel heraus.
    // Im echten Browser bei 375px waren das 163px über den Kachelrand hinaus.
    renderWithProviders(<WatchlistItem entry={entry} />)

    const button = screen.getByRole('button', { name: 'Entfernen' })
    const column = button.parentElement

    expect(column?.className).toContain('min-w-0')
    expect(button.className).toContain('shrink-0')
  })
})

describe('WatchlistItem — Bedienung schreibt in den Store', () => {
  beforeEach(() => {
    setWatchlistEntries([entry])
  })

  it('changes the status', async () => {
    renderWithProviders(<WatchlistItem entry={entry} />)

    await userEvent.selectOptions(screen.getByLabelText('Status'), 'COMPLETED')

    expect(getWatchlistEntries()[0].status).toBe('COMPLETED')
  })

  it('counts an episode forward', async () => {
    renderWithProviders(<WatchlistItem entry={entry} />)

    await userEvent.click(screen.getByRole('button', { name: 'Episode vor' }))

    expect(getWatchlistEntries()[0].progress).toBe(4)
  })

  it('removes the entry as a tombstone', async () => {
    renderWithProviders(<WatchlistItem entry={entry} />)

    await userEvent.click(screen.getByRole('button', { name: 'Entfernen' }))

    expect(getWatchlistEntries()[0].deletedAt).not.toBeNull()
  })
})
