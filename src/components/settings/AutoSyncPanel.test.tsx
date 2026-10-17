import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { FileSyncProvider } from '@/context/FileSyncProvider'
import { AutoSyncPanel } from './AutoSyncPanel'
import { toJson, fromJson } from '@/lib/sync/serialize'
import { makeEntry } from '@/test/utils/watchlistFactory'
import { createMemorySyncPort, type MemorySyncPort } from '@/test/utils/memorySyncPort'
import {
  getWatchlistEntries,
  resetWatchlistStore,
  setWatchlistEntries,
} from '@/test/utils/watchlistStoreTestUtils'

function renderWithPort(port: MemorySyncPort, children: ReactNode = <AutoSyncPanel />) {
  return render(<FileSyncProvider port={port}>{children}</FileSyncProvider>)
}

beforeEach(() => {
  resetWatchlistStore()
})

describe('AutoSyncPanel', () => {
  it('offers to connect a file when none is connected', async () => {
    renderWithPort(createMemorySyncPort({ status: 'disconnected' }))

    expect(
      await screen.findByRole('button', { name: 'Vorhandene Datei auswählen' })
    ).toBeInTheDocument()
  })

  it('hides the controls in a browser without file access', async () => {
    const port = createMemorySyncPort()
    port.isSupported = () => false
    port.getStatus = async () => 'unsupported'
    renderWithPort(port)

    expect(await screen.findByText(/unterstützt den direkten Dateizugriff nicht/)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Vorhandene Datei auswählen' })
    ).not.toBeInTheDocument()
  })

  it('writes the watchlist into the file after connecting', async () => {
    setWatchlistEntries([makeEntry({ animeId: 1, progress: 4 })])
    const port = createMemorySyncPort({ status: 'disconnected' })
    renderWithPort(port)

    await userEvent.click(await screen.findByRole('button', { name: 'Vorhandene Datei auswählen' }))

    await waitFor(() => expect(port.writes).toHaveLength(1))
    const parsed = fromJson(port.file ?? '')
    expect(parsed.ok && parsed.file.entries[0].progress).toBe(4)
  })

  it('pulls the file into the store on mount when the permission still stands', async () => {
    setWatchlistEntries([])
    const remote = [makeEntry({ animeId: 7, updatedAt: '2026-08-20T00:00:00.000Z' })]
    renderWithPort(createMemorySyncPort({ status: 'connected', file: toJson(remote) }))

    await waitFor(() => expect(getWatchlistEntries().map((e) => e.animeId)).toEqual([7]))
  })

  it('does not sync on mount while the permission is missing', async () => {
    setWatchlistEntries([makeEntry({ animeId: 1 })])
    const port = createMemorySyncPort({ status: 'needs-permission' })
    renderWithPort(port)

    await screen.findByRole('button', { name: 'Zugriff bestätigen' })
    // Ein automatischer requestPermission() ohne Nutzergeste würde scheitern.
    expect(port.requestPermission).not.toHaveBeenCalled()
    expect(port.write).not.toHaveBeenCalled()
  })

  it('syncs after the user confirms access', async () => {
    setWatchlistEntries([makeEntry({ animeId: 1 })])
    const port = createMemorySyncPort({ status: 'needs-permission' })
    renderWithPort(port)

    await userEvent.click(await screen.findByRole('button', { name: 'Zugriff bestätigen' }))

    await waitFor(() => expect(port.write).toHaveBeenCalledOnce())
  })

  it('shows what an automatic sync brought in', async () => {
    setWatchlistEntries([makeEntry({ animeId: 1, updatedAt: '2026-08-01T00:00:00.000Z' })])
    const remote = [makeEntry({ animeId: 2, updatedAt: '2026-08-20T00:00:00.000Z' })]
    renderWithPort(createMemorySyncPort({ status: 'connected', file: toJson(remote) }))

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
    expect(screen.getByTestId('merge-stat-added')).toHaveTextContent('1')
  })

  it('stays quiet when the sync changed nothing', async () => {
    const local = [makeEntry({ animeId: 1 })]
    setWatchlistEntries(local)
    renderWithPort(createMemorySyncPort({ status: 'connected', file: toJson(local) }))

    await screen.findByRole('button', { name: 'Jetzt abgleichen' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('explains a failing sync without losing the watchlist', async () => {
    const local = [makeEntry({ animeId: 1 })]
    setWatchlistEntries(local)
    const port = createMemorySyncPort({ status: 'connected' })
    port.failNextWrite = new DOMException('nope', 'NotAllowedError')
    renderWithPort(port)

    expect(await screen.findByRole('alert')).toHaveTextContent(/entzogen/)
    expect(getWatchlistEntries()).toEqual(local)
  })

  it('forgets the file on disconnect', async () => {
    setWatchlistEntries([makeEntry({ animeId: 1 })])
    const port = createMemorySyncPort({ status: 'connected' })
    renderWithPort(port)

    await userEvent.click(await screen.findByRole('button', { name: 'Verbindung lösen' }))

    expect(
      await screen.findByRole('button', { name: 'Vorhandene Datei auswählen' })
    ).toBeInTheDocument()
    expect(port.disconnect).toHaveBeenCalledOnce()
  })
})

describe('AutoSyncPanel — vorhandene Datei vs. neue Datei', () => {
  it('uses the open picker for an existing file', async () => {
    const port = createMemorySyncPort({ status: 'disconnected' })
    renderWithPort(port)

    await userEvent.click(await screen.findByRole('button', { name: 'Vorhandene Datei auswählen' }))

    expect(port.connect).toHaveBeenCalledWith('open')
  })

  it('uses the save picker only for a deliberately new file', async () => {
    const port = createMemorySyncPort({ status: 'disconnected' })
    renderWithPort(port)

    await userEvent.click(await screen.findByRole('button', { name: 'Neue Datei anlegen' }))

    expect(port.connect).toHaveBeenCalledWith('create')
  })

  it('hides the create button where the browser cannot create files', async () => {
    const port = createMemorySyncPort({ status: 'disconnected' })
    port.canCreate = () => false
    renderWithPort(port)

    expect(
      await screen.findByRole('button', { name: 'Vorhandene Datei auswählen' })
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Neue Datei anlegen' })).not.toBeInTheDocument()
  })

  it('offers a way out when write access was refused', async () => {
    const port = createMemorySyncPort({ status: 'disconnected' })
    port.connect = vi.fn(async () => 'permission-denied' as const)
    renderWithPort(port)

    await userEvent.click(await screen.findByRole('button', { name: 'Vorhandene Datei auswählen' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/Schreibrecht/)
    expect(screen.getByRole('button', { name: 'Andere Datei wählen' })).toBeInTheDocument()
  })
})

describe('AutoSyncPanel — weitere Knöpfe', () => {
  it('syncs on demand while connected', async () => {
    const port = createMemorySyncPort({ status: 'connected' })
    renderWithPort(port)
    await waitFor(() => expect(port.read).toHaveBeenCalledTimes(1))

    await userEvent.click(await screen.findByRole('button', { name: 'Jetzt abgleichen' }))

    await waitFor(() => expect(port.read).toHaveBeenCalledTimes(2))
  })

  it('lets the user pick another file instead of granting access', async () => {
    const port = createMemorySyncPort({ status: 'needs-permission' })
    renderWithPort(port)

    await userEvent.click(await screen.findByRole('button', { name: 'Andere Datei wählen' }))

    expect(port.disconnect).toHaveBeenCalledOnce()
    expect(
      await screen.findByRole('button', { name: 'Vorhandene Datei auswählen' })
    ).toBeInTheDocument()
  })
})
