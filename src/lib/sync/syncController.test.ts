import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WatchlistEntry } from '@/types/watchlist'
import type { SyncState } from './syncController'
import { createSyncController } from './syncController'
import { toJson, fromJson } from './serialize'
import { makeEntry } from '@/test/utils/watchlistFactory'
import { createMemorySyncPort, type MemorySyncPort } from '@/test/utils/memorySyncPort'

const NOW = new Date('2026-08-25T12:00:00.000Z')

function setup(options: { entries?: WatchlistEntry[]; port?: MemorySyncPort } = {}) {
  const port = options.port ?? createMemorySyncPort({ status: 'connected' })
  let entries = options.entries ?? []
  const states: SyncState[] = []
  const onMerged = vi.fn()

  const controller = createSyncController({
    port,
    getEntries: () => entries,
    setEntries: (next) => {
      entries = next
    },
    onState: (state) => states.push(state),
    onMerged,
    now: () => NOW,
    debounceMs: 10,
  })

  return {
    port,
    controller,
    states,
    onMerged,
    getEntries: () => entries,
    lastState: () => states[states.length - 1],
  }
}

function entriesInFile(port: MemorySyncPort): WatchlistEntry[] {
  const parsed = fromJson(port.file ?? '')
  if (!parsed.ok) throw new Error(parsed.error.message)
  return parsed.file.entries
}

beforeEach(() => {
  vi.useRealTimers()
})

