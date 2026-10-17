import { describe, expect, it, vi } from 'vitest'
import type { WatchlistFile } from '@/types/sync'
import { APP_ID, SCHEMA_VERSION, migrate, type Migration } from './fileFormat'
import { makeEntry } from '@/test/utils/watchlistFactory'

function fileAt(schemaVersion: number): WatchlistFile {
  return {
    schemaVersion,
    exportedAt: '2026-08-01T00:00:00.000Z',
    app: APP_ID,
    entries: [makeEntry({ animeId: 1 })],
  }
}

describe('migrate', () => {
  it('leaves a current file untouched', () => {
    const file = fileAt(SCHEMA_VERSION)
    expect(migrate(file)).toEqual(file)
  })

  it('stamps the current version even when no migration exists for the gap', () => {
    expect(migrate(fileAt(0)).schemaVersion).toBe(SCHEMA_VERSION)
  })

  it('runs every step of the chain in order', () => {
    const order: number[] = []
    const step =
      (from: number): Migration =>
      (file) => {
        order.push(from)
        return { ...file, schemaVersion: from + 1 }
      }

    const result = migrate(fileAt(1), { 1: step(1), 2: step(2) }, 3)

    expect(order).toEqual([1, 2])
    expect(result.schemaVersion).toBe(3)
  })

  it('stops at a missing step instead of looping forever', () => {
    const second = vi.fn<Migration>((file) => ({ ...file, schemaVersion: 3 }))

    const result = migrate(fileAt(1), { 2: second }, 3)

    expect(second).not.toHaveBeenCalled()
    expect(result.schemaVersion).toBe(3)
  })

  it('carries the data changes of a step into the result', () => {
    const dropEntries: Migration = (file) => ({ ...file, entries: [], schemaVersion: 2 })

    expect(migrate(fileAt(1), { 1: dropEntries }, 2).entries).toEqual([])
  })
})
