'use client'

import { useRouter } from 'next/navigation'
import type { Anime } from '@/types/anime'
import type { SearchFilters } from '@/types/filters'
import { filtersToSearchParams } from '@/lib/utils/searchParams'
import { useAnimeSearch } from '@/hooks/useAnimeSearch'
import { SearchBar } from '@/components/search/SearchBar'
import { FilterPanel } from '@/components/search/FilterPanel'
import { AnimeGrid } from '@/components/anime/AnimeGrid'
import { InfiniteScrollTrigger } from '@/components/search/InfiniteScrollTrigger'

export function SearchExperience({
  initialAnime,
  initialHasNextPage,
  filters,
}: {
  initialAnime: Anime[]
  initialHasNextPage: boolean
  filters: SearchFilters
}) {
  const router = useRouter()
  const { anime, hasNextPage, loadMore } = useAnimeSearch(initialAnime, initialHasNextPage, filters)

  function updateFilters(next: SearchFilters) {
    const params = filtersToSearchParams(next)
    router.push(params.toString() ? `/?${params.toString()}` : '/')
  }

  return (
    <div className="space-y-6">
      <SearchBar defaultValue={filters.search} onSearch={(search) => updateFilters({ ...filters, search })} />
      <FilterPanel filters={filters} onChange={updateFilters} />
      <AnimeGrid anime={anime} />
      <InfiniteScrollTrigger onIntersect={loadMore} disabled={!hasNextPage} />
    </div>
  )
}
