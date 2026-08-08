import { Select } from '@/components/ui/Select'
import { SEASONS } from '@/constants/seasons'
import type { MediaSeason } from '@/types/anime'

export function SeasonFilter({
  value,
  onChange,
}: {
  value: MediaSeason | null
  onChange: (season: MediaSeason | null) => void
}) {
  return (
    <Select
      aria-label="Season"
      value={value ?? ''}
      onChange={(event) => onChange((event.target.value || null) as MediaSeason | null)}
    >
      <option value="">Season</option>
      {SEASONS.map((season) => (
        <option key={season.value} value={season.value}>
          {season.label}
        </option>
      ))}
    </Select>
  )
}
