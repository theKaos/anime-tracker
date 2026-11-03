import * as z from 'zod'
import { IsoDateSchema, WatchlistEntrySchema } from './watchlist'

/** Aufbau der exportierten JSON-Datei. */
export const WatchlistFileSchema = z.object({
  schemaVersion: z.number(),
  exportedAt: IsoDateSchema,
  app: z.string(),
  entries: z.array(WatchlistEntrySchema),
})
export type WatchlistFile = z.infer<typeof WatchlistFileSchema>

export const MergeStatsSchema = z.object({
  unchanged: z.number(),
  updated: z.number(),
  added: z.number(),
  removed: z.number(),
})
export type MergeStats = z.infer<typeof MergeStatsSchema>

export const MergeResultSchema = z.object({
  entries: z.array(WatchlistEntrySchema),
  stats: MergeStatsSchema,
})
export type MergeResult = z.infer<typeof MergeResultSchema>

export const ValidationErrorCodeSchema = z.enum([
  /** Datei ist 0 Byte groß oder enthält nur Leerraum — kein Fehler, nur noch nichts drin. */
  'empty',
  'not-json',
  'not-an-object',
  'wrong-app',
  'unsupported-version',
  'invalid-entries',
])
export type ValidationErrorCode = z.infer<typeof ValidationErrorCodeSchema>

export const ValidationErrorSchema = z.object({
  code: ValidationErrorCodeSchema,
  /** Für den Nutzer lesbar, nicht für Logs. */
  message: z.string(),
})
export type ValidationError = z.infer<typeof ValidationErrorSchema>

export const ParseResultSchema = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true), file: WatchlistFileSchema }),
  z.object({ ok: z.literal(false), error: ValidationErrorSchema }),
])
export type ParseResult = z.infer<typeof ParseResultSchema>

/**
 * Zustände der Sync-Anzeige. 'needs-permission', 'synced' und 'error' greifen erst
 * mit der File-System-Access-Automatik (Phase 4); bis dahin ist alles 'unsupported'
 * oder 'disconnected'.
 */
export const SyncStatusSchema = z.enum([
  'unsupported',
  'disconnected',
  'needs-permission',
  'synced',
  'error',
])
export type SyncStatus = z.infer<typeof SyncStatusSchema>
