import { describe, expect, it } from 'vitest'
import { HttpResponse, http } from 'msw'
import { server } from '@/test/mocks/server'
import { ANILIST_API_URL } from '@/constants/config'
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
