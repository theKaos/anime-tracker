import { WATCHLIST_FILE_NAME } from '@/constants/config'
import type { ConnectMode, ConnectResult, PortFile, PortStatus, SyncPort } from './syncPort'
import { clearFileHandle, loadFileHandle, saveFileHandle } from './fileHandleStore'
import {
  queryReadWritePermission,
  requestReadWritePermission,
  toPortStatus,
} from './permissions'

const FILE_TYPES: FilePickerAcceptType[] = [
  {
    description: 'Anime-Tracker-Watchlist',
    accept: { 'application/json': ['.json'] },
  },
]

function isSupported(): boolean {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window
}

function canCreate(): boolean {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

/**
 * File System Access. Chromium auf Desktop und — seit Chrome 132 — auch auf Android.
 * Alle anderen Browser bekommen über `isSupported()` eine ehrliche Absage und
 * benutzen weiter den manuellen Weg aus Phase 3.
 */
export function createFsaPort(): SyncPort {
  async function getHandle(): Promise<FileSystemFileHandle | null> {
    if (!isSupported()) return null
    return loadFileHandle()
  }

  /**
   * Vorhandene Datei verbinden. Der Öffnen-Dialog gibt ein Handle auf genau die
   * Datei zurück, die der Nutzer angetippt hat — auf Android über
   * ACTION_OPEN_DOCUMENT, das im Gegensatz zum Speichern-Dialog nichts neu anlegt.
   *
   * Der Öffnen-Dialog liefert nur Leserecht. Das Schreibrecht muss direkt danach
   * angefragt werden, solange die Nutzergeste des Dialogs noch gilt — später
   * lehnt der Browser die Anfrage ab.
   */
  async function connectExisting(): Promise<ConnectResult> {
    let handle: FileSystemFileHandle
    try {
      const [picked] = await window.showOpenFilePicker({
        multiple: false,
        types: FILE_TYPES,
        excludeAcceptAllOption: false,
      })
      handle = picked
    } catch (error) {
      if (isAbort(error)) return 'cancelled'
      throw error
    }

    // Das Handle wird auch bei verweigertem Schreibrecht gemerkt: Sonst müsste der
    // Nutzer die Datei erneut heraussuchen, statt die Berechtigung nachzureichen.
    await saveFileHandle(handle)

    if (!(await requestReadWritePermission(handle))) return 'permission-denied'
    return 'connected'
  }

  /** Neue Datei anlegen. Nur sinnvoll, wenn noch kein Gerät eine Datei geschrieben hat. */
  async function connectNew(): Promise<ConnectResult> {
    let handle: FileSystemFileHandle
    try {
      handle = await window.showSaveFilePicker({
        suggestedName: WATCHLIST_FILE_NAME,
        types: FILE_TYPES,
      })
    } catch (error) {
      if (isAbort(error)) return 'cancelled'
      throw error
    }

    await saveFileHandle(handle)
    return 'connected'
  }

  return {
    kind: 'fsa',

    isSupported,
    canCreate,

    async connect(mode: ConnectMode) {
      return mode === 'create' ? connectNew() : connectExisting()
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
