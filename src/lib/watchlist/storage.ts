import type { WatchlistEntry } from '@/types/watchlist'
import { STORAGE_KEY } from '@/constants/config'
import { parseEntries } from './parseEntries'

function normalize(value: unknown): WatchlistEntry[] {
  return Array.isArray(value) ? parseEntries(value) : []
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
