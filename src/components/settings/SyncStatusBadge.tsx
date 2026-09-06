'use client'

import type { PortStatus } from '@/lib/sync/syncPort'
import type { SyncState } from '@/lib/sync/syncController'
import { formatRelativeTime } from '@/lib/utils/format'

const DOT: Record<PortStatus, string> = {
  unsupported: 'bg-text-muted',
  disconnected: 'bg-text-muted',
  'needs-permission': 'bg-primary',
  connected: 'bg-secondary',
}

function label(state: SyncState): string {
  if (state.error) return 'Fehler beim Abgleich'
  if (state.busy) return 'wird abgeglichen …'

  switch (state.status) {
    case 'unsupported':
      return 'in diesem Browser nicht verfügbar'
    case 'disconnected':
      return 'keine Datei verbunden'
    case 'needs-permission':
      return 'Zugriff bestätigen'
    case 'connected':
      return state.lastSyncedAt
        ? `abgeglichen ${formatRelativeTime(state.lastSyncedAt)}`
        : 'verbunden'
  }
}

export function SyncStatusBadge({ state }: { state: SyncState }) {
  return (
    <span
      role="status"
      className="inline-flex items-center gap-2 font-mono text-meta uppercase tracking-wide text-text-muted"
    >
      <span
        aria-hidden
        className={`size-2 rounded-full ${state.error ? 'bg-primary' : DOT[state.status]}`}
      />
      {label(state)}
    </span>
  )
}
