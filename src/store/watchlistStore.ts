import { create } from 'zustand'
import type { Anime } from '@/types/anime'
import type { WatchlistEntry, WatchStatus } from '@/types/watchlist'
import { watchlistReducer } from '@/lib/watchlist/reducer'
import { loadWatchlist, saveWatchlist } from '@/lib/watchlist/storage'
import { isInWatchlist as selectIsInWatchlist } from '@/lib/watchlist/selectors'

export interface WatchlistState {
  /** Enthält auch Grabsteine. Für die Anzeige immer über die Selektoren gehen. */
  entries: WatchlistEntry[]
  hydrated: boolean
  addToWatchlist: (anime: Anime) => void
  removeFromWatchlist: (animeId: number) => void
  setProgress: (animeId: number, progress: number) => void
  setStatus: (animeId: number, status: WatchStatus) => void
  /** Ergebnis eines Imports/Abgleichs übernehmen. */
  replaceAll: (entries: WatchlistEntry[]) => void
  isInWatchlist: (animeId: number) => boolean
}

export const useWatchlistStore = create<WatchlistState>()((set, get) => ({
  entries: [],
  hydrated: false,
  addToWatchlist: (anime) =>
    set((state) => {
      const now = new Date().toISOString()
      return {
        entries: watchlistReducer(state.entries, {
          type: 'ADD',
          entry: {
            animeId: anime.id,
            status: 'PLANNING',
            progress: 0,
            totalEpisodes: anime.episodes,
            addedAt: now,
            updatedAt: now,
            deletedAt: null,
            snapshot: { title: anime.title, coverImage: anime.coverImage, format: anime.format },
          },
        }),
      }
    }),
  removeFromWatchlist: (animeId) =>
    set((state) => ({ entries: watchlistReducer(state.entries, { type: 'REMOVE', animeId }) })),
  setProgress: (animeId, progress) =>
    set((state) => ({
      entries: watchlistReducer(state.entries, { type: 'SET_PROGRESS', animeId, progress }),
    })),
  setStatus: (animeId, status) =>
    set((state) => ({
      entries: watchlistReducer(state.entries, { type: 'SET_STATUS', animeId, status }),
    })),
  replaceAll: (entries) =>
    set((state) => ({ entries: watchlistReducer(state.entries, { type: 'REPLACE_ALL', entries }) })),
  isInWatchlist: (animeId) => selectIsInWatchlist(get().entries, animeId),
}))

if (typeof window !== 'undefined') {
  useWatchlistStore.setState({ entries: loadWatchlist(), hydrated: true })
  useWatchlistStore.subscribe((state, prevState) => {
    if (state.hydrated && state.entries !== prevState.entries) saveWatchlist(state.entries)
  })
}