describe('createSyncController', () => {
  it('starts as unsupported when the browser cannot do it', () => {
    const port = createMemorySyncPort()
    port.isSupported = () => false
    const { controller } = setup({ port })

    expect(controller.getState().status).toBe('unsupported')
  })

  it('writes the local watchlist into an empty file', async () => {
    const local = [makeEntry({ animeId: 1, progress: 4 })]
    const { controller, port } = setup({ entries: local })

    await controller.syncNow()

    expect(entriesInFile(port)).toEqual(local)
  })

  it('merges the file into the local list instead of overwriting it', async () => {
    const local = [makeEntry({ animeId: 1, progress: 2, updatedAt: '2026-08-01T00:00:00.000Z' })]
    const remote = [
      makeEntry({ animeId: 1, progress: 9, updatedAt: '2026-08-20T00:00:00.000Z' }),
      makeEntry({ animeId: 2, updatedAt: '2026-08-20T00:00:00.000Z' }),
    ]
    const port = createMemorySyncPort({ status: 'connected', file: toJson(remote) })
    const { controller, getEntries } = setup({ entries: local, port })

    await controller.syncNow()

    expect(getEntries().map((entry) => entry.animeId)).toEqual([1, 2])
    expect(getEntries()[0].progress).toBe(9)
  })

  it('never lets an older file beat a newer local change', async () => {
    const local = [makeEntry({ animeId: 1, progress: 12, updatedAt: '2026-08-20T00:00:00.000Z' })]
    const stale = [makeEntry({ animeId: 1, progress: 1, updatedAt: '2026-08-01T00:00:00.000Z' })]
    const port = createMemorySyncPort({ status: 'connected', file: toJson(stale) })
    const { controller, getEntries } = setup({ entries: local, port })

    await controller.syncNow()

    expect(getEntries()[0].progress).toBe(12)
    expect(entriesInFile(port)[0].progress).toBe(12)
  })

  it('does not write again when nothing changed', async () => {
    const { controller, port } = setup({ entries: [makeEntry({ animeId: 1 })] })

    await controller.syncNow()
    await controller.syncNow()
    await controller.syncNow()

    expect(port.writes).toHaveLength(1)
  })

  it('does not touch the store when the merge changes nothing', async () => {
    const local = [makeEntry({ animeId: 1 })]
    const port = createMemorySyncPort({ status: 'connected', file: toJson(local) })
    const setEntries = vi.fn()

    const controller = createSyncController({
      port,
      getEntries: () => local,
      setEntries,
      onState: () => {},
      now: () => NOW,
    })

    await controller.syncNow()

    // Sonst löst dieser Aufruf über das Store-Abo den nächsten Abgleich aus.
    expect(setEntries).not.toHaveBeenCalled()
  })

  it('reports what a merge changed', async () => {
    const local = [makeEntry({ animeId: 1, updatedAt: '2026-08-01T00:00:00.000Z' })]
    const remote = [makeEntry({ animeId: 2, updatedAt: '2026-08-20T00:00:00.000Z' })]
    const port = createMemorySyncPort({ status: 'connected', file: toJson(remote) })
    const { controller, onMerged } = setup({ entries: local, port })

    await controller.syncNow()

    expect(onMerged).toHaveBeenCalledWith(
      expect.objectContaining({ added: 1, updated: 0, removed: 0 })
    )
  })

  it('stays silent when the file brought nothing new', async () => {
    const local = [makeEntry({ animeId: 1 })]
    const port = createMemorySyncPort({ status: 'connected', file: toJson(local) })
    const { controller, onMerged } = setup({ entries: local, port })

    await controller.syncNow()

    expect(onMerged).not.toHaveBeenCalled()
  })

  describe('permissions', () => {
    it('does nothing but report the status while permission is missing', async () => {
      const port = createMemorySyncPort({ status: 'needs-permission' })
      const { controller, lastState } = setup({ entries: [makeEntry({ animeId: 1 })], port })

      await controller.syncNow()

      expect(port.write).not.toHaveBeenCalled()
      expect(lastState().status).toBe('needs-permission')
    })

    it('syncs right after permission is granted', async () => {
      const port = createMemorySyncPort({ status: 'needs-permission' })
      const { controller } = setup({ entries: [makeEntry({ animeId: 1 })], port })

      await controller.grantPermission()

      expect(port.write).toHaveBeenCalledOnce()
    })

    it('stays in needs-permission when the user refuses', async () => {
      const port = createMemorySyncPort({ status: 'needs-permission' })
      port.requestPermission = vi.fn(async () => false)
      const { controller, lastState } = setup({ port })

      await controller.grantPermission()

      expect(lastState().status).toBe('needs-permission')
    })
  })

  describe('connecting', () => {
    it('syncs immediately after a file was chosen', async () => {
      const port = createMemorySyncPort({ status: 'disconnected' })
      const { controller } = setup({ entries: [makeEntry({ animeId: 1 })], port })

      await controller.connect('open')

      expect(port.writes).toHaveLength(1)
    })

    it('does nothing when the file dialog is cancelled', async () => {
      const port = createMemorySyncPort({ status: 'disconnected' })
      port.connect = vi.fn(async () => 'cancelled' as const)
      const { controller, lastState } = setup({ port })

      await controller.connect('open')

      expect(port.write).not.toHaveBeenCalled()
      expect(lastState().error).toBeNull()
    })

    it('forgets the file on disconnect without deleting it', async () => {
      const port = createMemorySyncPort({ status: 'connected', file: '{}' })
      const { controller, lastState } = setup({ port })

      await controller.disconnect()

      expect(lastState().status).toBe('disconnected')
      expect(port.file).toBe('{}')
    })
  })

  describe('errors', () => {
    it('explains a revoked permission in plain language', async () => {
      const port = createMemorySyncPort({ status: 'connected' })
      port.failNextWrite = new DOMException('nope', 'NotAllowedError')
      const { controller, lastState } = setup({ entries: [makeEntry({ animeId: 1 })], port })

      await controller.syncNow()

      expect(lastState().error).toMatch(/entzogen/)
    })

    it('explains a missing file', async () => {
      const port = createMemorySyncPort({ status: 'connected' })
      port.failNextWrite = new DOMException('gone', 'NotFoundError')
      const { controller, lastState } = setup({ entries: [makeEntry({ animeId: 1 })], port })

      await controller.syncNow()

      expect(lastState().error).toMatch(/verschoben oder gelöscht/)
    })

    it('keeps the local watchlist when the file is unreadable', async () => {
      const port = createMemorySyncPort({ status: 'connected', file: '{kein json' })
      const local = [makeEntry({ animeId: 1 })]
      const { controller, getEntries, lastState } = setup({ entries: local, port })

      await controller.syncNow()

      expect(getEntries()).toEqual(local)
      expect(lastState().error).toMatch(/kein gültiges JSON/)
      expect(port.write).not.toHaveBeenCalled()
    })
  })

  describe('scheduling', () => {
    it('collapses a burst of changes into a single sync', async () => {
      vi.useFakeTimers()
      const { controller, port } = setup({ entries: [makeEntry({ animeId: 1 })] })

      controller.scheduleSync()
      controller.scheduleSync()
      controller.scheduleSync()

      await vi.advanceTimersByTimeAsync(20)
      vi.useRealTimers()

      expect(port.write).toHaveBeenCalledOnce()
    })

    it('does not fire after dispose', async () => {
      vi.useFakeTimers()
      const { controller, port } = setup({ entries: [makeEntry({ animeId: 1 })] })

      controller.scheduleSync()
      controller.dispose()

      await vi.advanceTimersByTimeAsync(50)
      vi.useRealTimers()

      expect(port.write).not.toHaveBeenCalled()
    })

    it('does not let two syncs overlap', async () => {
      const port = createMemorySyncPort({ status: 'connected' })
      let release!: () => void
      const gate = new Promise<void>((resolve) => {
        release = resolve
      })

      const originalWrite = port.write
      port.write = vi.fn(async (text: string) => {
        await gate
        await originalWrite(text)
      })

      const { controller } = setup({ entries: [makeEntry({ animeId: 1 })], port })

      const first = controller.syncNow()
      const second = controller.syncNow()

      release()
      await first
      await second

      // Der zweite Aufruf hängt sich an den laufenden an, statt parallel zu schreiben.
      expect(port.write).toHaveBeenCalledTimes(1)
    })
  })
})

