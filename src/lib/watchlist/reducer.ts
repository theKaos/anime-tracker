import type { WatchlistEntry, WatchStatus } from '@/types/watchlist'
import { isActive } from './selectors'

export type WatchlistAction =
  | { type: 'ADD'; entry: WatchlistEntry }
  | { type: 'REMOVE'; animeId: number }
  | { type: 'SET_PROGRESS'; animeId: number; progress: number }
  | { type: 'SET_STATUS'; animeId: number; status: WatchStatus }
  | { type: 'REPLACE_ALL'; entries: WatchlistEntry[] }

function touch(entry: WatchlistEntry, patch: Partial<WatchlistEntry>): WatchlistEntry {
  return { ...entry, ...patch, updatedAt: new Date().toISOString() }
}

export function watchlistReducer(
  state: WatchlistEntry[],
  action: WatchlistAction
): WatchlistEntry[] {
  switch (action.type) {
    case 'ADD': {
      const existing = state.find((entry) => entry.animeId === action.entry.animeId)
      // Bereits aktiv vorhanden: nichts tun.
      if (existing && isActive(existing)) return state
      // Grabstein vorhanden: wiederbeleben, statt den ADD zu verschlucken.
      if (existing) {
        return state.map((entry) =>
          entry.animeId === action.entry.animeId ? { ...action.entry, deletedAt: null } : entry
        )
      }
      return [...state, action.entry]
    }
    case 'REMOVE':
      return state.map((entry) =>
        entry.animeId === action.animeId && isActive(entry)
          ? touch(entry, { deletedAt: new Date().toISOString() })
          : entry
      )
    case 'SET_PROGRESS':
      return state.map((entry) =>
        entry.animeId === action.animeId && isActive(entry)
          ? touch(entry, { progress: action.progress })
          : entry
      )
    case 'SET_STATUS':
      return state.map((entry) =>
        entry.animeId === action.animeId && isActive(entry)
          ? touch(entry, { status: action.status })
          : entry
      )
    case 'REPLACE_ALL':
      return action.entries
    default:
      return state
  }
}
