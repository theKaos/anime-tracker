import type { WatchlistEntry } from '@/types/watchlist'

/**
 * Baut einen Watchlist-Eintrag mit sinnvollen Vorgaben. Tests überschreiben nur das,
 * worum es ihnen geht — das hält die Merge-Tests lesbar.
 */
export function makeEntry(overrides: Partial<WatchlistEntry> = {}): WatchlistEntry {
  const animeId = overrides.animeId ?? 1
  return {
    animeId,
    status: 'PLANNING',
    progress: 0,
    totalEpisodes: 12,
    addedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    snapshot: {
      title: { romaji: `Anime ${animeId}`, english: null, native: `アニメ ${animeId}` },
      coverImage: `/cover-${animeId}.jpg`,
      format: 'TV',
    },
    ...overrides,
  }
}
