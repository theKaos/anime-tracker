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

  return (
    <div className="flex items-center gap-2 font-mono text-ui">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange(Math.max(0, progress - 1))}
        disabled={progress <= 0}
        aria-label="Episode zurück"
      >
        −
      </Button>
      <input
        type="number"
        value={progress}
        min={0}
        max={totalEpisodes ?? undefined}
        onChange={(event) => onChange(Math.max(0, Number(event.target.value)))}
        className="w-14 rounded-card border border-border bg-surface px-2 py-1 text-center text-text"
        aria-label="Episoden-Fortschritt"
      />
      <span className="text-text-muted">/ {totalEpisodes ?? '?'}</span>
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
  )
}
