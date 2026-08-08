import { cn } from '@/lib/utils/cn'
import type { WatchStatus } from '@/types/watchlist'

const TABS: { value: WatchStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Alle' },
  { value: 'WATCHING', label: 'Schaue ich' },
  { value: 'PLANNING', label: 'Geplant' },
  { value: 'COMPLETED', label: 'Abgeschlossen' },
  { value: 'PAUSED', label: 'Pausiert' },
  { value: 'DROPPED', label: 'Abgebrochen' },
]

export function WatchlistFilterTabs({
  value,
  onChange,
}: {
  value: WatchStatus | 'ALL'
  onChange: (value: WatchStatus | 'ALL') => void
}) {
  return (
    <div role="tablist" className="flex flex-wrap gap-2">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'rounded-card px-3 py-1.5 text-label font-semibold transition-colors',
            value === tab.value ? 'bg-primary text-white' : 'bg-surface text-text-muted hover:text-text'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
