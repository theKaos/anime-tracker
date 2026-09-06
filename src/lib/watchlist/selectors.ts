import type { WatchlistEntry } from '@/types/watchlist'

/** Ein Eintrag ist aktiv, solange er keinen Grabstein trägt. */
export function isActive(entry: WatchlistEntry): boolean {
  return entry.deletedAt === null
}

/** Alles, was die UI zeigen darf. Grabsteine bleiben im Store, aber nie auf dem Bildschirm. */
export function activeEntries(entries: WatchlistEntry[]): WatchlistEntry[] {
  return entries.filter(isActive)
}

export function findActiveEntry(
  entries: WatchlistEntry[],
  animeId: number
): WatchlistEntry | undefined {
  return entries.find((entry) => entry.animeId === animeId && isActive(entry))
}

export function isInWatchlist(entries: WatchlistEntry[], animeId: number): boolean {
  return findActiveEntry(entries, animeId) !== undefined
}
