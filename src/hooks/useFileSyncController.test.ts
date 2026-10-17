import { beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useFileSyncController } from './useFileSyncController'
import { createMemorySyncPort } from '@/test/utils/memorySyncPort'
import { makeEntry } from '@/test/utils/watchlistFactory'
import { resetWatchlistStore, setWatchlistEntries } from '@/test/utils/watchlistStoreTestUtils'

beforeEach(() => {
  resetWatchlistStore()
})

describe('useFileSyncController', () => {
  it('falls back to File System Access, which jsdom does not support', async () => {
    const { result } = renderHook(() => useFileSyncController())

    await waitFor(() => expect(result.current.state.status).toBe('unsupported'))
    expect(result.current.canCreate).toBe(false)
  })

  it('syncs on start when the permission is still granted', async () => {
    const port = createMemorySyncPort({ status: 'connected' })
    setWatchlistEntries([makeEntry({ animeId: 3 })])

    renderHook(() => useFileSyncController(port))

    await waitFor(() => expect(port.writes).toHaveLength(1))
  })

  it('syncNow writes the current watchlist on demand', async () => {
    const port = createMemorySyncPort({ status: 'needs-permission' })
    const { result } = renderHook(() => useFileSyncController(port))
    await waitFor(() => expect(result.current.state.status).toBe('needs-permission'))
    expect(port.writes).toHaveLength(0)

    port.status = 'connected'
    await act(async () => {
      await result.current.syncNow()
    })

    expect(port.writes).toHaveLength(1)
    expect(result.current.state.status).toBe('connected')
  })

  it('actions are harmless after unmount', async () => {
    const port = createMemorySyncPort({ status: 'connected' })
    const { result, unmount } = renderHook(() => useFileSyncController(port))
    const { syncNow, connect, disconnect, grantPermission } = result.current

    unmount()

    await expect(syncNow()).resolves.toBeUndefined()
    await expect(connect('open')).resolves.toBeUndefined()
    await expect(disconnect()).resolves.toBeUndefined()
    await expect(grantPermission()).resolves.toBeUndefined()
  })
})
