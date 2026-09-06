import { parseSearchParamsFromRecord } from '@/lib/utils/searchParams'
import { fetchAnimeList } from '@/lib/anilist/client'
import { SearchExperience } from '@/components/search/SearchExperience'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const filters = parseSearchParamsFromRecord(await searchParams)
  const { anime, hasNextPage } = await fetchAnimeList(filters)

  return <SearchExperience initialAnime={anime} initialHasNextPage={hasNextPage} filters={filters} />
}
