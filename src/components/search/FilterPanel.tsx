import type { SearchFilters } from '@/types/filters'
import { YearFilter } from './YearFilter'
import { SeasonFilter } from './SeasonFilter'
import { FormatFilter } from './FormatFilter'
import { GenreFilter } from './GenreFilter'
import { SortSelect } from './SortSelect'
import { ActiveFilterChips } from './ActiveFilterChips'

export function FilterPanel({
  filters,
  onChange,
}: {
  filters: SearchFilters
  onChange: (filters: SearchFilters) => void
}) {
  return (
    <div className="space-y-4 rounded-panel bg-surface p-4 shadow-lift">
      <div className="flex flex-wrap gap-3">
        <YearFilter value={filters.year} onChange={(year) => onChange({ ...filters, year })} />
        <SeasonFilter value={filters.season} onChange={(season) => onChange({ ...filters, season })} />
        <FormatFilter value={filters.format} onChange={(format) => onChange({ ...filters, format })} />
        <SortSelect value={filters.sort} onChange={(sort) => onChange({ ...filters, sort })} />
      </div>
      <GenreFilter value={filters.genres} onChange={(genres) => onChange({ ...filters, genres })} />
      <ActiveFilterChips
        filters={filters}
        onRemove={(key, value) => {
          if (key === 'genres' && value) {
            onChange({ ...filters, genres: filters.genres.filter((g) => g !== value) })
          } else if (key === 'search') {
            onChange({ ...filters, search: '' })
          } else {
            onChange({ ...filters, [key]: null })
          }
        }}
      />
    </div>
  )
}
