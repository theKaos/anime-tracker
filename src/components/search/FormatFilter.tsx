import { Select } from '@/components/ui/Select'
import { FORMATS } from '@/constants/formats'
import type { MediaFormat } from '@/types/anime'

export function FormatFilter({
  value,
  onChange,
}: {
  value: MediaFormat | null
  onChange: (format: MediaFormat | null) => void
}) {
  return (
    <Select
      aria-label="Format"
      value={value ?? ''}
      onChange={(event) => onChange((event.target.value || null) as MediaFormat | null)}
    >
      <option value="">Format</option>
      {FORMATS.map((format) => (
        <option key={format.value} value={format.value}>
          {format.label}
        </option>
      ))}
    </Select>
  )
}
