import type { WatchlistEntry } from '@/types/watchlist'

export type WatchlistSortOption = 'TITLE_ASC' | 'PROGRESS_DESC' | 'PROGRESS_ASC'

function titleOf(entry: WatchlistEntry): string {
  return entry.snapshot.title.english ?? entry.snapshot.title.romaji
}

export function sortWatchlistEntries(
  entries: WatchlistEntry[],
  sort: WatchlistSortOption
): WatchlistEntry[] {
  const sorted = [...entries]
  switch (sort) {
    case 'TITLE_ASC':
      return sorted.sort((a, b) => titleOf(a).localeCompare(titleOf(b), 'de'))
    case 'PROGRESS_DESC':
      return sorted.sort((a, b) => b.progress - a.progress)
    case 'PROGRESS_ASC':
      return sorted.sort((a, b) => a.progress - b.progress)
    default:
      return sorted
  }
}
