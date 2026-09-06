import { OptionSelect } from '@/components/ui/OptionSelect'

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 50 }, (_, i) => {
  const year = CURRENT_YEAR + 1 - i
  return { value: String(year), label: String(year) }
})

export function YearFilter({
  value,
  onChange,
}: {
  value: number | null
  onChange: (year: number | null) => void
}) {
  return (
    <OptionSelect
      ariaLabel="Erscheinungsjahr"
      placeholder="Jahr"
      value={value ? String(value) : ''}
      onChange={(next) => onChange(next ? Number(next) : null)}
      options={YEAR_OPTIONS}
    />
  )
}
