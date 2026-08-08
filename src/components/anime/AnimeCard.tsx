import Image from 'next/image'
import Link from 'next/link'
import type { Anime } from '@/types/anime'
import { Badge } from '@/components/ui/Badge'
import { formatScore } from '@/lib/utils/format'

export function AnimeCard({ anime }: { anime: Anime }) {
  const title = anime.title.english ?? anime.title.romaji

  return (
    <Link
      href={`/anime/${anime.id}`}
      className="group block overflow-hidden rounded-card bg-surface shadow-lift transition-transform duration-200 hover:-translate-y-1"
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <Image
          src={anime.coverImage}
          alt={title}
          fill
          sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
          className="rounded-image object-cover"
        />
      </div>
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-2 text-ui font-semibold text-text">{title}</h3>
        <div className="flex items-center gap-2 font-mono text-meta text-text-muted">
          {anime.format && <span>{anime.format}</span>}
          {anime.averageScore !== null && <Badge variant="primary">{formatScore(anime.averageScore)}</Badge>}
        </div>
      </div>
    </Link>
  )
}
