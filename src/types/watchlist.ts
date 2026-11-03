import * as z from 'zod'
import { AnimeSchema, MediaFormatOrNullSchema } from './anime'

export const WatchStatusSchema = z.enum(['PLANNING', 'WATCHING', 'COMPLETED', 'PAUSED', 'DROPPED'])
export type WatchStatus = z.infer<typeof WatchStatusSchema>

/** Bewusst nur "von Date.parse lesbar" statt streng ISO: Bestehende Dateien dürfen nicht ungültig werden. */
export const IsoDateSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)))

export const WatchlistEntrySchema = z.object({
  animeId: z.number(),
  status: WatchStatusSchema,
  progress: z.number().min(0),
  totalEpisodes: z.number().nullable(),
  addedAt: IsoDateSchema,
  /** Grundlage für Last-Write-Wins beim Geräteabgleich. */
  updatedAt: IsoDateSchema,
  /**
   * Grabstein. Gelöschte Einträge werden markiert statt entfernt — sonst kann ein
   * anderes Gerät "gelöscht" nicht von "kennt es noch nicht" unterscheiden und
   * bringt den Eintrag beim nächsten Abgleich zurück.
   */
  deletedAt: IsoDateSchema.nullable(),
  snapshot: AnimeSchema.pick({ title: true, coverImage: true, format: true }),
})
export type WatchlistEntry = z.infer<typeof WatchlistEntrySchema>

/**
 * Eintrag aus einer Datei oder dem localStorage. Entscheidende Felder müssen stimmen,
 * der Rest wird ergänzt: Einträge aus einer älteren Version haben kein `deletedAt`, und
 * eine bestehende Watchlist darf beim Update nicht verloren gehen.
 */
export const StoredEntrySchema = WatchlistEntrySchema.extend({
  addedAt: IsoDateSchema.optional().catch(undefined),
  deletedAt: IsoDateSchema.nullable().default(null),
  snapshot: z.object({
    title: z.object({
      romaji: z.string(),
      english: z.string().nullable().catch(null),
      native: z.string().catch(''),
    }),
    coverImage: z.string(),
    format: MediaFormatOrNullSchema,
  }),
}).transform((entry) => ({ ...entry, addedAt: entry.addedAt ?? entry.updatedAt }))
