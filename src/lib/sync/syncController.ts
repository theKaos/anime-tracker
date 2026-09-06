import type { WatchlistEntry } from '@/types/watchlist'
import type { MergeStats } from '@/types/sync'
import type { PortStatus, SyncPort } from './syncPort'
import { toJson } from './serialize'
import { applyImport } from './applyImport'
import { purgeTombstones } from './tombstones'

export interface SyncState {
  status: PortStatus
  /** Zeitpunkt des letzten erfolgreichen Abgleichs, null wenn noch keiner lief. */
  lastSyncedAt: string | null
  error: string | null
  busy: boolean
}

export interface SyncControllerDeps {
  port: SyncPort
  getEntries: () => WatchlistEntry[]
  setEntries: (entries: WatchlistEntry[]) => void
  onState: (state: SyncState) => void
  /** Ergebnis eines Abgleichs, der etwas verändert hat. */
  onMerged?: (stats: MergeStats) => void
  now?: () => Date
  debounceMs?: number
}

export interface SyncController {
  getState: () => SyncState
  refreshStatus: () => Promise<void>
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  grantPermission: () => Promise<void>
  syncNow: () => Promise<void>
  /** Von Änderungen im Store aufgerufen: sammelt und schreibt verzögert. */
  scheduleSync: () => void
  dispose: () => void
}

const DEFAULT_DEBOUNCE_MS = 2000

function describe(error: unknown): string {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return 'Der Zugriff auf die Datei wurde entzogen. Verbinde sie erneut.'
  }
  if (error instanceof DOMException && error.name === 'NotFoundError') {
    return 'Die Datei wurde verschoben oder gelöscht. Wähle sie erneut aus.'
  }
  if (error instanceof Error && error.message) return error.message
  return 'Der Abgleich ist fehlgeschlagen.'
}

export function createSyncController(deps: SyncControllerDeps): SyncController {
  const { port, getEntries, setEntries, onState, onMerged } = deps
  const now = deps.now ?? (() => new Date())
  const debounceMs = deps.debounceMs ?? DEFAULT_DEBOUNCE_MS

  let state: SyncState = {
    status: port.isSupported() ? 'disconnected' : 'unsupported',
    lastSyncedAt: null,
    error: null,
    busy: false,
  }

  let timer: ReturnType<typeof setTimeout> | null = null
  let running: Promise<void> | null = null
  let rerunRequested = false
  let disposed = false
  let lastWritten: string | null = null

  function emit(patch: Partial<SyncState>) {
    state = { ...state, ...patch }
    if (!disposed) onState(state)
  }

  async function readStatus(): Promise<PortStatus> {
    try {
      return await port.getStatus()
    } catch {
      return 'disconnected'
    }
  }

  /**
   * Read-Merge-Write. Der Lesevorgang ist nicht optional: Ohne ihn überschreibt
   * dieses Gerät jede Änderung, die das andere seit dem letzten Abgleich gemacht
   * hat — der Merge-Algorithmus hilft nicht, wenn er den anderen Stand nie sieht.
   */
  async function runSync(): Promise<void> {
    const status = await readStatus()
    if (status !== 'connected') {
      emit({ status })
      return
    }

    const local = getEntries()
    const incoming = await port.read()

    let entries: WatchlistEntry[]
    let stats: MergeStats | null = null

    if (incoming) {
      const outcome = applyImport(local, incoming.text, now())
      if (!outcome.ok) {
        emit({ status, error: outcome.error.message })
        return
      }
      entries = outcome.result.entries
      stats = outcome.result.stats
    } else {
      entries = purgeTombstones(local, now())
    }

    const json = toJson(entries, now())
    // Vergleich ohne den Zeitstempel: sonst schriebe jeder Abgleich eine neue
    // Datei und der Cloud-Client synchronisierte ohne Anlass.
    const fileChanged = stripExportedAt(json) !== (lastWritten && stripExportedAt(lastWritten))

    // Nur schreiben, wenn sich wirklich etwas geändert hat. Sonst löst dieser
    // Aufruf über das Store-Abo den nächsten Abgleich aus — und der den nächsten.
    if (!sameEntries(local, entries)) setEntries(entries)

    if (fileChanged) {
      await port.write(json)
      lastWritten = json
    }

    emit({ status: 'connected', error: null, lastSyncedAt: now().toISOString() })
    if (stats && onMerged && (stats.added || stats.updated || stats.removed)) onMerged(stats)
  }

  function stripExportedAt(json: string): string {
    return json.replace(/"exportedAt":\s*"[^"]*",?\s*/, '')
  }

  function sameEntries(a: WatchlistEntry[], b: WatchlistEntry[]): boolean {
    if (a === b) return true
    if (a.length !== b.length) return false
    return a.every((entry, index) => {
      const other = b[index]
      return (
        entry.animeId === other.animeId &&
        entry.updatedAt === other.updatedAt &&
        entry.deletedAt === other.deletedAt &&
        entry.progress === other.progress &&
        entry.status === other.status
      )
    })
  }

  /** Serialisiert Abgleiche: Zwei überlappende Läufe würden sich gegenseitig überschreiben. */
  function enqueue(): Promise<void> {
    if (running) {
      rerunRequested = true
      return running
    }

    emit({ busy: true })
    running = (async () => {
      try {
        await runSync()
      } catch (error) {
        emit({ error: describe(error) })
      } finally {
        running = null
        emit({ busy: false })
        if (rerunRequested && !disposed) {
          rerunRequested = false
          void enqueue()
        }
      }
    })()

    return running
  }

  return {
    getState: () => state,

    async refreshStatus() {
      emit({ status: await readStatus() })
    },

    async connect() {
      emit({ error: null })
      try {
        const result = await port.connect()
        if (result === 'cancelled') return
        emit({ status: 'connected' })
        await enqueue()
      } catch (error) {
        emit({ error: describe(error) })
      }
    },

    async disconnect() {
      if (timer) clearTimeout(timer)
      timer = null
      lastWritten = null
      await port.disconnect()
      emit({ status: 'disconnected', lastSyncedAt: null, error: null })
    },

    async grantPermission() {
      const granted = await port.requestPermission()
      if (!granted) {
        emit({ status: 'needs-permission' })
        return
      }
      emit({ status: 'connected', error: null })
      await enqueue()
    },

    syncNow: () => enqueue(),

    scheduleSync() {
      if (disposed) return
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        void enqueue()
      }, debounceMs)
    },

    dispose() {
      disposed = true
      if (timer) clearTimeout(timer)
      timer = null
    },
  }
}
