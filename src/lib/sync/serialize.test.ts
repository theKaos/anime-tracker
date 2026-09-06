import { describe, expect, it } from 'vitest'
import { fromJson, toFile, toJson } from './serialize'
import { APP_ID, SCHEMA_VERSION } from './fileFormat'
import { makeEntry } from '@/test/utils/watchlistFactory'

const entry = makeEntry({ animeId: 1 })
const now = new Date('2026-08-25T18:42:11.000Z')

describe('serialize', () => {
  it('stamps app id, schema version and export time', () => {
    expect(toFile([entry], now)).toEqual({
      schemaVersion: SCHEMA_VERSION,
      exportedAt: '2026-08-25T18:42:11.000Z',
      app: APP_ID,
      entries: [entry],
    })
  })

  it('produces JSON that a human can read in a diff', () => {
    expect(toJson([entry], now)).toContain('\n  "app"')
  })

  it('survives a round trip', () => {
    const result = fromJson(toJson([entry], now))
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.file.entries).toEqual([entry])
  })

  it('exports tombstones, otherwise deletions never reach the other device', () => {
    const dead = makeEntry({ animeId: 2, deletedAt: '2026-02-01T00:00:00.000Z' })
    expect(toFile([entry, dead], now).entries).toHaveLength(2)
  })
})
