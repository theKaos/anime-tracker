import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { ComponentProps } from 'react'
import * as anilistClient from '@/lib/anilist/client'
import type { SearchExperience } from '@/components/search/SearchExperience'
import HomePage from './page'

/** Was die Seite an die Client-Komponente weiterreicht, ist hier das Prüfobjekt. */
const received = vi.hoisted(() => ({ props: null as Record<string, unknown> | null }))

vi.mock('@/components/search/SearchExperience', () => ({
  SearchExperience: (props: ComponentProps<typeof SearchExperience>) => {
    received.props = props
    return null
  },
}))

afterEach(() => {
  vi.restoreAllMocks()
  received.props = null
})

async function renderPage(searchParams: Record<string, string | string[] | undefined> = {}) {
  render(await HomePage({ searchParams: Promise.resolve(searchParams) }))
  return received.props
}

describe('HomePage', () => {
  it('renders the first page fetched on the server', async () => {
    const props = await renderPage()

    expect(props).toMatchObject({ initialHasNextPage: true, serverFetchFailed: false })
    expect((props?.initialAnime as unknown[]).length).toBeGreaterThan(0)
  })

  it('turns the query string into filters', async () => {
    const spy = vi.spyOn(anilistClient, 'fetchAnimeList')

    const props = await renderPage({ search: 'bocchi', season: 'FALL' })

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ search: 'bocchi', season: 'FALL' }))
    expect(props?.filters).toMatchObject({ search: 'bocchi', season: 'FALL' })
  })

  it('hands the job to the browser when AniList blocks the server', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(anilistClient, 'fetchAnimeList').mockRejectedValueOnce(new Error('403'))

    const props = await renderPage()

    expect(props).toMatchObject({
      initialAnime: [],
      initialHasNextPage: true,
      serverFetchFailed: true,
    })
    expect(error).toHaveBeenCalledWith(expect.stringContaining('fehlgeschlagen'), expect.any(Error))
  })
})
