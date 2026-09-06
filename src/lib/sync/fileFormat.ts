import type { WatchlistFile } from '@/types/sync'

/** Wird bei jeder Änderung am Aufbau der Datei erhöht. */
export const SCHEMA_VERSION = 1

/** Verhindert, dass eine beliebige fremde JSON-Datei als Watchlist durchgeht. */
export const APP_ID = 'anime-tracker'

type Migration = (file: WatchlistFile) => WatchlistFile

/**
 * Eine Migration je Versionssprung: MIGRATIONS[1] hebt Version 1 auf Version 2.
 * Solange es nur Version 1 gibt, ist die Kette leer — sie existiert, damit spätere
 * Formatänderungen alte Exporte nicht wertlos machen.
 */
const MIGRATIONS: Record<number, Migration> = {}

export function migrate(file: WatchlistFile): WatchlistFile {
  let current = file

  while (current.schemaVersion < SCHEMA_VERSION) {
    const step = MIGRATIONS[current.schemaVersion]
    if (!step) break
    current = step(current)
  }

  return { ...current, schemaVersion: SCHEMA_VERSION }
}
