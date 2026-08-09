import { Button } from '@/components/ui/Button'

export function ProgressControl({
  progress,
  totalEpisodes,
  onChange,
}: {
  progress: number
  totalEpisodes: number | null
  onChange: (progress: number) => void
}) {
  const max = totalEpisodes ?? Infinity
  const percent = totalEpisodes ? Math.min(100, Math.round((progress / totalEpisodes) * 100)) : null

  return (
    <div className="flex items-center gap-3 font-mono text-ui">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(Math.max(0, progress - 1))}
          disabled={progress <= 0}
          aria-label="Episode zurück"
        >
          −
        </Button>
        <span aria-label="Episoden-Fortschritt" className="w-14 text-center text-text">
          {progress} <span className="text-text-muted">/ {totalEpisodes ?? '?'}</span>
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(Math.min(max, progress + 1))}
          disabled={progress >= max}
          aria-label="Episode vor"
        >
          +
        </Button>
      </div>
      {percent !== null && (
        <div
          role="progressbar"
          aria-label="Episoden-Fortschrittsbalken"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={totalEpisodes ?? undefined}
          className="h-5 w-28 overflow-hidden rounded-card bg-border"
        >
          <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${percent}%` }} />
        </div>
      )}
    </div>
  )
}
