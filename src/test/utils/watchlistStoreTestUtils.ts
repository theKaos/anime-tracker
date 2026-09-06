import type { WatchlistEntry } from '@/types/watchlist'
import { useWatchlistStore } from '@/store/watchlistStore'

/**
 * Der Zustand-Store ist ein Modul-Singleton und hydratisiert beim Import aus dem
 * localStorage. Ohne diesen Reset schleppt jeder Test den Zustand des vorherigen mit.
 */
export function setWatchlistEntries(entries: WatchlistEntry[]): void {
  useWatchlistStore.setState({ entries, hydrated: true })
}

export function resetWatchlistStore(): void {
  setWatchlistEntries([])
}

export function getWatchlistEntries(): WatchlistEntry[] {
  return useWatchlistStore.getState().entries
}
