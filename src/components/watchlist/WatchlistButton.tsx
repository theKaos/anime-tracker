'use client'

import type { Anime } from '@/types/anime'
import { Button } from '@/components/ui/Button'
import { useWatchlistStore } from '@/store/watchlistStore'

export function WatchlistButton({ anime, className }: { anime: Anime; className?: string }) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlistStore()
  const inWatchlist = isInWatchlist(anime.id)

  return (
    <Button
      variant={inWatchlist ? 'ghost' : 'primary'}
      className={className}
      onClick={() => (inWatchlist ? removeFromWatchlist(anime.id) : addToWatchlist(anime))}
    >
      {inWatchlist ? 'entfernen' : 'hinzufügen'}
    </Button>
  )
}
