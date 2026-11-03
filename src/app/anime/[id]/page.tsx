import { notFound } from 'next/navigation'
import * as z from 'zod'
import { fetchAnimeById } from '@/lib/anilist/client'
import { AniListError } from '@/lib/anilist/errors'
import { AnimeDetailHeader } from '@/components/anime/AnimeDetailHeader'
import { AnimeStats } from '@/components/anime/AnimeStats'
import { GenreList } from '@/components/anime/GenreList'
import { AnimeDescription } from '@/components/anime/AnimeDescription'
import { RelatedAnime } from '@/components/anime/RelatedAnime'
import { WatchlistButton } from '@/components/watchlist/WatchlistButton'

const AnimeIdParamSchema = z.coerce.number().int().positive()

export default async function AnimeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const animeId = AnimeIdParamSchema.safeParse(id)
  if (!animeId.success) notFound()

  let anime
  try {
    anime = await fetchAnimeById(animeId.data)
  } catch (error) {
    if (error instanceof AniListError && error.status === 404) notFound()
    throw error
  }

  return (
    <div className="space-y-6">
      <AnimeDetailHeader anime={anime} />
      <WatchlistButton anime={anime} />
      <AnimeStats anime={anime} />
      <GenreList genres={anime.genres} />
      <AnimeDescription description={anime.description} />
      <RelatedAnime relations={anime.relations} />
    </div>
  )
}
