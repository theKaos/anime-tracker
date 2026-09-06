import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileSyncPanel } from './FileSyncPanel'
import { toJson } from '@/lib/sync/serialize'
import { makeEntry } from '@/test/utils/watchlistFactory'
import {
  getWatchlistEntries,
  resetWatchlistStore,
  setWatchlistEntries,
} from '@/test/utils/watchlistStoreTestUtils'

const createObjectURL = vi.fn(() => 'blob:mock')
let click: ReturnType<typeof vi.spyOn>

function jsonFile(content: string): File {
  return new File([content], 'anime-watchlist.json', { type: 'application/json' })
}

beforeEach(() => {
  resetWatchlistStore()
  vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL: vi.fn() })
  click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  click.mockRestore()
  createObjectURL.mockClear()
})

describe('FileSyncPanel', () => {
  it('shows how many entries are in the watchlist', async () => {
    setWatchlistEntries([makeEntry({ animeId: 1 }), makeEntry({ animeId: 2 })])
    render(<FileSyncPanel />)

    expect(await screen.findByText('2 Einträge in der Watchlist')).toBeInTheDocument()
  })

  it('does not count tombstones as entries', async () => {
    setWatchlistEntries([
      makeEntry({ animeId: 1 }),
      makeEntry({ animeId: 2, deletedAt: '2026-08-01T00:00:00.000Z' }),
    ])
    render(<FileSyncPanel />)

    expect(await screen.findByText('1 Einträge in der Watchlist')).toBeInTheDocument()
  })

  it('exports the watchlist as a downloadable file', async () => {
    setWatchlistEntries([makeEntry({ animeId: 1 })])
    render(<FileSyncPanel />)

    await userEvent.click(await screen.findByRole('button', { name: 'Watchlist exportieren' }))

    expect(click).toHaveBeenCalledOnce()
    const anchor = click.mock.instances[0] as HTMLAnchorElement
    expect(anchor.download).toBe('anime-watchlist.json')
  })

  it('merges an imported file into the store and reports the result', async () => {
    setWatchlistEntries([
      makeEntry({ animeId: 1, progress: 2, updatedAt: '2026-08-01T00:00:00.000Z' }),
    ])
    render(<FileSyncPanel />)

    const incoming = [
      makeEntry({ animeId: 1, progress: 9, updatedAt: '2026-08-05T00:00:00.000Z' }),
      makeEntry({ animeId: 2, updatedAt: '2026-08-05T00:00:00.000Z' }),
    ]
    await userEvent.upload(
      screen.getByLabelText('Watchlist-Datei auswählen'),
      jsonFile(toJson(incoming))
    )

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
    expect(screen.getByTestId('merge-stat-updated')).toHaveTextContent('1')
    expect(screen.getByTestId('merge-stat-added')).toHaveTextContent('1')

    const entries = getWatchlistEntries()
    expect(entries.map((entry) => entry.animeId)).toEqual([1, 2])
    expect(entries[0].progress).toBe(9)
  })

  it('never overwrites a newer local change with an older file', async () => {
    setWatchlistEntries([
      makeEntry({ animeId: 1, progress: 12, updatedAt: '2026-08-10T00:00:00.000Z' }),
    ])
    render(<FileSyncPanel />)

    const stale = [makeEntry({ animeId: 1, progress: 1, updatedAt: '2026-08-01T00:00:00.000Z' })]
    await userEvent.upload(
      screen.getByLabelText('Watchlist-Datei auswählen'),
      jsonFile(toJson(stale))
    )

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
    expect(getWatchlistEntries()[0].progress).toBe(12)
  })

  it('explains an unreadable file instead of touching the watchlist', async () => {
    const local = [makeEntry({ animeId: 1 })]
    setWatchlistEntries(local)
    render(<FileSyncPanel />)

    await userEvent.upload(
      screen.getByLabelText('Watchlist-Datei auswählen'),
      jsonFile('{kein json')
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(/kein gültiges JSON/)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(getWatchlistEntries()).toEqual(local)
  })

  it('rejects a file from another application', async () => {
    setWatchlistEntries([])
    render(<FileSyncPanel />)

    await userEvent.upload(
      screen.getByLabelText('Watchlist-Datei auswählen'),
      jsonFile(JSON.stringify({ app: 'etwas-anderes', schemaVersion: 1, entries: [] }))
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(/nicht aus dem Anime Tracker/)
  })

  it('rejects a file from a newer app version', async () => {
    setWatchlistEntries([])
    render(<FileSyncPanel />)

    await userEvent.upload(
      screen.getByLabelText('Watchlist-Datei auswählen'),
      jsonFile(JSON.stringify({ app: 'anime-tracker', schemaVersion: 99, entries: [] }))
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(/neueren Version/)
  })
})

describe('FileSyncPanel — leere Datei', () => {
  it('says the file is empty instead of blaming the JSON', async () => {
    setWatchlistEntries([makeEntry({ animeId: 1 })])
    render(<FileSyncPanel />)

    await userEvent.upload(screen.getByLabelText('Watchlist-Datei auswählen'), jsonFile(''))

    expect(await screen.findByRole('alert')).toHaveTextContent(/Die Datei ist leer/)
  })

  it('accepts a file saved with a byte order mark', async () => {
    setWatchlistEntries([])
    render(<FileSyncPanel />)

    const incoming = [makeEntry({ animeId: 5, updatedAt: '2026-08-20T00:00:00.000Z' })]
    await userEvent.upload(
      screen.getByLabelText('Watchlist-Datei auswählen'),
      jsonFile('﻿' + toJson(incoming))
    )

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
    expect(getWatchlistEntries().map((entry) => entry.animeId)).toEqual([5])
  })
})
