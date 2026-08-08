import { Select } from '@/components/ui/Select'
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
    <Select aria-label="Status" value={value} onChange={(event) => onChange(event.target.value as WatchStatus)}>
      {STATUS_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  )
}
