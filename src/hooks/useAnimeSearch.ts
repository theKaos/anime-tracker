'use client'

import { useEffect, useState } from 'react'
import type { Anime } from '@/types/anime'
import type { SearchFilters } from '@/types/filters'
import { fetchAnimeList } from '@/lib/anilist/client'

export function useAnimeSearch(
  initialAnime: Anime[],
  initialHasNextPage: boolean,
  filters: SearchFilters
) {
  const [anime, setAnime] = useState(initialAnime)
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setAnime(initialAnime)
    setHasNextPage(initialHasNextPage)
    setPage(1)
    setError(null)
  }, [initialAnime, initialHasNextPage])

  async function loadMore() {
    if (isLoading || !hasNextPage) return
    setIsLoading(true)
    setError(null)
    const nextPage = page + 1
    try {
      const result = await fetchAnimeList({ ...filters, page: nextPage })
      setAnime((current) => [...current, ...result.anime])
      setHasNextPage(result.hasNextPage)
      setPage(nextPage)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load more anime.'
      setError(message)
      // Deliberately leave hasNextPage/page untouched so the user (or the
      // infinite-scroll observer) can retry the same page again.
    } finally {
      setIsLoading(false)
    }
  }

  return { anime, hasNextPage, isLoading, error, loadMore }
}
