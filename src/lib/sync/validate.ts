import * as z from 'zod'
import { parseEntries } from '@/lib/watchlist/parseEntries'
import { IsoDateSchema } from '@/types/watchlist'
import type { ParseResult, WatchlistFile } from '@/types/sync'
import { APP_ID, SCHEMA_VERSION, migrate } from './fileFormat'

const FileObjectSchema = z.looseObject({})
const VersionSchema = z.number().min(1)
const EntryListSchema = z.array(z.unknown())
const ExportedAtSchema = IsoDateSchema.catch(() => new Date(0).toISOString())

/**
 * Prüft eine fremde Datei zur Laufzeit. Rückgabe ist bewusst ein Ergebnis-Objekt
 * statt einer Exception: Jeder Fehlerfall braucht in der UI eine eigene Erklärung.
 * Deshalb auch Schritt für Schritt statt eines einzigen Schemas für die ganze Datei.
 */
export function parseWatchlistFile(text: string): ParseResult {
  // Ein UTF-8-BOM lässt JSON.parse scheitern, obwohl der Inhalt gültig ist.
  // Windows-Editoren schreiben ihn gern mit.
  const content = text.replace(/^\uFEFF/, '').trim()

  if (content === '') {
    return {
      ok: false,
      error: { code: 'empty', message: 'Die Datei ist leer — es gibt nichts zu importieren.' },
    }
  }

  let raw: unknown
  try {
    raw = JSON.parse(content)
  } catch {
    return {
      ok: false,
      error: { code: 'not-json', message: 'Die Datei enthält kein gültiges JSON.' },
    }
  }

  const object = FileObjectSchema.safeParse(raw)
  if (!object.success) {
    return {
      ok: false,
      error: { code: 'not-an-object', message: 'Die Datei hat nicht den erwarteten Aufbau.' },
    }
  }

  if (object.data.app !== APP_ID) {
    return {
      ok: false,
      error: {
        code: 'wrong-app',
        message: 'Diese Datei stammt nicht aus dem Anime Tracker.',
      },
    }
  }

  const version = VersionSchema.safeParse(object.data.schemaVersion)
  if (!version.success) {
    return {
      ok: false,
      error: { code: 'unsupported-version', message: 'Die Versionsangabe der Datei fehlt.' },
    }
  }
  if (version.data > SCHEMA_VERSION) {
    return {
      ok: false,
      error: {
        code: 'unsupported-version',
        message:
          'Diese Datei stammt aus einer neueren Version der App. Aktualisiere den Anime Tracker, bevor du sie importierst.',
      },
    }
  }

  const entries = EntryListSchema.safeParse(object.data.entries)
  if (!entries.success) {
    return {
      ok: false,
      error: { code: 'invalid-entries', message: 'Die Datei enthält keine Einträge.' },
    }
  }

  const file: WatchlistFile = {
    schemaVersion: version.data,
    exportedAt: ExportedAtSchema.parse(object.data.exportedAt),
    app: APP_ID,
    entries: parseEntries(entries.data),
  }

  return { ok: true, file: migrate(file) }
}
