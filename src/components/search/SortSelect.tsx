import { OptionSelect } from '@/components/ui/OptionSelect'
import type { SortOption } from '@/types/filters'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'TRENDING_DESC', label: 'Trending' },
  { value: 'POPULARITY_DESC', label: 'Popularität' },
  { value: 'SCORE_DESC', label: 'Score' },
  { value: 'START_DATE_DESC', label: 'Neueste' },
]

export function SortSelect({
  value,
  onChange,
}: {
  value: SortOption
  onChange: (sort: SortOption) => void
}) {
  return (
    <OptionSelect
      ariaLabel="Sortierung"
      value={value}
      onChange={(next) => onChange(next as SortOption)}
      options={SORT_OPTIONS}
    />
  )
}
