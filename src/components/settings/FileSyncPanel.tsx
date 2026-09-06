'use client'

import { useEffect, useState } from 'react'
import type { MergeStats } from '@/types/sync'
import { useWatchlistStore } from '@/store/watchlistStore'
import { activeEntries } from '@/lib/watchlist/selectors'
import { toJson } from '@/lib/sync/serialize'
import { applyImport } from '@/lib/sync/applyImport'
import { downloadTextFile, readFileAsText } from '@/lib/sync/download'
import { WATCHLIST_FILE_NAME } from '@/constants/config'
import { ManualTransferButtons } from './ManualTransferButtons'
import { MergeSummaryDialog } from './MergeSummaryDialog'

export function FileSyncPanel() {
  const entries = useWatchlistStore((state) => state.entries)
  const replaceAll = useWatchlistStore((state) => state.replaceAll)

  const [stats, setStats] = useState<MergeStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Der Store hydratisiert erst im Browser. Ohne diesen Schalter würde der
  // Server eine andere Zahl rendern als der Client.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  function handleExport() {
    setError(null)
    downloadTextFile(WATCHLIST_FILE_NAME, toJson(entries))
  }

  async function handleFileSelected(file: File) {
    setError(null)

    let text: string
    try {
      text = await readFileAsText(file)
    } catch {
      setError('Die Datei konnte nicht gelesen werden.')
      return
    }

    const outcome = applyImport(entries, text)
    if (!outcome.ok) {
      setError(outcome.error.message)
      return
    }

    replaceAll(outcome.result.entries)
    setStats(outcome.result.stats)
  }

  return (
    <section className="space-y-4 rounded-panel border border-border bg-surface p-6 shadow-lift">
      <div className="space-y-2">
        <h2 className="text-lead font-bold text-text">Watchlist sichern und übertragen</h2>
        <p className="text-ui text-text-muted">
          Der Export schreibt deine komplette Watchlist in eine JSON-Datei. Legst du sie in
          einen Cloud-Ordner wie Dropbox, kannst du sie auf einem anderen Gerät wieder
          importieren.
        </p>
        <p className="text-label text-text-muted">
          Der Import <strong className="text-text">ersetzt nichts</strong>, sondern führt
          zusammen: Bei jedem Anime gewinnt die zuletzt geänderte Version. Du kannst also auf
          beiden Geräten weiterschauen, ohne Fortschritt zu verlieren.
        </p>
      </div>

      <ManualTransferButtons
        onExport={handleExport}
        onFileSelected={handleFileSelected}
        exportDisabled={!mounted}
      />

      {mounted && (
        <p className="font-mono text-meta uppercase tracking-wide text-text-muted">
          {activeEntries(entries).length} Einträge in der Watchlist
        </p>
      )}

      {error && (
        <p role="alert" className="text-ui text-primary">
          {error}
        </p>
      )}

      <MergeSummaryDialog stats={stats} onClose={() => setStats(null)} />
    </section>
  )
}
