import type { SearchFilters } from '@/types/filters'
import type { FilterKey } from '@/lib/utils/searchParams'
import { Badge } from '@/components/ui/Badge'

export function ActiveFilterChips({
  filters,
  onRemove,
}: {
  filters: SearchFilters
  onRemove: (key: FilterKey, value?: string) => void
}) {
  const chips: { key: FilterKey; label: string; value?: string }[] = []

  if (filters.search) chips.push({ key: 'search', label: `"${filters.search}"` })
  if (filters.year) chips.push({ key: 'year', label: String(filters.year) })
  if (filters.season) chips.push({ key: 'season', label: filters.season })
  if (filters.format) chips.push({ key: 'format', label: filters.format })
  filters.genres.forEach((genre) => chips.push({ key: 'genres', label: genre, value: genre }))

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip, index) => (
        <button key={`${chip.key}-${index}`} type="button" onClick={() => onRemove(chip.key, chip.value)}>
          <Badge variant="neutral" className="cursor-pointer">
            {chip.label} ✕
          </Badge>
        </button>
      ))}
    </div>
  )
}
