import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileSyncProvider } from '@/context/FileSyncProvider'
import { ReconnectBanner } from './ReconnectBanner'
import { makeEntry } from '@/test/utils/watchlistFactory'
import { createMemorySyncPort, type MemorySyncPort } from '@/test/utils/memorySyncPort'
import { resetWatchlistStore, setWatchlistEntries } from '@/test/utils/watchlistStoreTestUtils'

function renderBanner(port: MemorySyncPort) {
  return render(
    <FileSyncProvider port={port}>
      <ReconnectBanner />
    </FileSyncProvider>
  )
}

beforeEach(() => {
  resetWatchlistStore()
})

describe('ReconnectBanner', () => {
  it('renders nothing without a provider', () => {
    const { container } = render(<ReconnectBanner />)
    expect(container).toBeEmptyDOMElement()
  })

  it('stays hidden while everything is fine', async () => {
    renderBanner(createMemorySyncPort({ status: 'connected' }))

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Datei wieder verbinden' })).not.toBeInTheDocument()
    )
  })

  it('stays hidden when no file is connected at all', async () => {
    renderBanner(createMemorySyncPort({ status: 'disconnected' }))

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Datei wieder verbinden' })).not.toBeInTheDocument()
    )
  })

  it('appears once the permission expired', async () => {
    renderBanner(createMemorySyncPort({ status: 'needs-permission' }))

    expect(
      await screen.findByRole('button', { name: 'Datei wieder verbinden' })
    ).toBeInTheDocument()
  })

  it('restores the connection on click and then disappears', async () => {
    setWatchlistEntries([makeEntry({ animeId: 1 })])
    const port = createMemorySyncPort({ status: 'needs-permission' })
    renderBanner(port)

    await userEvent.click(await screen.findByRole('button', { name: 'Datei wieder verbinden' }))

    expect(port.requestPermission).toHaveBeenCalledOnce()
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Datei wieder verbinden' })).not.toBeInTheDocument()
    )
  })
})
