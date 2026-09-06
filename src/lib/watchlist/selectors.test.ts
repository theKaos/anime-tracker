import { describe, expect, it } from 'vitest'
import { activeEntries, findActiveEntry, isActive, isInWatchlist } from './selectors'
import { makeEntry } from '@/test/utils/watchlistFactory'

const alive = makeEntry({ animeId: 1 })
const buried = makeEntry({ animeId: 2, deletedAt: '2026-02-01T00:00:00.000Z' })

describe('selectors', () => {
  it('treats an entry without deletedAt as active', () => {
    expect(isActive(alive)).toBe(true)
    expect(isActive(buried)).toBe(false)
  })

  it('hides tombstones from the active list', () => {
    expect(activeEntries([alive, buried])).toEqual([alive])
  })

  it('does not find a tombstone by id', () => {
    expect(findActiveEntry([alive, buried], 1)).toEqual(alive)
    expect(findActiveEntry([alive, buried], 2)).toBeUndefined()
  })

  it('reports a deleted anime as not in the watchlist', () => {
    expect(isInWatchlist([alive, buried], 1)).toBe(true)
    expect(isInWatchlist([alive, buried], 2)).toBe(false)
  })
})
