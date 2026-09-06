import Image from 'next/image'
import Link from 'next/link'
import type { Anime } from '@/types/anime'
import { Badge } from '@/components/ui/Badge'
import { GenreList } from './GenreList'
import { displayTitle, formatScore, formatSeasonYear } from '@/lib/utils/format'
import { WatchlistButton } from '@/components/watchlist/WatchlistButton'

export function AnimeCard({ anime }: { anime: Anime }) {
  const title = displayTitle(anime.title)

  return (
    <div
      className="group flex h-full flex-col overflow-hidden rounded-card bg-surface shadow-lift transition-transform duration-200 hover:-translate-y-1"
    >
      <Link
      className='block'
      href={`/anime/${anime.id}`}>
        <div className="relative aspect-[2/3] overflow-hidden">
          <Image
            src={anime.coverImage}
            alt={title}
            fill
            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
            className="rounded-image object-cover"
          />
          <div className="absolute inset-0 flex flex-col justify-end gap-2 bg-black/80 p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <p className="font-mono text-meta uppercase tracking-wide text-white/70">
              {formatSeasonYear(anime.seasonYear, anime.season)}
            </p>
            {anime.status && (
              <p className="font-mono text-meta uppercase tracking-wide text-white/70">{anime.status}</p>
            )}
            <GenreList genres={anime.genres} limit={4} />
          </div>
        </div>
        <div className="space-y-1 p-3">
          <h3 className="line-clamp-2 text-ui font-semibold text-text">{title}</h3>
          <div className="flex items-center gap-2 font-mono text-meta text-text-muted mt-3">
            {anime.format && <div>{anime.format}</div>}
            {anime.averageScore !== null && <Badge variant="primary">{formatScore(anime.averageScore)}</Badge>}
          </div>
          {anime.episodes &&
            <div className="flex items-center gap-2 font-mono text-meta text-text-muted mt-3">
              <div>Episodes: {anime.episodes}</div>
            </div>
          }
        </div>
      </Link>
      <div className="mt-auto p-3 pt-0">
        <WatchlistButton anime={anime} className="w-full" />
      </div>
    </div>
  )
}
