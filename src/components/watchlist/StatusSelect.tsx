import { OptionSelect } from '@/components/ui/OptionSelect'
import type { WatchStatus } from '@/types/watchlist'

const STATUS_OPTIONS: { value: WatchStatus; label: string }[] = [
  { value: 'PLANNING', label: 'Geplant' },
  { value: 'WATCHING', label: 'Schaue ich' },
  { value: 'COMPLETED', label: 'Abgeschlossen' },
  { value: 'PAUSED', label: 'Pausiert' },
  { value: 'DROPPED', label: 'Abgebrochen' },
]

export function StatusSelect({
  value,
  onChange,
}: {
  value: WatchStatus
  onChange: (status: WatchStatus) => void
}) {
  return (
    <OptionSelect
      ariaLabel="Status"
      value={value}
      onChange={(next) => onChange(next as WatchStatus)}
      options={STATUS_OPTIONS}
    />
  )
}
