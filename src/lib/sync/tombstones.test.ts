import { describe, expect, it } from 'vitest'
import { purgeTombstones } from './tombstones'
import { makeEntry } from '@/test/utils/watchlistFactory'

const now = new Date('2026-08-25T00:00:00.000Z')

function daysAgo(days: number): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
}

describe('purgeTombstones', () => {
  it('keeps active entries regardless of age', () => {
    const old = makeEntry({ animeId: 1, updatedAt: daysAgo(9999) })
    expect(purgeTombstones([old], now)).toEqual([old])
  })

  it('keeps a fresh tombstone', () => {
    const dead = makeEntry({ animeId: 1, deletedAt: daysAgo(10) })
    expect(purgeTombstones([dead], now)).toEqual([dead])
  })

  it('drops a tombstone past the retention window', () => {
    const dead = makeEntry({ animeId: 1, deletedAt: daysAgo(91) })
    expect(purgeTombstones([dead], now)).toEqual([])
  })

  it('keeps a tombstone exactly on the boundary', () => {
    const dead = makeEntry({ animeId: 1, deletedAt: daysAgo(90) })
    expect(purgeTombstones([dead], now)).toEqual([dead])
  })

  it('honours a custom retention window', () => {
    const dead = makeEntry({ animeId: 1, deletedAt: daysAgo(10) })
    expect(purgeTombstones([dead], now, 5)).toEqual([])
  })

  it('drops a tombstone with an unreadable timestamp', () => {
    const broken = makeEntry({ animeId: 1, deletedAt: 'irgendwann' })
    expect(purgeTombstones([broken], now)).toEqual([])
  })
})
