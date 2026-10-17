import { afterEach, describe, expect, it, vi } from 'vitest'
import { HttpResponse, http } from 'msw'
import { server } from '@/test/mocks/server'
import { ANILIST_API_URL, ANILIST_USER_AGENT } from '@/constants/config'
import { DEFAULT_FILTERS } from '@/lib/utils/searchParams'
import { fetchAnimeById, fetchAnimeList } from './client'
import { AniListError } from './errors'

describe('fetchAnimeList', () => {
  it('returns trending anime by default', async () => {
    const result = await fetchAnimeList({ ...DEFAULT_FILTERS, page: 1 })
    expect(result.anime.length).toBeGreaterThan(0)
    expect(result.hasNextPage).toBe(true)
    expect(result.anime[0].title.english).toBe('Attack on Titan')
  })

  it('returns search results when search is set', async () => {
    const result = await fetchAnimeList({ ...DEFAULT_FILTERS, search: 'bocchi', page: 1 })
    expect(result.anime[0].title.romaji).toBe('Bocchi the Rock!')
  })

  it('throws AniListError on non-OK response', async () => {
    server.use(
      http.post(ANILIST_API_URL, () =>
        HttpResponse.json({ errors: [{ message: 'Rate limited' }] }, { status: 429 })
      )
    )
    await expect(fetchAnimeList(DEFAULT_FILTERS)).rejects.toBeInstanceOf(AniListError)
  })
})

describe('fetchAnimeById', () => {
  it('returns anime detail with relations', async () => {
    const detail = await fetchAnimeById(1)
    expect(detail.title.english).toBe('Attack on Titan')
    expect(detail.relations).toHaveLength(1)
  })
})

describe('graphqlRequest — der Produktionsfehler vom 08.09.', () => {
  // AniLists Edge antwortet Rechenzentrums-IPs mit 403 und einer HTML-Seite.
  // Vorher scheiterte schon response.json() mit einem nackten SyntaxError:
  // kein Status, kein Hinweis, was tatsächlich zurückkam.
  it('turns an HTML block page into a readable AniListError', async () => {
    server.use(
      http.post(ANILIST_API_URL, () =>
        HttpResponse.html('<html><body>error code: 1020</body></html>', { status: 403 })
      )
    )

    await expect(fetchAnimeList(DEFAULT_FILTERS)).rejects.toMatchObject({
      name: 'AniListError',
      status: 403,
    })
  })

  it('keeps the body around so the cause is visible', async () => {
    server.use(
      http.post(ANILIST_API_URL, () =>
        HttpResponse.html('<html><body>error code: 1020</body></html>', { status: 403 })
      )
    )

    const error = await fetchAnimeList(DEFAULT_FILTERS).catch((err: AniListError) => err)
    expect(error).toBeInstanceOf(AniListError)
    expect((error as AniListError).bodySnippet).toContain('1020')
  })

  it('reports an unreachable API instead of leaking a raw fetch error', async () => {
    server.use(http.post(ANILIST_API_URL, () => HttpResponse.error()))

    const error = await fetchAnimeList(DEFAULT_FILTERS).catch((err: AniListError) => err)
    expect(error).toBeInstanceOf(AniListError)
    expect((error as AniListError).status).toBe(0)
    expect((error as AniListError).message).toMatch(/nicht erreichbar/)
  })

  it('rejects an empty 200 response instead of returning undefined data', async () => {
    server.use(http.post(ANILIST_API_URL, () => HttpResponse.json({})))

    await expect(fetchAnimeList(DEFAULT_FILTERS)).rejects.toBeInstanceOf(AniListError)
  })

  it('sends a User-Agent so a WAF does not drop the request outright', async () => {
    let seen: string | null = null
    server.use(
      http.post(ANILIST_API_URL, ({ request }) => {
        seen = request.headers.get('user-agent')
        return HttpResponse.json({
          data: { Page: { pageInfo: { hasNextPage: false }, media: [] } },
        })
      })
    )

    await fetchAnimeList(DEFAULT_FILTERS)
    expect(seen).toBe(ANILIST_USER_AGENT)
  })
})

