import { describe, expect, it } from 'vitest'
import { parseWatchlistFile } from './validate'
import { toJson } from './serialize'
import { APP_ID, SCHEMA_VERSION } from './fileFormat'
import { makeEntry } from '@/test/utils/watchlistFactory'

const entry = makeEntry({ animeId: 1 })

function fileWith(overrides: Record<string, unknown>): string {
  return JSON.stringify({
    schemaVersion: SCHEMA_VERSION,
    exportedAt: '2026-08-01T00:00:00.000Z',
    app: APP_ID,
    entries: [entry],
    ...overrides,
  })
}

describe('parseWatchlistFile', () => {
  it('accepts a file produced by the exporter', () => {
    const result = parseWatchlistFile(toJson([entry]))
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.file.entries).toEqual([entry])
  })

  it('rejects text that is not JSON', () => {
    const result = parseWatchlistFile('{not json')
    expect(result).toMatchObject({ ok: false, error: { code: 'not-json' } })
  })

  it('rejects a JSON array', () => {
    expect(parseWatchlistFile('[]')).toMatchObject({ ok: false, error: { code: 'not-an-object' } })
  })

  it('rejects a file from another application', () => {
    const result = parseWatchlistFile(fileWith({ app: 'something-else' }))
    expect(result).toMatchObject({ ok: false, error: { code: 'wrong-app' } })
  })

  it('rejects a file from a newer app version', () => {
    const result = parseWatchlistFile(fileWith({ schemaVersion: SCHEMA_VERSION + 1 }))
    expect(result).toMatchObject({ ok: false, error: { code: 'unsupported-version' } })
  })

  it('rejects a missing version', () => {
    const result = parseWatchlistFile(fileWith({ schemaVersion: undefined }))
    expect(result).toMatchObject({ ok: false, error: { code: 'unsupported-version' } })
  })

  it('rejects a file without an entries array', () => {
    const result = parseWatchlistFile(fileWith({ entries: 'nope' }))
    expect(result).toMatchObject({ ok: false, error: { code: 'invalid-entries' } })
  })

  it('drops individual entries that are malformed instead of failing the import', () => {
    const result = parseWatchlistFile(
      fileWith({ entries: [entry, { animeId: 'not a number' }, { status: 'PLANNING' }] })
    )

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.file.entries).toEqual([entry])
  })

  it('fills in deletedAt for entries written by an older version', () => {
    const legacy = { ...entry } as Partial<typeof entry>
    delete legacy.deletedAt
    const result = parseWatchlistFile(fileWith({ entries: [legacy] }))

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.file.entries[0].deletedAt).toBeNull()
  })

  it('keeps a tombstone from the file', () => {
    const dead = makeEntry({ animeId: 2, deletedAt: '2026-02-01T00:00:00.000Z' })
    const result = parseWatchlistFile(fileWith({ entries: [dead] }))

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.file.entries[0].deletedAt).toBe('2026-02-01T00:00:00.000Z')
  })
})

describe('parseWatchlistFile — Sonderfälle aus dem echten Betrieb', () => {
  it('reports an empty file as empty, not as broken JSON', () => {
    // Eine über showSaveFilePicker neu angelegte Datei ist 0 Byte groß.
    expect(parseWatchlistFile('')).toMatchObject({ ok: false, error: { code: 'empty' } })
  })

  it('treats a whitespace-only file as empty too', () => {
    expect(parseWatchlistFile('\n\r\n  \t')).toMatchObject({ ok: false, error: { code: 'empty' } })
  })

  it('survives a UTF-8 byte order mark', () => {
    // Windows-Editoren schreiben JSON gern mit BOM; JSON.parse wirft darüber.
    const result = parseWatchlistFile('﻿' + toJson([entry]))

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.file.entries).toEqual([entry])
  })
})
