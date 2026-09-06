import type { WatchStatus, WatchlistEntry } from '@/types/watchlist'
import type { ParseResult, WatchlistFile } from '@/types/sync'
import { APP_ID, SCHEMA_VERSION, migrate } from './fileFormat'

const STATUSES: readonly WatchStatus[] = [
  'PLANNING',
  'WATCHING',
  'COMPLETED',
  'PAUSED',
  'DROPPED',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function parseEntry(value: unknown): WatchlistEntry | null {
  if (!isRecord(value)) return null
  const { animeId, status, progress, totalEpisodes, addedAt, updatedAt, deletedAt, snapshot } = value

  if (typeof animeId !== 'number' || !Number.isFinite(animeId)) return null
  if (typeof status !== 'string' || !STATUSES.includes(status as WatchStatus)) return null
  if (typeof progress !== 'number' || !Number.isFinite(progress) || progress < 0) return null
  if (totalEpisodes !== null && typeof totalEpisodes !== 'number') return null
  if (!isIsoDate(updatedAt)) return null
  if (deletedAt !== null && deletedAt !== undefined && !isIsoDate(deletedAt)) return null
  if (!isRecord(snapshot) || !isRecord(snapshot.title)) return null
  if (typeof snapshot.title.romaji !== 'string') return null
  if (typeof snapshot.coverImage !== 'string') return null

  return {
    animeId,
    status: status as WatchStatus,
    progress,
    totalEpisodes: typeof totalEpisodes === 'number' ? totalEpisodes : null,
    addedAt: isIsoDate(addedAt) ? addedAt : updatedAt,
    updatedAt,
    deletedAt: isIsoDate(deletedAt) ? deletedAt : null,
    snapshot: {
      title: {
        romaji: snapshot.title.romaji,
        english: typeof snapshot.title.english === 'string' ? snapshot.title.english : null,
        native: typeof snapshot.title.native === 'string' ? snapshot.title.native : '',
      },
      coverImage: snapshot.coverImage,
      format: (snapshot.format ?? null) as WatchlistEntry['snapshot']['format'],
    },
  }
}

/**
 * Prüft eine fremde Datei zur Laufzeit. Rückgabe ist bewusst ein Ergebnis-Objekt
 * statt einer Exception: Jeder Fehlerfall braucht in der UI eine eigene Erklärung.
 */
export function parseWatchlistFile(text: string): ParseResult {
  // Ein UTF-8-BOM lässt JSON.parse scheitern, obwohl der Inhalt gültig ist.
  // Windows-Editoren schreiben ihn gern mit.
  const content = text.replace(/^﻿/, '').trim()

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

  if (!isRecord(raw)) {
    return {
      ok: false,
      error: { code: 'not-an-object', message: 'Die Datei hat nicht den erwarteten Aufbau.' },
    }
  }

  if (raw.app !== APP_ID) {
    return {
      ok: false,
      error: {
        code: 'wrong-app',
        message: 'Diese Datei stammt nicht aus dem Anime Tracker.',
      },
    }
  }

  const version = raw.schemaVersion
  if (typeof version !== 'number' || version < 1) {
    return {
      ok: false,
      error: { code: 'unsupported-version', message: 'Die Versionsangabe der Datei fehlt.' },
    }
  }
  if (version > SCHEMA_VERSION) {
    return {
      ok: false,
      error: {
        code: 'unsupported-version',
        message:
          'Diese Datei stammt aus einer neueren Version der App. Aktualisiere den Anime Tracker, bevor du sie importierst.',
      },
    }
  }

  if (!Array.isArray(raw.entries)) {
    return {
      ok: false,
      error: { code: 'invalid-entries', message: 'Die Datei enthält keine Einträge.' },
    }
  }

  const entries = raw.entries.map(parseEntry).filter((entry): entry is WatchlistEntry => entry !== null)

  const file: WatchlistFile = {
    schemaVersion: version,
    exportedAt: isIsoDate(raw.exportedAt) ? raw.exportedAt : new Date(0).toISOString(),
    app: APP_ID,
    entries,
  }

  return { ok: true, file: migrate(file) }
}
