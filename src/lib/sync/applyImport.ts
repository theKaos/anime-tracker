import type { WatchlistEntry } from '@/types/watchlist'
import type { MergeResult, ValidationError } from '@/types/sync'
import { fromJson } from './serialize'
import { mergeWatchlists } from './merge'
import { purgeTombstones } from './tombstones'

export type ImportOutcome =
  | { ok: true; result: MergeResult }
  | { ok: false; error: ValidationError }

/**
 * Der komplette Importvorgang als pure Funktion: Text rein, fertiger Zustand raus.
 * Bewusst ohne Store- oder DOM-Zugriff, damit der riskanteste Teil des Features
 * ohne Browser getestet werden kann — und damit Phase 4 (Datei-Automatik) exakt
 * denselben Weg nimmt wie der manuelle Import.
 */
export function applyImport(
  local: WatchlistEntry[],
  text: string,
  now: Date = new Date()
): ImportOutcome {
  const parsed = fromJson(text)
  if (!parsed.ok) return { ok: false, error: parsed.error }

  const merged = mergeWatchlists(local, parsed.file.entries)

  return {
    ok: true,
    result: { entries: purgeTombstones(merged.entries, now), stats: merged.stats },
  }
}
