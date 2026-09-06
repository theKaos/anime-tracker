import type { WatchlistEntry } from '@/types/watchlist'
import { TOMBSTONE_MAX_AGE_DAYS } from '@/constants/config'
import { isActive } from '@/lib/watchlist/selectors'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Wirft Grabsteine weg, die älter als die Frist sind. Ohne das wächst die Datei mit
 * jedem gelöschten Eintrag dauerhaft mit. Preis: Ein Gerät, das länger als die Frist
 * offline war, bringt die betroffenen Einträge beim nächsten Abgleich zurück.
 */
export function purgeTombstones(
  entries: WatchlistEntry[],
  now: Date = new Date(),
  maxAgeDays: number = TOMBSTONE_MAX_AGE_DAYS
): WatchlistEntry[] {
  const cutoff = now.getTime() - maxAgeDays * DAY_MS

  return entries.filter((entry) => {
    if (isActive(entry)) return true
    const deletedAt = Date.parse(entry.deletedAt as string)
    if (Number.isNaN(deletedAt)) return false
    return deletedAt >= cutoff
  })
}
