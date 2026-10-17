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
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

export function SearchExperience({
  initialAnime,
  initialHasNextPage,
  filters,
  serverFetchFailed = false,
}: {
  initialAnime: Anime[]
  initialHasNextPage: boolean
  filters: SearchFilters
  serverFetchFailed?: boolean
}) {
  const router = useRouter()
  const { anime, hasNextPage, isLoading, error, loadMore, retry } = useAnimeSearch(
    initialAnime,
    initialHasNextPage,
    filters,
    serverFetchFailed
  )

  function updateFilters(next: SearchFilters) {
    const params = filtersToSearchParams(next)
    router.push(params.toString() ? `/?${params.toString()}` : '/')
  }

  const isEmpty = anime.length === 0

  return (
    <div className="space-y-6">
      <SearchBar defaultValue={filters.search} onSearch={(search) => updateFilters({ ...filters, search })} />
      <FilterPanel filters={filters} onChange={updateFilters} />

      {error && (
        <div
          role="alert"
          className="space-y-3 rounded-panel border border-border bg-surface p-6 text-center"
        >
          <p className="text-ui text-text">Die Anime konnten nicht geladen werden.</p>
          <p className="font-mono text-meta text-text-muted">{error}</p>
          <Button onClick={retry} disabled={isLoading}>
            Erneut versuchen
          </Button>
        </div>
      )}

      {isEmpty && isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {isEmpty && !isLoading && !error && (
        <p className="py-12 text-center text-ui text-text-muted">
          Keine Anime gefunden. Versuch es mit anderen Filtern.
        </p>
      )}

      <AnimeGrid anime={anime} />
      {/*
        Nach einem Fehler nicht automatisch weiterladen. Der Trigger bleibt sonst im
        Bild, jeder gescheiterte Versuch baut den Observer neu und der feuert sofort
        wieder — im Browser waren das rund 60 Anfragen pro Sekunde an AniList.
        Wiederholt wird über den Knopf in der Fehlermeldung.
      */}
      <InfiniteScrollTrigger
        onIntersect={loadMore}
        disabled={!hasNextPage || error !== null}
        isLoading={isLoading}
      />
    </div>
  )
}
