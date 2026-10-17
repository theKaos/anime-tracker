'use client'

import { GENRES } from '@/constants/genres'
import { cn } from '@/lib/utils/cn'

export function GenreFilter({
  value,
  onChange,
}: {
  value: string[]
  onChange: (genres: string[]) => void
}) {
  function toggle(genre: string) {
    onChange(value.includes(genre) ? value.filter((g) => g !== genre) : [...value, genre])
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Genres">
      {GENRES.map((genre) => {
        const active = value.includes(genre)
        return (
          <button
            key={genre}
            type="button"
            onClick={() => toggle(genre)}
            aria-pressed={active}
            className={cn(
              'rounded-card border px-2 py-1 text-meta font-mono uppercase tracking-wide transition-colors',
              active
                ? 'border-secondary bg-secondary text-on-accent'
                : 'border-border bg-surface text-text-muted hover:border-secondary'
            )}
          >
            {genre}
          </button>
        )
      })}
    </div>
  )
}
