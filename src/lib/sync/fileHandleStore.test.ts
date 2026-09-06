import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
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
