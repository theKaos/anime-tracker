import { describe, expect, it } from 'vitest'
import { watchlistReducer } from './reducer'
import { makeEntry } from '@/test/utils/watchlistFactory'

const entry = makeEntry({ animeId: 1 })

describe('watchlistReducer', () => {
  it('adds a new entry', () => {
    expect(watchlistReducer([], { type: 'ADD', entry })).toEqual([entry])
  })

  it('does not add a duplicate entry', () => {
    expect(watchlistReducer([entry], { type: 'ADD', entry })).toEqual([entry])
  })

  it('updates progress', () => {
    const result = watchlistReducer([entry], { type: 'SET_PROGRESS', animeId: 1, progress: 5 })
    expect(result[0].progress).toBe(5)
  })

  it('updates status', () => {
    const result = watchlistReducer([entry], { type: 'SET_STATUS', animeId: 1, status: 'WATCHING' })
    expect(result[0].status).toBe('WATCHING')
  })

  it('bumps updatedAt on every change', () => {
    const result = watchlistReducer([entry], { type: 'SET_PROGRESS', animeId: 1, progress: 5 })
    expect(Date.parse(result[0].updatedAt)).toBeGreaterThan(Date.parse(entry.updatedAt))
  })

  describe('tombstones', () => {
    it('marks an entry as deleted instead of dropping it', () => {
      const result = watchlistReducer([entry], { type: 'REMOVE', animeId: 1 })
      expect(result).toHaveLength(1)
      expect(result[0].deletedAt).not.toBeNull()
    })

    it('bumps updatedAt when deleting, so the delete can win a merge', () => {
      const result = watchlistReducer([entry], { type: 'REMOVE', animeId: 1 })
      expect(Date.parse(result[0].updatedAt)).toBeGreaterThan(Date.parse(entry.updatedAt))
    })

    it('leaves an already deleted entry untouched', () => {
      const dead = makeEntry({ animeId: 1, deletedAt: '2026-02-01T00:00:00.000Z' })
      expect(watchlistReducer([dead], { type: 'REMOVE', animeId: 1 })).toEqual([dead])
    })

    it('revives a tombstone when the same anime is added again', () => {
      const dead = makeEntry({ animeId: 1, deletedAt: '2026-02-01T00:00:00.000Z' })
      const result = watchlistReducer([dead], { type: 'ADD', entry })

      expect(result).toHaveLength(1)
      expect(result[0].deletedAt).toBeNull()
    })

    it('ignores progress and status changes on a tombstone', () => {
      const dead = makeEntry({ animeId: 1, deletedAt: '2026-02-01T00:00:00.000Z' })
      expect(watchlistReducer([dead], { type: 'SET_PROGRESS', animeId: 1, progress: 9 })).toEqual([
        dead,
      ])
      expect(
        watchlistReducer([dead], { type: 'SET_STATUS', animeId: 1, status: 'COMPLETED' })
      ).toEqual([dead])
    })
  })

  it('replaces the whole list on REPLACE_ALL', () => {
    const next = [makeEntry({ animeId: 7 })]
    expect(watchlistReducer([entry], { type: 'REPLACE_ALL', entries: next })).toEqual(next)
  })
})

describe('watchlistReducer — Randfälle', () => {
  it('leaves other entries alone when reviving a tombstone', () => {
    const other = makeEntry({ animeId: 2 })
    const tombstone = makeEntry({ animeId: 1, deletedAt: '2026-02-01T00:00:00.000Z' })

    const result = watchlistReducer([tombstone, other], { type: 'ADD', entry })

    expect(result[0].deletedAt).toBeNull()
    expect(result[1]).toBe(other)
  })

  it('returns the state unchanged for an unknown action', () => {
    const state = [entry]
    const unknown = { type: 'UNKNOWN' } as unknown as Parameters<typeof watchlistReducer>[1]

    expect(watchlistReducer(state, unknown)).toBe(state)
  })
})
