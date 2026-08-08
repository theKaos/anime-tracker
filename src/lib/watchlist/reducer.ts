import type { WatchlistEntry, WatchStatus } from '@/types/watchlist'

export type WatchlistAction =
  | { type: 'ADD'; entry: WatchlistEntry }
  | { type: 'REMOVE'; animeId: number }
  | { type: 'SET_PROGRESS'; animeId: number; progress: number }
  | { type: 'SET_STATUS'; animeId: number; status: WatchStatus }
  | { type: 'HYDRATE'; entries: WatchlistEntry[] }

export function watchlistReducer(state: WatchlistEntry[], action: WatchlistAction): WatchlistEntry[] {
  switch (action.type) {
    case 'ADD':
      if (state.some((entry) => entry.animeId === action.entry.animeId)) return state
      return [...state, action.entry]
    case 'REMOVE':
      return state.filter((entry) => entry.animeId !== action.animeId)
    case 'SET_PROGRESS':
      return state.map((entry) =>
        entry.animeId === action.animeId
          ? { ...entry, progress: action.progress, updatedAt: new Date().toISOString() }
          : entry
      )
    case 'SET_STATUS':
      return state.map((entry) =>
        entry.animeId === action.animeId
          ? { ...entry, status: action.status, updatedAt: new Date().toISOString() }
          : entry
      )
    case 'HYDRATE':
      return action.entries
    default:
      return state
  }
}
