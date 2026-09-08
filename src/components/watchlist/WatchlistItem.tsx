'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { WatchlistEntry } from '@/types/watchlist'
import { useWatchlistStore } from '@/store/watchlistStore'
import { StatusSelect } from './StatusSelect'
import { ProgressControl } from './ProgressControl'
import { Button } from '@/components/ui/Button'
import { displayTitle } from '@/lib/utils/format'

export function WatchlistItem({ entry }: { entry: WatchlistEntry }) {
  const { setStatus, setProgress, removeFromWatchlist } = useWatchlistStore()
  const title = displayTitle(entry.snapshot.title)

  return (
    <div className="flex items-start gap-3 rounded-card bg-surface p-3 shadow-lift sm:items-center sm:gap-4">
      <Link
        href={`/anime/${entry.animeId}`}
        className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-image"
      >
        <Image src={entry.snapshot.coverImage} alt={title} fill className="object-cover" />
      </Link>

      {/*
        min-w-0 ist hier der entscheidende Teil: Flex-Kinder haben von Haus aus
        min-width:auto und können damit nicht unter die Mindestbreite ihres Inhalts
        schrumpfen. Ohne das schob der Fortschrittsbereich den Entfernen-Button aus
        der Kachel und aus dem Bildschirm heraus.

        Auf schmalen Geräten stapelt sich der Button unter die Steuerelemente, ab sm
        steht er wieder rechts daneben wie bisher.
      */}
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-2">
          <div className="text-ui font-semibold break-words text-text">{title}</div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusSelect
              value={entry.status}
              onChange={(status) => setStatus(entry.animeId, status)}
            />
            <ProgressControl
              progress={entry.progress}
              totalEpisodes={entry.totalEpisodes}
              onChange={(progress) => setProgress(entry.animeId, progress)}
            />
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 self-start sm:self-auto"
          onClick={() => removeFromWatchlist(entry.animeId)}
        >
          Entfernen
        </Button>
      </div>
    </div>
  )
}
