import type { AnimeTitle, MediaSeason } from '@/types/anime'
import { SEASONS } from '@/constants/seasons'

const SEASON_LABELS: Record<MediaSeason, string> = Object.fromEntries(
  SEASONS.map((season) => [season.value, season.label])
) as Record<MediaSeason, string>

export function formatSeasonYear(year: number | null, season: MediaSeason | null): string {
  if (!year && !season) return 'Unbekannt'
  if (!season) return String(year)
  return `${SEASON_LABELS[season]} ${year ?? ''}`.trim()
}

export function displayTitle(title: AnimeTitle): string {
  return title.english ?? title.romaji
}

export function formatDuration(minutes: number | null): string {
  if (!minutes) return '—'
  return `${minutes} min`
}

export function formatScore(score: number | null): string {
  if (score === null) return '—'
  return (score / 10).toFixed(1)
}

/**
 * Grob genug für "zuletzt abgeglichen vor 3 Minuten". Bewusst ohne Sekunden:
 * Der Cloud-Client braucht ohnehin Sekunden bis Minuten, eine genauere Angabe
 * würde eine Präzision vortäuschen, die es nicht gibt.
 */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const timestamp = Date.parse(iso)
  if (Number.isNaN(timestamp)) return 'unbekannt'

  const minutes = Math.floor((now.getTime() - timestamp) / 60_000)
  if (minutes < 1) return 'gerade eben'
  if (minutes === 1) return 'vor 1 Minute'
  if (minutes < 60) return `vor ${minutes} Minuten`

  const hours = Math.floor(minutes / 60)
  if (hours === 1) return 'vor 1 Stunde'
  if (hours < 24) return `vor ${hours} Stunden`

  const days = Math.floor(hours / 24)
  return days === 1 ? 'vor 1 Tag' : `vor ${days} Tagen`
}
