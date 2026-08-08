import type { Anime, AnimeDetail } from '@/types/anime'
import type { SearchFilters } from '@/types/filters'
import type { AniListMediaResponse, AniListPageResponse } from '@/types/anilist'
import { ANILIST_API_URL, PAGE_SIZE } from '@/constants/config'
import { mapMediaToAnime, mapMediaToAnimeDetail } from './mappers'
import { ANIME_BY_ID_QUERY, SEARCH_ANIME_QUERY } from './queries'
import { AniListError } from './errors'

async function graphqlRequest<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(ANILIST_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables }),
  })

  const json = await response.json()

  if (!response.ok || json.errors) {
    const message = json.errors?.[0]?.message ?? 'AniList request failed'
    throw new AniListError(message, response.status)
  }

  return json.data as T
}

export async function fetchAnimeList(
  filters: SearchFilters
): Promise<{ anime: Anime[]; hasNextPage: boolean }> {
  const data = await graphqlRequest<AniListPageResponse>(SEARCH_ANIME_QUERY, {
    page: filters.page,
    perPage: PAGE_SIZE,
    search: filters.search || undefined,
    seasonYear: filters.year ?? undefined,
    season: filters.season ?? undefined,
    format: filters.format ?? undefined,
    genres: filters.genres.length ? filters.genres : undefined,
    sort: [filters.sort],
  })

  return {
    anime: data.Page.media.map(mapMediaToAnime),
    hasNextPage: data.Page.pageInfo.hasNextPage,
  }
}

export async function fetchAnimeById(id: number): Promise<AnimeDetail> {
  const data = await graphqlRequest<AniListMediaResponse>(ANIME_BY_ID_QUERY, { id })
  return mapMediaToAnimeDetail(data.Media)
}
