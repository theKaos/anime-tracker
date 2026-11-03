import * as z from 'zod'
import type { Anime, AnimeDetail } from '@/types/anime'
import type { SearchFilters } from '@/types/filters'
import { AniListMediaResponseSchema, AniListPageResponseSchema } from '@/types/anilist'
import {
  ANILIST_API_URL,
  ANILIST_REVALIDATE_SECONDS,
  ANILIST_TIMEOUT_MS,
  ANILIST_USER_AGENT,
  PAGE_SIZE,
} from '@/constants/config'
import { mapMediaToAnime, mapMediaToAnimeDetail } from './mappers'
import { ANIME_BY_ID_QUERY, SEARCH_ANIME_QUERY } from './queries'
import { AniListError } from './errors'

const GraphQLResponseSchema = z.object({
  data: z.unknown().optional(),
  errors: z.array(z.object({ message: z.string().optional() })).optional(),
})

/** Status 0 heißt: Es kam gar keine HTTP-Antwort zurück. */
const NO_RESPONSE = 0
const SNIPPET_LENGTH = 200

function snippet(body: string): string | null {
  const trimmed = body.trim()
  if (!trimmed) return null
  return trimmed.length > SNIPPET_LENGTH ? `${trimmed.slice(0, SNIPPET_LENGTH)}…` : trimmed
}

/** jsdom und ältere Laufzeiten kennen AbortSignal.timeout nicht. */
function timeoutSignal(ms: number): AbortSignal | undefined {
  if (typeof AbortSignal === 'undefined' || typeof AbortSignal.timeout !== 'function') {
    return undefined
  }
  return AbortSignal.timeout(ms)
}

function describeNetworkFailure(error: unknown): AniListError {
  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return new AniListError(
      `AniList hat nicht innerhalb von ${ANILIST_TIMEOUT_MS / 1000} Sekunden geantwortet.`,
      NO_RESPONSE
    )
  }
  const reason = error instanceof Error ? error.message : String(error)
  return new AniListError(`AniList ist nicht erreichbar: ${reason}`, NO_RESPONSE)
}

function describeUnexpectedData(error: z.ZodError, status: number, body: string): AniListError {
  const [issue] = error.issues
  return new AniListError(
    `AniList hat unerwartete Daten geliefert (${issue.path.join('.')}: ${issue.message}).`,
    status,
    snippet(body)
  )
}

async function graphqlRequest<T>(
  query: string,
  variables: Record<string, unknown>,
  schema: z.ZodType<T>
): Promise<T> {
  let response: Response
  try {
    response = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': ANILIST_USER_AGENT,
      },
      body: JSON.stringify({ query, variables }),
      signal: timeoutSignal(ANILIST_TIMEOUT_MS),
      next: { revalidate: ANILIST_REVALIDATE_SECONDS },
    })
  } catch (error) {
    throw describeNetworkFailure(error)
  }

  // Erst als Text lesen, dann parsen. Antwortet AniLists Edge mit einer
  // HTML-Sperrseite, würde ein direktes response.json() mit einem nackten
  // SyntaxError abbrechen — ohne Status, ohne Hinweis, was eigentlich kam.
  const body = await response.text()

  let raw: unknown
  try {
    raw = JSON.parse(body)
  } catch {
    throw new AniListError(
      `AniList hat kein JSON geliefert (HTTP ${response.status}). Vermutlich blockiert die API diese Anfrage.`,
      response.status,
      snippet(body)
    )
  }

  const parsed = GraphQLResponseSchema.safeParse(raw)
  if (!parsed.success) throw describeUnexpectedData(parsed.error, response.status, body)
  const json = parsed.data

  if (!response.ok || json.errors) {
    const message = json.errors?.[0]?.message ?? `AniList-Anfrage fehlgeschlagen (HTTP ${response.status})`
    throw new AniListError(message, response.status, snippet(body))
  }

  if (!json.data) {
    throw new AniListError('AniList hat eine leere Antwort geliefert.', response.status, snippet(body))
  }

  const data = schema.safeParse(json.data)
  if (!data.success) throw describeUnexpectedData(data.error, response.status, body)

  return data.data
}

export async function fetchAnimeList(
  filters: SearchFilters
): Promise<{ anime: Anime[]; hasNextPage: boolean }> {
  const data = await graphqlRequest(
    SEARCH_ANIME_QUERY,
    {
      page: filters.page,
      perPage: PAGE_SIZE,
      search: filters.search || undefined,
      seasonYear: filters.year ?? undefined,
      season: filters.season ?? undefined,
      format: filters.format ?? undefined,
      genres: filters.genres.length ? filters.genres : undefined,
      sort: [filters.sort],
    },
    AniListPageResponseSchema
  )

  return {
    anime: data.Page.media.map(mapMediaToAnime),
    hasNextPage: data.Page.pageInfo.hasNextPage,
  }
}

export async function fetchAnimeById(id: number): Promise<AnimeDetail> {
  const data = await graphqlRequest(ANIME_BY_ID_QUERY, { id }, AniListMediaResponseSchema)
  return mapMediaToAnimeDetail(data.Media)
}
