import type { WatchlistEntry, WatchStatus } from '@/types/watchlist'
import { displayTitle } from '@/lib/utils/format'
import { activeEntries } from './selectors'

export type WatchlistSortOption = 'TITLE_ASC' | 'PROGRESS_DESC' | 'PROGRESS_ASC'

export function sortWatchlistEntries(
  entries: WatchlistEntry[],
  sort: WatchlistSortOption
): WatchlistEntry[] {
  const sorted = [...entries]
  switch (sort) {
    case 'TITLE_ASC':
      return sorted.sort((a, b) =>
        displayTitle(a.snapshot.title).localeCompare(displayTitle(b.snapshot.title), 'de')
      )
    case 'PROGRESS_DESC':
      return sorted.sort((a, b) => b.progress - a.progress)
    case 'PROGRESS_ASC':
      return sorted.sort((a, b) => a.progress - b.progress)
    default:
      return sorted
  }
}

/**
 * Filtert nach Status und wirft dabei immer Grabsteine weg — auch bei 'ALL'.
 * Bewusst hier und nicht nur im Aufrufer: eine vergessene Filterung würde
 * gelöschte Einträge sichtbar machen.
 */
export function filterWatchlistEntries(
  entries: WatchlistEntry[],
  status: WatchStatus | 'ALL'
): WatchlistEntry[] {
  const active = activeEntries(entries)
  return status === 'ALL' ? active : active.filter((entry) => entry.status === status)
}
