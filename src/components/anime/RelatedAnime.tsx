import Image from 'next/image'
import Link from 'next/link'
import type { Anime } from '@/types/anime'

export function RelatedAnime({ relations }: { relations: Anime[] }) {
  if (relations.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="text-lead font-semibold text-text">Verwandte Anime</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {relations.map((anime) => {
          const title = anime.title.english ?? anime.title.romaji
          return (
            <Link
              key={anime.id}
              href={`/anime/${anime.id}`}
              className="w-28 shrink-0 space-y-1 rounded-card bg-surface p-2 shadow-lift"
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-image">
                <Image src={anime.coverImage} alt={title} fill className="object-cover" />
              </div>
              <p className="line-clamp-2 text-meta text-text">{title}</p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
