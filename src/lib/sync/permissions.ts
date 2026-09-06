import type { PortStatus } from './syncPort'

/**
 * Der Teil, an dem solche Features gewöhnlich scheitern.
 *
 * Das Handle in IndexedDB überlebt einen Browser-Neustart — die Berechtigung nicht.
 * Sobald alle Tabs der Origin geschlossen sind, verliert die Seite den Zugriff und
 * `queryPermission` liefert 'prompt'. Und `requestPermission` funktioniert nur
 * innerhalb einer Nutzergeste: Ein automatischer Aufruf beim Seitenaufbau schlägt
 * fehl. Deshalb wird 'prompt' hier zu 'needs-permission' und die UI zeigt einen
 * Button, statt still eine Anfrage zu versuchen.
 */
export function toPortStatus(permission: PermissionState): PortStatus {
  return permission === 'granted' ? 'connected' : 'needs-permission'
}

export async function queryReadWritePermission(
  handle: FileSystemFileHandle
): Promise<PermissionState> {
  try {
    return await handle.queryPermission({ mode: 'readwrite' })
  } catch {
    return 'denied'
  }
}

/** Darf ausschließlich aus einem Klick-Handler heraus aufgerufen werden. */
export async function requestReadWritePermission(
  handle: FileSystemFileHandle
): Promise<boolean> {
  try {
    return (await handle.requestPermission({ mode: 'readwrite' })) === 'granted'
  } catch {
    return false
  }
}
