'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { WatchlistEntry } from '@/types/watchlist'
import { useWatchlist } from '@/hooks/useWatchlist'
import { StatusSelect } from './StatusSelect'
import { ProgressControl } from './ProgressControl'
import { Button } from '@/components/ui/Button'

export function WatchlistItem({ entry }: { entry: WatchlistEntry }) {
  const { setStatus, setProgress, removeFromWatchlist } = useWatchlist()
  const title = entry.snapshot.title.english ?? entry.snapshot.title.romaji

  return (
    <div className="flex items-center gap-4 rounded-card bg-surface p-3 shadow-lift">
      <Link
        href={`/anime/${entry.animeId}`}
        className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-image"
      >
        <Image src={entry.snapshot.coverImage} alt={title} fill className="object-cover" />
      </Link>
      <div className="flex-1 space-y-2">
        <Link href={`/anime/${entry.animeId}`} className="text-ui font-semibold text-text">
          {title}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <StatusSelect value={entry.status} onChange={(status) => setStatus(entry.animeId, status)} />
          <ProgressControl
            progress={entry.progress}
            totalEpisodes={entry.totalEpisodes}
            onChange={(progress) => setProgress(entry.animeId, progress)}
          />
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={() => removeFromWatchlist(entry.animeId)}>
        Entfernen
      </Button>
    </div>
  )
}
