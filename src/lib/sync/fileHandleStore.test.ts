import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearFileHandle, loadFileHandle, saveFileHandle } from './fileHandleStore'

/**
 * jsdom bringt kein IndexedDB mit — `fake-indexeddb/auto` schiebt eine Implementierung
 * unter. Ein echtes FileSystemFileHandle gibt es hier ebenfalls nicht; für den Speicher
 * zählt nur, dass der Wert strukturiert klonbar ist und unverändert zurückkommt.
 */
const handle = { name: 'anime-watchlist.json', kind: 'file' } as unknown as FileSystemFileHandle

beforeEach(async () => {
  await clearFileHandle()
})

describe('fileHandleStore', () => {
  it('returns null when nothing was ever stored', async () => {
    await expect(loadFileHandle()).resolves.toBeNull()
  })

  it('stores a handle across calls', async () => {
    await saveFileHandle(handle)
    await expect(loadFileHandle()).resolves.toMatchObject({ name: 'anime-watchlist.json' })
  })

  it('overwrites a previously stored handle', async () => {
    await saveFileHandle(handle)
    await saveFileHandle({ ...handle, name: 'andere.json' } as unknown as FileSystemFileHandle)

    await expect(loadFileHandle()).resolves.toMatchObject({ name: 'andere.json' })
  })

  it('forgets the handle on clear', async () => {
    await saveFileHandle(handle)
    await clearFileHandle()

    await expect(loadFileHandle()).resolves.toBeNull()
  })

  it('clearing twice is not an error', async () => {
    await clearFileHandle()
    await expect(clearFileHandle()).resolves.toBeUndefined()
  })
})

describe('fileHandleStore — wenn IndexedDB versagt', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  /** Ein IDBRequest-Ersatz, der im nächsten Tick scheitert. */
  function failingRequest(error: DOMException | null) {
    const request: { error: DOMException | null; onerror?: () => void } = { error }
    queueMicrotask(() => request.onerror?.())
    return request
  }

  it('without IndexedDB, saving fails loudly but loading and clearing stay quiet', async () => {
    vi.stubGlobal('indexedDB', undefined)

    await expect(saveFileHandle(handle)).rejects.toThrow('nicht verfügbar')
    await expect(loadFileHandle()).resolves.toBeNull()
    await expect(clearFileHandle()).resolves.toBeUndefined()
  })

  it('reports a database that cannot be opened', async () => {
    vi.stubGlobal('indexedDB', { open: () => failingRequest(null) })

    await expect(saveFileHandle(handle)).rejects.toThrow('konnte nicht geöffnet werden')
  })

  it('passes the browser error through when opening fails with one', async () => {
    const quota = new DOMException('Kein Platz', 'QuotaExceededError')
    vi.stubGlobal('indexedDB', { open: () => failingRequest(quota) })

    await expect(saveFileHandle(handle)).rejects.toBe(quota)
  })

  it('reports a failing read or write inside the transaction', async () => {
    const db = {
      transaction: () => ({ objectStore: () => ({ put: () => failingRequest(null) }) }),
    }
    vi.stubGlobal('indexedDB', {
      open: () => {
        const request: { result: unknown; onsuccess?: () => void } = { result: db }
        queueMicrotask(() => request.onsuccess?.())
        return request
      },
    })

    await expect(saveFileHandle(handle)).rejects.toThrow('Zugriff fehlgeschlagen')
  })
})