describe('fetchAnimeList — Filter landen als GraphQL-Variablen', () => {
  function captureVariables() {
    const seen: { variables?: Record<string, unknown> } = {}
    server.use(
      http.post(ANILIST_API_URL, async ({ request }) => {
        seen.variables = ((await request.json()) as { variables: Record<string, unknown> }).variables
        return HttpResponse.json({
          data: { Page: { pageInfo: { hasNextPage: false }, media: [] } },
        })
      })
    )
    return seen
  }

  it('sends set filters as they are', async () => {
    const seen = captureVariables()

    await fetchAnimeList({
      ...DEFAULT_FILTERS,
      search: 'frieren',
      year: 2023,
      season: 'FALL',
      format: 'TV',
      genres: ['Fantasy', 'Drama'],
      page: 3,
    })

    expect(seen.variables).toMatchObject({
      page: 3,
      search: 'frieren',
      seasonYear: 2023,
      season: 'FALL',
      format: 'TV',
      genres: ['Fantasy', 'Drama'],
      sort: [DEFAULT_FILTERS.sort],
    })
  })

  it('leaves empty filters out instead of sending empty values', async () => {
    const seen = captureVariables()

    await fetchAnimeList({ ...DEFAULT_FILTERS, search: '', genres: [] })

    // JSON.stringify verwirft undefined — die Schlüssel fehlen also ganz.
    expect(seen.variables).not.toHaveProperty('search')
    expect(seen.variables).not.toHaveProperty('genres')
    expect(seen.variables).not.toHaveProperty('seasonYear')
  })
})

describe('graphqlRequest — Fehlerbilder', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('names the timeout instead of a cryptic abort', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new DOMException('aborted', 'TimeoutError'))

    await expect(fetchAnimeList(DEFAULT_FILTERS)).rejects.toMatchObject({
      status: 0,
      message: expect.stringMatching(/innerhalb von 10 Sekunden/),
    })
  })

  it('copes with a thrown value that is not an Error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue('offline')

    await expect(fetchAnimeList(DEFAULT_FILTERS)).rejects.toThrow('AniList ist nicht erreichbar: offline')
  })

  it('still sends the request where AbortSignal.timeout is missing', async () => {
    const original = AbortSignal.timeout
    Object.defineProperty(AbortSignal, 'timeout', { value: undefined, configurable: true })
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: { Media: null } }))
    )

    try {
      await fetchAnimeById(1).catch(() => undefined)
      expect(fetchSpy.mock.calls[0][1]?.signal).toBeUndefined()
    } finally {
      Object.defineProperty(AbortSignal, 'timeout', { value: original, configurable: true })
    }
  })

  it('falls back to the HTTP status when the error has no GraphQL message', async () => {
    server.use(http.post(ANILIST_API_URL, () => HttpResponse.json({}, { status: 500 })))

    await expect(fetchAnimeList(DEFAULT_FILTERS)).rejects.toMatchObject({
      status: 500,
      message: 'AniList-Anfrage fehlgeschlagen (HTTP 500)',
    })
  })

  it('has no snippet for an empty body', async () => {
    server.use(http.post(ANILIST_API_URL, () => new HttpResponse('   ', { status: 502 })))

    const error = (await fetchAnimeList(DEFAULT_FILTERS).catch((err) => err)) as AniListError
    expect(error.status).toBe(502)
    expect(error.bodySnippet).toBeNull()
  })

  it('cuts a long body down to a readable snippet', async () => {
    server.use(http.post(ANILIST_API_URL, () => HttpResponse.html('x'.repeat(500), { status: 403 })))

    const error = (await fetchAnimeList(DEFAULT_FILTERS).catch((err) => err)) as AniListError
    expect(error.bodySnippet).toBe(`${'x'.repeat(200)}…`)
  })
})
