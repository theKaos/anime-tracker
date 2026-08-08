import type { Anime } from '@/types/anime'
import { formatDuration, formatScore, formatSeasonYear } from '@/lib/utils/format'

export function AnimeStats({ anime }: { anime: Anime }) {
  const stats = [
    { label: 'Episoden', value: anime.episodes ?? '—' },
    { label: 'Dauer', value: formatDuration(anime.duration) },
    { label: 'Season', value: formatSeasonYear(anime.seasonYear, anime.season) },
    { label: 'Score', value: formatScore(anime.averageScore) },
    { label: 'Status', value: anime.status ?? '—' },
  ]

  return (
    <dl className="grid grid-cols-2 gap-4 font-mono text-meta sm:grid-cols-5">
      {stats.map((stat) => (
        <div key={stat.label}>
          <dt className="uppercase text-text-muted">{stat.label}</dt>
          <dd className="text-body text-text">{stat.value}</dd>
        </div>
      ))}
    </dl>
  )
}
