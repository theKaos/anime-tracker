'use client'

import type { Anime } from '@/types/anime'
import { Button } from '@/components/ui/Button'
import { useWatchlist } from '@/hooks/useWatchlist'

export function WatchlistButton({ anime }: { anime: Anime }) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist()
  const inWatchlist = isInWatchlist(anime.id)

  return (
    <Button
      variant={inWatchlist ? 'ghost' : 'primary'}
      onClick={() => (inWatchlist ? removeFromWatchlist(anime.id) : addToWatchlist(anime))}
    >
      {inWatchlist ? 'Von Watchlist entfernen' : 'Zur Watchlist hinzufügen'}
    </Button>
  )
}
