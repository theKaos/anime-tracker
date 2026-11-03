import { describe, expect, it } from 'vitest'
import { mapMediaToAnime, mapMediaToAnimeDetail } from './mappers'
import type { AniListMedia } from '@/types/anilist'

const baseMedia: AniListMedia = {
  id: 1,
  title: { romaji: 'Test Romaji', english: 'Test English', native: 'テスト' },
  coverImage: { large: 'https://example.com/cover.jpg' },
  bannerImage: null,
  format: 'TV',
  episodes: 12,
  duration: 24,
  seasonYear: 2020,
  season: 'FALL',
  genres: ['Action'],
  averageScore: 80,
  popularity: 1000,
  status: 'FINISHED',
  studios: { nodes: [{ name: 'Test Studio' }] },
}

describe('mapMediaToAnime', () => {
  it('maps AniList media to the internal Anime model', () => {
    expect(mapMediaToAnime(baseMedia)).toEqual({
      id: 1,
      title: { romaji: 'Test Romaji', english: 'Test English', native: 'テスト' },
      coverImage: 'https://example.com/cover.jpg',
      bannerImage: null,
      format: 'TV',
      episodes: 12,
      duration: 24,
      seasonYear: 2020,
      season: 'FALL',
      genres: ['Action'],
      averageScore: 80,
      popularity: 1000,
      status: 'FINISHED',
      studios: ['Test Studio'],
      description: null,
    })
  })

  it('falls back to placeholder cover when missing', () => {
    const media = { ...baseMedia, coverImage: { large: null } }
    expect(mapMediaToAnime(media).coverImage).toBe('/placeholder-cover.svg')
  })

  it('maps a missing format and season to null', () => {
    const media = { ...baseMedia, format: null, season: null } as unknown as AniListMedia
    expect(mapMediaToAnime(media)).toMatchObject({ format: null, season: null })
  })

  it('maps a format the app does not know to null', () => {
    // Relationen sind nicht auf type: ANIME gefiltert und liefern z. B. MANGA.
    expect(mapMediaToAnime({ ...baseMedia, format: 'MANGA' }).format).toBeNull()
  })

  it('fills missing title parts with the next best value', () => {
    const media = { ...baseMedia, title: { romaji: null, english: null, native: 'テスト' } }
    expect(mapMediaToAnime(media).title).toEqual({ romaji: 'テスト', english: null, native: 'テスト' })
  })

  it('maps a completely untitled media to empty strings', () => {
    const media = { ...baseMedia, title: { romaji: null, english: null, native: null } }
    expect(mapMediaToAnime(media).title).toEqual({ romaji: '', english: null, native: '' })
  })
})

describe('mapMediaToAnimeDetail', () => {
  it('maps relations edges to Anime[]', () => {
    const media: AniListMedia = {
      ...baseMedia,
      description: '<p>Desc</p>',
      relations: { edges: [{ relationType: 'SEQUEL', node: { ...baseMedia, id: 2 } }] },
    }
    const detail = mapMediaToAnimeDetail(media)
    expect(detail.description).toBe('<p>Desc</p>')
    expect(detail.relations).toHaveLength(1)
    expect(detail.relations[0].id).toBe(2)
  })

  it('returns empty relations array when none present', () => {
    expect(mapMediaToAnimeDetail(baseMedia).relations).toEqual([])
  })
})
