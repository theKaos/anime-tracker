import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { makeEntry } from '@/test/utils/watchlistFactory'
import { resetWatchlistStore, setWatchlistEntries } from '@/test/utils/watchlistStoreTestUtils'
import WatchlistPage from './page'

function titled(animeId: number, romaji: string) {
  const base = makeEntry({ animeId })
  return makeEntry({ animeId, snapshot: { ...base.snapshot, title: { romaji, english: null, native: '' } } })
}

function titles() {
  return screen.getAllByRole('img').map((image) => image.getAttribute('alt'))
}

beforeEach(() => {
  resetWatchlistStore()
})

describe('WatchlistPage', () => {
  it('says so when the watchlist is empty', () => {
    render(<WatchlistPage />)
    expect(screen.getByText('Keine Einträge in dieser Ansicht.')).toBeInTheDocument()
  })

  it('lists active entries sorted by title and hides tombstones', () => {
    setWatchlistEntries([
      titled(2, 'Zeta'),
      titled(1, 'Alpha'),
      makeEntry({ animeId: 3, deletedAt: '2026-02-01T00:00:00.000Z' }),
    ])
    render(<WatchlistPage />)

    expect(titles()).toEqual(['Alpha', 'Zeta'])
  })

  it('filters by status', async () => {
    setWatchlistEntries([
      makeEntry({ animeId: 1, status: 'WATCHING' }),
      makeEntry({ animeId: 2, status: 'COMPLETED' }),
    ])
    render(<WatchlistPage />)

    await userEvent.click(screen.getByRole('tab', { name: 'Abgeschlossen' }))
    expect(titles()).toEqual(['Anime 2'])

    await userEvent.click(screen.getByRole('tab', { name: 'Pausiert' }))
    expect(screen.getByText('Keine Einträge in dieser Ansicht.')).toBeInTheDocument()
  })

  it('sorts by progress on request', async () => {
    setWatchlistEntries([makeEntry({ animeId: 1, progress: 2 }), makeEntry({ animeId: 2, progress: 9 })])
    render(<WatchlistPage />)

    await userEvent.selectOptions(screen.getByLabelText('Watchlist sortieren'), 'PROGRESS_DESC')

    expect(titles()).toEqual(['Anime 2', 'Anime 1'])
  })
})
