import { http, HttpResponse } from 'msw'
import { ANILIST_API_URL } from '@/constants/config'
import trending from './fixtures/trending.json'
import searchResult from './fixtures/searchResult.json'
import animeDetail from './fixtures/animeDetail.json'

export const handlers = [
  http.post(ANILIST_API_URL, async ({ request }) => {
    const body = (await request.json()) as { query: string; variables: Record<string, unknown> }

    if (body.query.includes('Media(id:')) {
      return HttpResponse.json({ data: { Media: animeDetail } })
    }

    if (body.variables.search) {
      return HttpResponse.json({
        data: { Page: { pageInfo: { hasNextPage: false }, media: searchResult } },
      })
    }

    return HttpResponse.json({
      data: { Page: { pageInfo: { hasNextPage: true }, media: trending } },
    })
  }),
]
