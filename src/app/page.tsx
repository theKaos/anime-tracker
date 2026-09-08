import type { Anime } from '@/types/anime'
import { parseSearchParamsFromRecord } from '@/lib/utils/searchParams'
import { fetchAnimeList } from '@/lib/anilist/client'
import { SearchExperience } from '@/components/search/SearchExperience'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const filters = parseSearchParamsFromRecord(await searchParams)

  let anime: Anime[] = []
  let hasNextPage = true
  let serverFetchFailed = false

  try {
    const result = await fetchAnimeList(filters)
    anime = result.anime
    hasNextPage = result.hasNextPage
  } catch (error) {
    // Ein gescheiterter Serverabruf darf die Seite nicht mitreißen. AniList
    // blockt Anfragen aus Rechenzentren — und genau von dort kommt dieser
    // Aufruf. Der Browser des Nutzers kommt über seine eigene Leitung durch,
    // also wird die Liste dort nachgeladen statt hier abzubrechen.
    console.error('[anime-tracker] AniList-Abruf auf dem Server fehlgeschlagen:', error)
    serverFetchFailed = true
  }

  return (
    <SearchExperience
      initialAnime={anime}
      initialHasNextPage={hasNextPage}
      filters={filters}
      serverFetchFailed={serverFetchFailed}
    />
  )
}
