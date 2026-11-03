import { StoredEntrySchema, type WatchlistEntry } from '@/types/watchlist'

/** Verwirft einzelne kaputte Einträge, statt die ganze Watchlist abzulehnen. */
export function parseEntries(values: unknown[]): WatchlistEntry[] {
  return values.flatMap((value) => {
    const result = StoredEntrySchema.safeParse(value)
    return result.success ? [result.data] : []
  })
}
