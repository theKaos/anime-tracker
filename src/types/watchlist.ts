import type { Anime } from './anime'

export type WatchStatus = 'PLANNING' | 'WATCHING' | 'COMPLETED' | 'PAUSED' | 'DROPPED'

export interface WatchlistEntry {
  animeId: number
  status: WatchStatus
  progress: number
  totalEpisodes: number | null
  addedAt: string
  /** Grundlage für Last-Write-Wins beim Geräteabgleich. */
  updatedAt: string
  /**
   * Grabstein. Gelöschte Einträge werden markiert statt entfernt — sonst kann ein
   * anderes Gerät "gelöscht" nicht von "kennt es noch nicht" unterscheiden und
   * bringt den Eintrag beim nächsten Abgleich zurück.
   */
  deletedAt: string | null
  snapshot: Pick<Anime, 'title' | 'coverImage' | 'format'>
}
