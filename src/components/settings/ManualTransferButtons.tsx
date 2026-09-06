'use client'

import { useRef, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/Button'

/**
 * Rein präsentativ: kennt weder Store noch Merge. Damit bleibt der Ablauf an einer
 * Stelle (FileSyncPanel) und diese Komponente ohne Aufbau testbar.
 */
export function ManualTransferButtons({
  onExport,
  onFileSelected,
  exportDisabled,
}: {
  onExport: () => void
  onFileSelected: (file: File) => void
  exportDisabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) onFileSelected(file)
    // Zurücksetzen, damit dieselbe Datei direkt noch einmal gewählt werden kann.
    event.target.value = ''
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={onExport} disabled={exportDisabled}>
        Watchlist exportieren
      </Button>

      <Button variant="ghost" onClick={() => inputRef.current?.click()}>
        Datei importieren
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        aria-label="Watchlist-Datei auswählen"
        className="sr-only"
        onChange={handleChange}
      />
    </div>
  )
}
