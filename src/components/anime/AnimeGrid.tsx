import type { Anime } from '@/types/anime'
import { AnimeCard } from './AnimeCard'

export function AnimeGrid({ anime }: { anime: Anime[] }) {
  if (anime.length === 0) {
    return <p className="py-12 text-center text-ui text-text-muted">Keine Ergebnisse gefunden.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {anime.map((item) => (
        <AnimeCard key={item.id} anime={item} />
      ))}
    </div>
  )
}
