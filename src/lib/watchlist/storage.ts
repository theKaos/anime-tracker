import type { WatchlistEntry } from '@/types/watchlist'
import { STORAGE_KEY } from '@/constants/config'

/**
 * Einträge aus einer älteren Version haben kein `deletedAt`. Sie hier zu ergänzen ist
 * billiger, als überall im Code auf `undefined` zu prüfen — und verhindert, dass eine
 * bestehende Watchlist beim Update verloren geht.
 */
function normalize(value: unknown): WatchlistEntry[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
    .map((entry) => ({
      ...(entry as unknown as WatchlistEntry),
      deletedAt: typeof entry.deletedAt === 'string' ? entry.deletedAt : null,
    }))
}

export function loadWatchlist(): WatchlistEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return normalize(JSON.parse(raw))
  } catch {
    return []
  }
}

export function saveWatchlist(entries: WatchlistEntry[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}
