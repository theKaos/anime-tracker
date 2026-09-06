import { OptionSelect } from '@/components/ui/OptionSelect'
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
    <OptionSelect
      ariaLabel="Format"
      placeholder="Format"
      value={value ?? ''}
      onChange={(next) => onChange((next || null) as MediaFormat | null)}
      options={FORMATS}
    />
  )
}
