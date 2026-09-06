import { describe, expect, it } from 'vitest'
import { mergeWatchlists } from './merge'
import { makeEntry } from '@/test/utils/watchlistFactory'

const T1 = '2026-01-01T00:00:00.000Z'
const T2 = '2026-02-01T00:00:00.000Z'
const T3 = '2026-03-01T00:00:00.000Z'

describe('mergeWatchlists', () => {
  it('keeps an entry that only the local side has', () => {
    const local = [makeEntry({ animeId: 1 })]
    expect(mergeWatchlists(local, []).entries).toEqual(local)
  })

  it('takes over an entry that only the file has', () => {
    const incoming = [makeEntry({ animeId: 1 })]
    expect(mergeWatchlists([], incoming).entries).toEqual(incoming)
  })

  it('lets the newer updatedAt win when the file is ahead', () => {
    const local = [makeEntry({ animeId: 1, progress: 3, updatedAt: T1 })]
    const incoming = [makeEntry({ animeId: 1, progress: 7, updatedAt: T2 })]

    expect(mergeWatchlists(local, incoming).entries[0].progress).toBe(7)
  })

  it('lets the newer updatedAt win when the local side is ahead', () => {
    const local = [makeEntry({ animeId: 1, progress: 9, updatedAt: T3 })]
    const incoming = [makeEntry({ animeId: 1, progress: 2, updatedAt: T2 })]

    expect(mergeWatchlists(local, incoming).entries[0].progress).toBe(9)
  })

  it('prefers the higher progress when updatedAt is identical', () => {
    const local = [makeEntry({ animeId: 1, progress: 4, updatedAt: T2 })]
    const incoming = [makeEntry({ animeId: 1, progress: 11, updatedAt: T2 })]

    expect(mergeWatchlists(local, incoming).entries[0].progress).toBe(11)
  })

  describe('deletions', () => {
    it('applies a delete that is newer than the local change', () => {
      const local = [makeEntry({ animeId: 1, progress: 5, updatedAt: T1 })]
      const incoming = [makeEntry({ animeId: 1, updatedAt: T2, deletedAt: T2 })]

      expect(mergeWatchlists(local, incoming).entries[0].deletedAt).toBe(T2)
    })

    it('revives an entry whose local change is newer than the delete', () => {
      const local = [makeEntry({ animeId: 1, progress: 5, updatedAt: T3 })]
      const incoming = [makeEntry({ animeId: 1, updatedAt: T2, deletedAt: T2 })]

      expect(mergeWatchlists(local, incoming).entries[0].deletedAt).toBeNull()
    })

    it('keeps the tombstone in the result instead of dropping the id', () => {
      const local = [makeEntry({ animeId: 1, updatedAt: T2, deletedAt: T2 })]
      const merged = mergeWatchlists(local, [])

      expect(merged.entries).toHaveLength(1)
    })

    it('prefers the surviving entry when everything else is tied', () => {
      const local = [makeEntry({ animeId: 1, updatedAt: T2, deletedAt: T2 })]
      const incoming = [makeEntry({ animeId: 1, updatedAt: T2 })]

      expect(mergeWatchlists(local, incoming).entries[0].deletedAt).toBeNull()
    })
  })

  describe('algebraic properties', () => {
    // Ohne diese beiden Eigenschaften driften zwei Geräte bei jedem Abgleich weiter
    // auseinander, statt zu konvergieren. Das sind die wichtigsten Tests im Projekt.
    const a = [
      makeEntry({ animeId: 1, progress: 3, updatedAt: T1 }),
      makeEntry({ animeId: 2, progress: 0, updatedAt: T3, status: 'COMPLETED' }),
      makeEntry({ animeId: 4, updatedAt: T2, deletedAt: T2 }),
    ]
    const b = [
      makeEntry({ animeId: 1, progress: 8, updatedAt: T2 }),
      makeEntry({ animeId: 2, progress: 5, updatedAt: T2 }),
      makeEntry({ animeId: 3, progress: 1, updatedAt: T1 }),
      makeEntry({ animeId: 4, progress: 2, updatedAt: T1 }),
    ]

    it('is commutative', () => {
      expect(mergeWatchlists(a, b).entries).toEqual(mergeWatchlists(b, a).entries)
    })

    it('is idempotent', () => {
      const once = mergeWatchlists(a, b).entries
      expect(mergeWatchlists(once, b).entries).toEqual(once)
    })

    it('stays stable when merged with itself', () => {
      const once = mergeWatchlists(a, b).entries
      expect(mergeWatchlists(once, once).entries).toEqual(once)
    })
  })

  describe('stats', () => {
    it('counts an untouched entry as unchanged', () => {
      const entry = makeEntry({ animeId: 1 })
      expect(mergeWatchlists([entry], [entry]).stats).toEqual({
        unchanged: 1,
        updated: 0,
        added: 0,
        removed: 0,
      })
    })

    it('counts a new entry from the file as added', () => {
      const stats = mergeWatchlists([], [makeEntry({ animeId: 1 })]).stats
      expect(stats.added).toBe(1)
    })

    it('counts a changed entry as updated', () => {
      const local = [makeEntry({ animeId: 1, progress: 1, updatedAt: T1 })]
      const incoming = [makeEntry({ animeId: 1, progress: 6, updatedAt: T2 })]

      expect(mergeWatchlists(local, incoming).stats.updated).toBe(1)
    })

    it('counts an incoming delete as removed', () => {
      const local = [makeEntry({ animeId: 1, updatedAt: T1 })]
      const incoming = [makeEntry({ animeId: 1, updatedAt: T2, deletedAt: T2 })]

      expect(mergeWatchlists(local, incoming).stats.removed).toBe(1)
    })

    it('does not count an entry that was already deleted locally', () => {
      const local = [makeEntry({ animeId: 1, updatedAt: T2, deletedAt: T2 })]
      expect(mergeWatchlists(local, local).stats).toEqual({
        unchanged: 0,
        updated: 0,
        added: 0,
        removed: 0,
      })
    })
  })
})
