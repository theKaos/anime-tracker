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
    // Umbruchfähig: Auf schmalen Geräten rutscht der Balken unter die Zählung,
    // statt die Zeile über die Kachelbreite hinauszuschieben.
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-ui">
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
        {/*
          Breit genug für zweistellig/zweistellig ("10 / 12"). Mit w-14 lief der
          Text über und hat die Mindestbreite der ganzen Zeile hochgetrieben.
        */}
        <span
          aria-label="Episoden-Fortschritt"
          className="min-w-[4.5rem] text-center tabular-nums whitespace-nowrap text-text"
        >
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
          className="h-5 w-full overflow-hidden rounded-card bg-border sm:w-28"
        >
          <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${percent}%` }} />
        </div>
      )}
    </div>
  )
}
