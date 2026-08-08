import { useContext } from 'react'
import { WatchlistContext, type WatchlistContextValue } from '@/context/WatchlistProvider'

export function useWatchlist(): WatchlistContextValue {
  const context = useContext(WatchlistContext)
  if (!context) throw new Error('useWatchlist must be used within WatchlistProvider')
  return context
}
