'use client'

import type { MergeStats } from '@/types/sync'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'

const LABELS: Array<{ key: keyof MergeStats; label: string }> = [
  { key: 'unchanged', label: 'unverändert' },
  { key: 'updated', label: 'aktualisiert' },
  { key: 'added', label: 'neu' },
  { key: 'removed', label: 'entfernt' },
]

/**
 * Zeigt nach jedem Import, was sich tatsächlich geändert hat. Eine reine
 * Erfolgsmeldung würde verschweigen, ob gerade etwas verschwunden ist.
 */
export function MergeSummaryDialog({
  stats,
  onClose,
}: {
  stats: MergeStats | null
  onClose: () => void
}) {
  return (
    <Dialog open={stats !== null} title="Import abgeschlossen" onClose={onClose}>
      {stats && (
        <>
          <dl className="grid grid-cols-2 gap-3">
            {LABELS.map(({ key, label }) => (
              <div
                key={key}
                className="rounded-card border border-border px-3 py-2"
                data-testid={`merge-stat-${key}`}
              >
                <dt className="font-mono text-meta uppercase tracking-wide text-text-muted">
                  {label}
                </dt>
                <dd className="text-lead font-bold text-text">{stats[key]}</dd>
              </div>
            ))}
          </dl>

          {stats.removed > 0 && (
            <p className="mt-4 text-label text-text-muted">
              Entfernte Einträge waren auf dem anderen Gerät gelöscht worden. Wenn das
              ungewollt war, füge sie einfach wieder hinzu.
            </p>
          )}

          <Button className="mt-6 w-full" onClick={onClose}>
            Schließen
          </Button>
        </>
      )}
    </Dialog>
  )
}
