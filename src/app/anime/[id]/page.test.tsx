import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as anilistClient from '@/lib/anilist/client'
import { AniListError } from '@/lib/anilist/errors'
import AnimeDetailPage from './page'

/** Wie in Next.js: notFound() bricht das Rendern per Exception ab. */
const NOT_FOUND = vi.hoisted(() => new Error('NEXT_NOT_FOUND'))

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw NOT_FOUND
  },
}))

afterEach(() => {
  vi.restoreAllMocks()
})

const page = (id: string) => AnimeDetailPage({ params: Promise.resolve({ id }) })

describe('AnimeDetailPage', () => {
  it('renders the anime with its watchlist button', async () => {
    render(await page('1'))

    expect(screen.getAllByText('Attack on Titan').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'hinzufügen' })).toBeInTheDocument()
  })

  it('answers a non-numeric id with 404 without asking AniList', async () => {
    const spy = vi.spyOn(anilistClient, 'fetchAnimeById')

    await expect(page('abc')).rejects.toBe(NOT_FOUND)
    expect(spy).not.toHaveBeenCalled()
  })

  it('maps an AniList 404 to the not-found page', async () => {
    vi.spyOn(anilistClient, 'fetchAnimeById').mockRejectedValueOnce(new AniListError('weg', 404))

    await expect(page('999')).rejects.toBe(NOT_FOUND)
  })

  it('lets every other failure reach the error boundary', async () => {
    const failure = new AniListError('gesperrt', 403)
    vi.spyOn(anilistClient, 'fetchAnimeById').mockRejectedValueOnce(failure)

    await expect(page('1')).rejects.toBe(failure)
  })
})
