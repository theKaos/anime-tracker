import { vi } from 'vitest'
import type { ConnectMode, PortFile, PortStatus, SyncPort } from '@/lib/sync/syncPort'

export interface MemorySyncPort extends SyncPort {
  /** Aktueller Dateiinhalt, null wenn die Datei noch nicht existiert. */
  file: string | null
  status: PortStatus
  /** Nächster write() soll scheitern — für die Fehlerpfade. */
  failNextWrite: Error | null
  writes: string[]
  /** Mit welchem Modus zuletzt verbunden wurde. */
  connectedWith: ConnectMode | null
}

/**
 * Ersetzt die File System Access API in Tests. jsdom kennt weder `showSaveFilePicker`
 * noch echte Dateien — deshalb existiert das SyncPort-Interface überhaupt.
 */
export function createMemorySyncPort(initial: Partial<MemorySyncPort> = {}): MemorySyncPort {
  const port: MemorySyncPort = {
    kind: 'memory',
    file: initial.file ?? null,
    status: initial.status ?? 'disconnected',
    failNextWrite: null,
    writes: [],
    connectedWith: null,

    isSupported: () => true,
    canCreate: () => true,

    connect: vi.fn(async (mode: ConnectMode) => {
      port.connectedWith = mode
      port.status = 'connected'
      return 'connected' as const
    }),

    disconnect: vi.fn(async () => {
      port.status = 'disconnected'
    }),

    getStatus: vi.fn(async () => port.status),

    requestPermission: vi.fn(async () => {
      port.status = 'connected'
      return true
    }),

    read: vi.fn(async (): Promise<PortFile | null> => {
      if (port.file === null) return null
      return { text: port.file, lastModified: 0 }
    }),

    write: vi.fn(async (text: string) => {
      if (port.failNextWrite) {
        const error = port.failNextWrite
        port.failNextWrite = null
        throw error
      }
      port.file = text
      port.writes.push(text)
    }),
  }

  return port
}
