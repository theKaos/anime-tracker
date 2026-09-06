import type { WatchlistEntry } from '@/types/watchlist'
import type { ParseResult, WatchlistFile } from '@/types/sync'
import { APP_ID, SCHEMA_VERSION } from './fileFormat'
import { parseWatchlistFile } from './validate'

export function toFile(entries: WatchlistEntry[], now: Date = new Date()): WatchlistFile {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    app: APP_ID,
    entries,
  }
}

export function toJson(entries: WatchlistEntry[], now: Date = new Date()): string {
  return JSON.stringify(toFile(entries, now), null, 2)
}

export function fromJson(text: string): ParseResult {
  return parseWatchlistFile(text)
}
