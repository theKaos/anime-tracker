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

  useEffect(() => {
    setAnime(initialAnime)
    setHasNextPage(initialHasNextPage)
    setPage(1)
  }, [initialAnime, initialHasNextPage])

  async function loadMore() {
    if (isLoading || !hasNextPage) return
    setIsLoading(true)
    const nextPage = page + 1
    const result = await fetchAnimeList({ ...filters, page: nextPage })
    setAnime((current) => [...current, ...result.anime])
    setHasNextPage(result.hasNextPage)
    setPage(nextPage)
    setIsLoading(false)
  }

  return { anime, hasNextPage, isLoading, loadMore }
}
