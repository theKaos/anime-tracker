import { OptionSelect } from '@/components/ui/OptionSelect'
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
    <OptionSelect
      ariaLabel="Watchlist sortieren"
      value={value}
      onChange={(next) => onChange(next as WatchlistSortOption)}
      options={SORT_OPTIONS}
    />
  )
}
