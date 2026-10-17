'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Anime } from '@/types/anime'
import type { SearchFilters } from '@/types/filters'
import { fetchAnimeList } from '@/lib/anilist/client'

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Die Anime konnten nicht geladen werden.'
}

export function useAnimeSearch(
  initialAnime: Anime[],
  initialHasNextPage: boolean,
  filters: SearchFilters,
  /**
   * Der Server konnte die erste Seite nicht liefern — dann holt der Browser sie
   * über die eigene Leitung nach. Dieselbe Anfrage, nur von einer IP, die AniList
   * nicht blockt.
   */
  needsInitialLoad = false
) {
  const [anime, setAnime] = useState(initialAnime)
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage)
  const [page, setPage] = useState(1)
  // Startet als "lädt", wenn der Browser die erste Seite selbst holen muss. Sonst
  // feuert der Infinite-Scroll-Trigger beim Mounten — sein Effekt läuft vor dem
  // dieses Hooks — und lädt Seite 2, bevor Seite 1 überhaupt angefragt wurde.
  const [isLoading, setIsLoading] = useState(needsInitialLoad)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    setAnime(initialAnime)
    setHasNextPage(initialHasNextPage)
    setPage(1)
    setError(null)
  }, [initialAnime, initialHasNextPage])

  useEffect(() => {
    if (!needsInitialLoad) return

    let cancelled = false
    setIsLoading(true)
    setError(null)

    fetchAnimeList({ ...filters, page: 1 })
      .then((result) => {
        if (cancelled) return
        setAnime(result.anime)
        setHasNextPage(result.hasNextPage)
        setPage(1)
      })
      .catch((err) => {
        if (!cancelled) setError(toMessage(err))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [needsInitialLoad, filters, reloadToken])

  const loadMore = useCallback(async () => {
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
      setError(toMessage(err))
      // Deliberately leave hasNextPage/page untouched so the user (or the
      // infinite-scroll observer) can retry the same page again.
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, hasNextPage, page, filters])

  /** Wiederholt das, was gerade gescheitert ist — Erstladung oder Nachladen. */
  const retry = useCallback(() => {
    if (needsInitialLoad) {
      setReloadToken((token) => token + 1)
      return
    }
    void loadMore()
  }, [needsInitialLoad, loadMore])

  return { anime, hasNextPage, isLoading, error, loadMore, retry }
}
