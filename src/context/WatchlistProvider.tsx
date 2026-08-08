'use client'

import { createContext, useEffect, useReducer, useState, type ReactNode } from 'react'
import type { Anime } from '@/types/anime'
import type { WatchlistEntry, WatchStatus } from '@/types/watchlist'
import { watchlistReducer } from '@/lib/watchlist/reducer'
import { loadWatchlist, saveWatchlist } from '@/lib/watchlist/storage'

export interface WatchlistContextValue {
  entries: WatchlistEntry[]
  addToWatchlist: (anime: Anime) => void
  removeFromWatchlist: (animeId: number) => void
  setProgress: (animeId: number, progress: number) => void
  setStatus: (animeId: number, status: WatchStatus) => void
  isInWatchlist: (animeId: number) => boolean
}

export const WatchlistContext = createContext<WatchlistContextValue | null>(null)

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [entries, dispatch] = useReducer(watchlistReducer, [])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    dispatch({ type: 'HYDRATE', entries: loadWatchlist() })
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveWatchlist(entries)
  }, [entries, hydrated])

  const value: WatchlistContextValue = {
    entries,
    addToWatchlist: (anime) =>
      dispatch({
        type: 'ADD',
        entry: {
          animeId: anime.id,
          status: 'PLANNING',
          progress: 0,
          totalEpisodes: anime.episodes,
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          snapshot: { title: anime.title, coverImage: anime.coverImage, format: anime.format },
        },
      }),
    removeFromWatchlist: (animeId) => dispatch({ type: 'REMOVE', animeId }),
    setProgress: (animeId, progress) => dispatch({ type: 'SET_PROGRESS', animeId, progress }),
    setStatus: (animeId, status) => dispatch({ type: 'SET_STATUS', animeId, status }),
    isInWatchlist: (animeId) => entries.some((entry) => entry.animeId === animeId),
  }

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>
}
