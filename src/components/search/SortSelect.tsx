import { Select } from '@/components/ui/Select'
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
    <Select aria-label="Sortierung" value={value} onChange={(event) => onChange(event.target.value as SortOption)}>
      {SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  )
}
