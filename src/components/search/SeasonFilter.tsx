import { OptionSelect } from '@/components/ui/OptionSelect'
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
    <OptionSelect
      ariaLabel="Season"
      placeholder="Season"
      value={value ?? ''}
      onChange={(next) => onChange((next || null) as MediaSeason | null)}
      options={SEASONS}
    />
  )
}
