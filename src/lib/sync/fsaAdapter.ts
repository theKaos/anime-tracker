import { WATCHLIST_FILE_NAME } from '@/constants/config'
import type { PortFile, PortStatus, SyncPort } from './syncPort'
import { clearFileHandle, loadFileHandle, saveFileHandle } from './fileHandleStore'
import {
  queryReadWritePermission,
  requestReadWritePermission,
  toPortStatus,
} from './permissions'

function isSupported(): boolean {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window
}

/**
 * File System Access. Nur Chromium auf dem Desktop — laut MDN "Limited availability".
 * Alle anderen Browser bekommen über `isSupported()` eine ehrliche Absage und
 * benutzen weiter den manuellen Weg aus Phase 3.
 */
export function createFsaPort(): SyncPort {
  async function getHandle(): Promise<FileSystemFileHandle | null> {
    if (!isSupported()) return null
    return loadFileHandle()
  }

  return {
    kind: 'fsa',

    isSupported,

    async connect() {
      let handle: FileSystemFileHandle
      try {
        handle = await window.showSaveFilePicker({
          suggestedName: WATCHLIST_FILE_NAME,
          types: [
            {
              description: 'Anime-Tracker-Watchlist',
              accept: { 'application/json': ['.json'] },
            },
          ],
        })
      } catch (error) {
        // Abbruch im Dateidialog ist kein Fehler, sondern eine Entscheidung.
        if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
        throw error
      }

      await saveFileHandle(handle)
      return 'connected'
    },

    async disconnect() {
      await clearFileHandle()
    },

    async getStatus(): Promise<PortStatus> {
      if (!isSupported()) return 'unsupported'
      const handle = await getHandle()
      if (!handle) return 'disconnected'
      return toPortStatus(await queryReadWritePermission(handle))
    },

    async requestPermission() {
      const handle = await getHandle()
      if (!handle) return false
      return requestReadWritePermission(handle)
    },

    async read(): Promise<PortFile | null> {
      const handle = await getHandle()
      if (!handle) return null

      const file = await handle.getFile()
      return { text: await file.text(), lastModified: file.lastModified }
    },

    async write(text: string) {
      const handle = await getHandle()
      if (!handle) throw new Error('Es ist keine Watchlist-Datei verbunden.')

      // Geschrieben wird erst beim Schließen des Streams — das passt zum
      // Cloud-Client, der auf abgeschlossene Schreibvorgänge reagiert.
      const writable = await handle.createWritable()
      await writable.write(text)
      await writable.close()
    },
  }
}
