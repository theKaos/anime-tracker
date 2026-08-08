import type { Anime } from './anime'

export type WatchStatus = 'PLANNING' | 'WATCHING' | 'COMPLETED' | 'PAUSED' | 'DROPPED'

export interface WatchlistEntry {
  animeId: number
  status: WatchStatus
  progress: number
  totalEpisodes: number | null
  addedAt: string
  updatedAt: string
  snapshot: Pick<Anime, 'title' | 'coverImage' | 'format'>
}