describe('a freshly created, still empty file', () => {
  // showSaveFilePicker legt beim Anlegen einer neuen Datei eine 0-Byte-Datei an.
  // Sie zu lesen ergibt "" — und JSON.parse("") wirft. Ohne Sonderbehandlung
  // scheitert der erste Abgleich, schreibt deshalb nie, und die Datei bleibt
  // für immer leer: der Fehler wiederholt sich bei jedem Versuch.
  it('initialises an empty file instead of failing', async () => {
    const port = createMemorySyncPort({ status: 'connected', file: '' })
    const { controller, lastState } = setup({ entries: [makeEntry({ animeId: 1 })], port })

    await controller.syncNow()

    expect(lastState().error).toBeNull()
    expect(entriesInFile(port).map((entry) => entry.animeId)).toEqual([1])
  })

  it('treats a whitespace-only file the same way', async () => {
    const port = createMemorySyncPort({ status: 'connected', file: '\n  \r\n' })
    const { controller, lastState } = setup({ entries: [makeEntry({ animeId: 1 })], port })

    await controller.syncNow()

    expect(lastState().error).toBeNull()
    expect(entriesInFile(port)).toHaveLength(1)
  })

  it('recovers on the next sync after the file was emptied externally', async () => {
    const port = createMemorySyncPort({ status: 'connected', file: '' })
    const { controller } = setup({ entries: [makeEntry({ animeId: 1 })], port })

    await controller.syncNow()
    port.file = ''
    await controller.syncNow()

    expect(entriesInFile(port)).toHaveLength(1)
  })
})

describe('the file is the truth, not what this device remembers writing', () => {
  it('repairs a file that was emptied behind the app\'s back', async () => {
    const port = createMemorySyncPort({ status: 'connected', file: '' })
    const { controller } = setup({ entries: [makeEntry({ animeId: 1 })], port })

    await controller.syncNow()
    port.file = '' // Dropbox-Panne, Editor-Unfall, was auch immer
    await controller.syncNow()

    expect(entriesInFile(port)).toHaveLength(1)
  })

  it('rewrites the file when someone replaced its content', async () => {
    const port = createMemorySyncPort({ status: 'connected' })
    const { controller } = setup({ entries: [makeEntry({ animeId: 1 })], port })

    await controller.syncNow()
    port.file = toJson([])
    await controller.syncNow()

    expect(entriesInFile(port)).toHaveLength(1)
  })

  it('still skips the write when the file already matches', async () => {
    const { controller, port } = setup({ entries: [makeEntry({ animeId: 1 })] })

    await controller.syncNow()
    await controller.syncNow()
    await controller.syncNow()

    expect(port.writes).toHaveLength(1)
  })
})

describe('connect mode — der Android-Fall', () => {
  // Auf Android führt showSaveFilePicker über ACTION_CREATE_DOCUMENT. Tippt man dort
  // eine vorhandene Datei an, überschreibt Dropbox sie nicht, sondern legt ein neues
  // Dokument mit selbst vergebenem Namen an. Nur showOpenFilePicker verbindet mit der
  // Datei, die der Nutzer wirklich gemeint hat.
  it('passes the open mode through to the port', async () => {
    const port = createMemorySyncPort({ status: 'disconnected' })
    const { controller } = setup({ port })

    await controller.connect('open')

    expect(port.connect).toHaveBeenCalledWith('open')
    expect(port.connectedWith).toBe('open')
  })

  it('passes the create mode through to the port', async () => {
    const port = createMemorySyncPort({ status: 'disconnected' })
    const { controller } = setup({ port })

    await controller.connect('create')

    expect(port.connectedWith).toBe('create')
  })

  it('merges the existing file instead of overwriting it when opening', async () => {
    const remote = [makeEntry({ animeId: 42, updatedAt: '2026-08-20T00:00:00.000Z' })]
    const port = createMemorySyncPort({ status: 'disconnected', file: toJson(remote) })
    const { controller, getEntries } = setup({
      entries: [makeEntry({ animeId: 1, updatedAt: '2026-08-01T00:00:00.000Z' })],
      port,
    })

    await controller.connect('open')

    expect(getEntries().map((entry) => entry.animeId)).toEqual([1, 42])
  })

  it('lands in needs-permission when write access was refused', async () => {
    const port = createMemorySyncPort({ status: 'disconnected' })
    port.connect = vi.fn(async () => 'permission-denied' as const)
    const { controller, lastState } = setup({ port })

    await controller.connect('open')

    expect(lastState().status).toBe('needs-permission')
    expect(lastState().error).toMatch(/Schreibrecht/)
    expect(port.write).not.toHaveBeenCalled()
  })
})
