import { parseSearchParams } from '@/lib/utils/searchParams'
import { fetchAnimeList } from '@/lib/anilist/client'
import { SearchExperience } from '@/components/search/SearchExperience'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedParams = await searchParams
  const urlParams = new URLSearchParams()
  for (const [key, value] of Object.entries(resolvedParams)) {
    if (typeof value === 'string') urlParams.set(key, value)
  }
  const filters = parseSearchParams(urlParams)
  const { anime, hasNextPage } = await fetchAnimeList(filters)

  return <SearchExperience initialAnime={anime} initialHasNextPage={hasNextPage} filters={filters} />
}
