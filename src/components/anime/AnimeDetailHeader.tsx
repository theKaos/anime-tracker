import Image from 'next/image'
import type { Anime } from '@/types/anime'

export function AnimeDetailHeader({ anime }: { anime: Anime }) {
  const title = anime.title.english ?? anime.title.romaji

  return (
    <div className="overflow-hidden rounded-panel bg-surface shadow-lift">
      {anime.bannerImage && (
        <div className="relative h-48 w-full sm:h-64">
          <Image src={anime.bannerImage} alt="" fill className="object-cover" />
        </div>
      )}
      <div className="flex flex-col gap-4 p-6 sm:flex-row">
        <div className="relative aspect-[2/3] w-32 shrink-0 overflow-hidden rounded-image">
          <Image src={anime.coverImage} alt={title} fill className="object-cover" />
        </div>
        <div className="flex-1 space-y-2">
          <h1 className="text-h2 font-bold tracking-tight text-text">{title}</h1>
          {anime.title.native && <p className="font-mono text-meta text-text-muted">{anime.title.native}</p>}
          {anime.studios.length > 0 && <p className="text-ui text-text-muted">{anime.studios.join(', ')}</p>}
        </div>
      </div>
    </div>
  )
}
