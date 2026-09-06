import { describe, expect, it } from 'vitest'
import { applyImport } from './applyImport'
import { toJson } from './serialize'
import { makeEntry } from '@/test/utils/watchlistFactory'

const now = new Date('2026-08-25T00:00:00.000Z')

function daysAgo(days: number): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
}

describe('applyImport', () => {
  it('merges the file into the local list and reports what changed', () => {
    const local = [makeEntry({ animeId: 1, progress: 2, updatedAt: daysAgo(10) })]
    const incoming = [
      makeEntry({ animeId: 1, progress: 9, updatedAt: daysAgo(1) }),
      makeEntry({ animeId: 2, updatedAt: daysAgo(1) }),
    ]

    const outcome = applyImport(local, toJson(incoming), now)

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.result.entries.map((e) => e.animeId)).toEqual([1, 2])
    expect(outcome.result.entries[0].progress).toBe(9)
    expect(outcome.result.stats).toEqual({ unchanged: 0, updated: 1, added: 1, removed: 0 })
  })

  it('passes a validation error through untouched', () => {
    const outcome = applyImport([], '{not json', now)
    expect(outcome).toMatchObject({ ok: false, error: { code: 'not-json' } })
  })

  it('leaves the local list alone when the file is unreadable', () => {
    const local = [makeEntry({ animeId: 1 })]
    const outcome = applyImport(local, 'kaputt', now)

    expect(outcome.ok).toBe(false)
    expect(local).toEqual([makeEntry({ animeId: 1 })])
  })

  it('purges tombstones that outlived the retention window', () => {
    const local = [makeEntry({ animeId: 1, updatedAt: daysAgo(200), deletedAt: daysAgo(200) })]
    const outcome = applyImport(local, toJson([]), now)

    expect(outcome.ok).toBe(true)
    if (outcome.ok) expect(outcome.result.entries).toEqual([])
  })

  it('is idempotent — importing the same file twice changes nothing the second time', () => {
    const local = [makeEntry({ animeId: 1, progress: 2, updatedAt: daysAgo(10) })]
    const json = toJson([makeEntry({ animeId: 1, progress: 9, updatedAt: daysAgo(1) })])

    const first = applyImport(local, json, now)
    expect(first.ok).toBe(true)
    if (!first.ok) return

    const second = applyImport(first.result.entries, json, now)
    expect(second.ok).toBe(true)
    if (!second.ok) return

    expect(second.result.entries).toEqual(first.result.entries)
    expect(second.result.stats).toEqual({ unchanged: 1, updated: 0, added: 0, removed: 0 })
  })
})
