import type { MediaSeason } from '@/types/anime'

const SEASON_LABELS: Record<MediaSeason, string> = {
  WINTER: 'Winter',
  SPRING: 'Spring',
  SUMMER: 'Summer',
  FALL: 'Fall',
}

export function formatSeasonYear(year: number | null, season: MediaSeason | null): string {
  if (!year && !season) return 'Unbekannt'
  if (!season) return String(year)
  return `${SEASON_LABELS[season]} ${year ?? ''}`.trim()
}

export function formatDuration(minutes: number | null): string {
  if (!minutes) return '—'
  return `${minutes} min`
}

export function formatScore(score: number | null): string {
  if (score === null) return '—'
  return (score / 10).toFixed(1)
}
