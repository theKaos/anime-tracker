import type { WatchlistEntry } from './watchlist'

/** Aufbau der exportierten JSON-Datei. */
export interface WatchlistFile {
  schemaVersion: number
  exportedAt: string
  app: string
  entries: WatchlistEntry[]
}

export interface MergeStats {
  unchanged: number
  updated: number
  added: number
  removed: number
}

export interface MergeResult {
  entries: WatchlistEntry[]
  stats: MergeStats
}

export type ValidationErrorCode =
  /** Datei ist 0 Byte groß oder enthält nur Leerraum — kein Fehler, nur noch nichts drin. */
  | 'empty'
  | 'not-json'
  | 'not-an-object'
  | 'wrong-app'
  | 'unsupported-version'
  | 'invalid-entries'

export interface ValidationError {
  code: ValidationErrorCode
  /** Für den Nutzer lesbar, nicht für Logs. */
  message: string
}

export type ParseResult =
  | { ok: true; file: WatchlistFile }
  | { ok: false; error: ValidationError }

/**
 * Zustände der Sync-Anzeige. 'needs-permission', 'synced' und 'error' greifen erst
 * mit der File-System-Access-Automatik (Phase 4); bis dahin ist alles 'unsupported'
 * oder 'disconnected'.
 */
export type SyncStatus = 'unsupported' | 'disconnected' | 'needs-permission' | 'synced' | 'error'
