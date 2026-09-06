import { describe, expect, it } from 'vitest'
import type { WatchlistEntry } from '@/types/watchlist'
import { applyImport } from './applyImport'
import { toJson } from './serialize'
import { makeEntry } from '@/test/utils/watchlistFactory'

/**
 * Bildet den eigentlichen Zweck des Features nach: Zwei Geräte tauschen eine Datei aus
 * und müssen danach denselben Zustand haben. Der Zustand-Store ist ein Singleton und
 * kann nicht zweimal instanziiert werden — deshalb wird hier gegen die pure Schicht
 * getestet, durch die auch die UI läuft.
 */
function importInto(device: WatchlistEntry[], file: string): WatchlistEntry[] {
  const outcome = applyImport(device, file)
  if (!outcome.ok) throw new Error(outcome.error.message)
  return outcome.result.entries
}

describe('two devices exchanging a file', () => {
  it('converges after both sides have imported once', () => {
    let desktop = [makeEntry({ animeId: 1, progress: 3, updatedAt: '2026-08-01T10:00:00.000Z' })]
    let phone = [makeEntry({ animeId: 2, progress: 7, updatedAt: '2026-08-01T11:00:00.000Z' })]

    phone = importInto(phone, toJson(desktop))
    desktop = importInto(desktop, toJson(phone))

    expect(desktop).toEqual(phone)
    expect(desktop.map((entry) => entry.animeId)).toEqual([1, 2])
  })

  it('keeps the newer progress when both devices watched the same anime', () => {
    let desktop = [makeEntry({ animeId: 1, progress: 4, updatedAt: '2026-08-01T10:00:00.000Z' })]
    let phone = [makeEntry({ animeId: 1, progress: 9, updatedAt: '2026-08-02T20:00:00.000Z' })]

    desktop = importInto(desktop, toJson(phone))
    phone = importInto(phone, toJson(desktop))

    expect(desktop).toEqual(phone)
    expect(desktop[0].progress).toBe(9)
  })

  it('does not resurrect an entry the other device deleted', () => {
    const deleted = makeEntry({
      animeId: 1,
      updatedAt: '2026-08-02T09:00:00.000Z',
      deletedAt: '2026-08-02T09:00:00.000Z',
    })

    let desktop = [makeEntry({ animeId: 1, progress: 4, updatedAt: '2026-08-01T10:00:00.000Z' })]
    const phone = [deleted]

    desktop = importInto(desktop, toJson(phone))

    expect(desktop[0].deletedAt).toBe('2026-08-02T09:00:00.000Z')
  })

  it('stays stable when the same file is imported repeatedly', () => {
    const phone = [makeEntry({ animeId: 1, progress: 9, updatedAt: '2026-08-02T20:00:00.000Z' })]
    const file = toJson(phone)

    const once = importInto([makeEntry({ animeId: 1, progress: 1 })], file)
    const twice = importInto(once, file)
    const thrice = importInto(twice, file)

    expect(twice).toEqual(once)
    expect(thrice).toEqual(once)
  })
})
