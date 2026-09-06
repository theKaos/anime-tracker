const DB_NAME = 'anime-tracker'
const DB_VERSION = 1
const STORE_NAME = 'sync'
const HANDLE_KEY = 'watchlist-file-handle'

/**
 * Das Datei-Handle muss einen Browser-Neustart überleben, und localStorage kann das
 * nicht: Handles sind strukturiert klonbar, aber nicht serialisierbar. Deshalb
 * IndexedDB — bewusst von Hand statt mit einer Bibliothek, es geht um genau einen Wert.
 *
 * Achtung: Das Handle überlebt, die Berechtigung nicht (siehe permissions.ts).
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB ist in dieser Umgebung nicht verfügbar.'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB konnte nicht geöffnet werden.'))
  })
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode)
        const request = operation(transaction.objectStore(STORE_NAME))

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error ?? new Error('IndexedDB-Zugriff fehlgeschlagen.'))
        transaction.oncomplete = () => db.close()
      })
  )
}

export async function saveFileHandle(handle: FileSystemFileHandle): Promise<void> {
  await runTransaction('readwrite', (store) => store.put(handle, HANDLE_KEY))
}

export async function loadFileHandle(): Promise<FileSystemFileHandle | null> {
  try {
    const handle = await runTransaction<FileSystemFileHandle | undefined>('readonly', (store) =>
      store.get(HANDLE_KEY)
    )
    return handle ?? null
  } catch {
    // Ein unlesbarer Speicher darf die App nicht blockieren — sie läuft weiter
    // auf dem localStorage und bietet einfach wieder "Datei verbinden" an.
    return null
  }
}

export async function clearFileHandle(): Promise<void> {
  try {
    await runTransaction('readwrite', (store) => store.delete(HANDLE_KEY))
  } catch {
    // Nichts zu tun: Wenn schon das Löschen scheitert, ist auch nichts gespeichert.
  }
}
