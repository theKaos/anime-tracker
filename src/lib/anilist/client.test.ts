import { describe, expect, it } from 'vitest'
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
