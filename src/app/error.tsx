'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  // Ohne das steht in der Browser-Konsole nichts, womit man den Fehler in den
  // Server-Logs wiederfindet.
  useEffect(() => {
    console.error('[anime-tracker]', error)
  }, [error])

  return (
    <div className="space-y-4 py-12 text-center">
      <p className="text-ui text-text">Etwas ist schiefgelaufen beim Laden der Anime.</p>

      {error.digest && (
        <p className="font-mono text-meta text-text-muted">Fehler-ID: {error.digest}</p>
      )}

      <button
        onClick={() => {
          // reset() allein rendert nur die Boundary neu und bekommt denselben
          // gescheiterten Server-Render zurück — deshalb passierte beim Klick
          // vorher nichts. router.refresh() holt ihn tatsächlich neu.
          router.refresh()
          reset()
        }}
        className="rounded-card bg-primary px-4 py-2 text-on-accent"
      >
        Erneut versuchen
      </button>
    </div>
  )
}
