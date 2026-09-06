/**
 * Die Naht zwischen Sync-Logik und Browser-API.
 *
 * Alles, was der Controller über die Außenwelt wissen muss, steckt hier drin.
 * Dadurch läuft die gesamte Ablauflogik in Tests gegen eine In-Memory-Datei —
 * jsdom kennt weder File System Access noch echte Dateien.
 */
export type PortStatus = 'unsupported' | 'disconnected' | 'needs-permission' | 'connected'

export interface PortFile {
  text: string
  /** Änderungszeit der Datei, um unnötiges Neu-Parsen zu vermeiden. */
  lastModified: number
}

export interface SyncPort {
  readonly kind: string
  /** Kann dieser Browser den automatischen Modus überhaupt? */
  isSupported(): boolean
  /** Datei auswählen lassen. 'cancelled', wenn der Nutzer den Dialog abbricht. */
  connect(): Promise<'connected' | 'cancelled'>
  /** Verbindung lösen — löscht nur die Referenz, nie die Datei. */
  disconnect(): Promise<void>
  getStatus(): Promise<PortStatus>
  /** Nur aus einer Nutzergeste heraus aufrufen, sonst lehnt der Browser ab. */
  requestPermission(): Promise<boolean>
  /** null, wenn keine Datei verbunden ist. */
  read(): Promise<PortFile | null>
  write(text: string): Promise<void>
}
