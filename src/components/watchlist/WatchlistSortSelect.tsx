import { Select } from '@/components/ui/Select'
import type { WatchlistSortOption } from '@/lib/watchlist/sort'

const SORT_OPTIONS: { value: WatchlistSortOption; label: string }[] = [
  { value: 'TITLE_ASC', label: 'Titel (A–Z)' },
  { value: 'PROGRESS_DESC', label: 'Fortschritt (meiste zuerst)' },
  { value: 'PROGRESS_ASC', label: 'Fortschritt (wenigste zuerst)' },
]

export function WatchlistSortSelect({
  value,
  onChange,
}: {
  value: WatchlistSortOption
  onChange: (sort: WatchlistSortOption) => void
}) {
  return (
    <Select
      aria-label="Watchlist sortieren"
      value={value}
      onChange={(event) => onChange(event.target.value as WatchlistSortOption)}
    >
      {SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  )
}
