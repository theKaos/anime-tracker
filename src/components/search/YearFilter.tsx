import { Select } from '@/components/ui/Select'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 50 }, (_, i) => CURRENT_YEAR + 1 - i)

export function YearFilter({
  value,
  onChange,
}: {
  value: number | null
  onChange: (year: number | null) => void
}) {
  return (
    <Select
      aria-label="Erscheinungsjahr"
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
    >
      <option value="">Jahr</option>
      {YEARS.map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </Select>
  )
}
