'use client'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-4 py-12 text-center">
      <p className="text-ui text-text">Dieser Anime konnte nicht geladen werden.</p>
      <button onClick={reset} className="rounded-card bg-primary px-4 py-2 text-white">
        Erneut versuchen
      </button>
    </div>
  )
}
