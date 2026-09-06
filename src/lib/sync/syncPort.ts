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

/**
 * 'open'   — eine bereits vorhandene Datei auswählen (showOpenFilePicker).
 * 'create' — eine neue Datei anlegen (showSaveFilePicker).
 *
 * Die Trennung ist nicht kosmetisch. Auf Android führt der Speichern-Dialog über
 * ACTION_CREATE_DOCUMENT: Tippt man dort eine vorhandene Datei an, überschreibt
 * ein Cloud-Anbieter wie Dropbox sie nicht, sondern legt ein neues Dokument mit
 * selbst vergebenem Namen an. Wer sich mit der Datei des anderen Geräts verbinden
 * will, braucht deshalb zwingend den Öffnen-Dialog.
 */
export type ConnectMode = 'open' | 'create'

export type ConnectResult = 'connected' | 'cancelled' | 'permission-denied'

export interface SyncPort {
  readonly kind: string
  /** Kann dieser Browser den automatischen Modus überhaupt? */
  isSupported(): boolean
  /** Kann dieser Browser zusätzlich eine neue Datei anlegen? */
  canCreate(): boolean
  /** Datei auswählen lassen. 'cancelled', wenn der Nutzer den Dialog abbricht. */
  connect(mode: ConnectMode): Promise<ConnectResult>
  /** Verbindung lösen — löscht nur die Referenz, nie die Datei. */
  disconnect(): Promise<void>
  getStatus(): Promise<PortStatus>
  /** Nur aus einer Nutzergeste heraus aufrufen, sonst lehnt der Browser ab. */
  requestPermission(): Promise<boolean>
  /** null, wenn keine Datei verbunden ist. */
  read(): Promise<PortFile | null>
  write(text: string): Promise<void>
}
