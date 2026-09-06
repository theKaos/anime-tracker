import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { SyncState } from '@/lib/sync/syncController'
import { SyncStatusBadge } from './SyncStatusBadge'

function state(overrides: Partial<SyncState> = {}): SyncState {
  return { status: 'disconnected', lastSyncedAt: null, error: null, busy: false, ...overrides }
}

describe('SyncStatusBadge', () => {
  it('says so when the browser cannot do it', () => {
    render(<SyncStatusBadge state={state({ status: 'unsupported' })} />)
    expect(screen.getByRole('status')).toHaveTextContent('in diesem Browser nicht verfügbar')
  })

  it('shows that no file is connected', () => {
    render(<SyncStatusBadge state={state()} />)
    expect(screen.getByRole('status')).toHaveTextContent('keine Datei verbunden')
  })

  it('asks for confirmation when the permission expired', () => {
    render(<SyncStatusBadge state={state({ status: 'needs-permission' })} />)
    expect(screen.getByRole('status')).toHaveTextContent('Zugriff bestätigen')
  })

  it('shows how long ago the last sync was', () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60_000).toISOString()
    render(<SyncStatusBadge state={state({ status: 'connected', lastSyncedAt: tenMinutesAgo })} />)

    expect(screen.getByRole('status')).toHaveTextContent('abgeglichen vor 10 Minuten')
  })

  it('does not promise a sync time before the first one happened', () => {
    render(<SyncStatusBadge state={state({ status: 'connected' })} />)
    expect(screen.getByRole('status')).toHaveTextContent('verbunden')
  })

  it('lets an error outrank everything else', () => {
    render(<SyncStatusBadge state={state({ status: 'connected', error: 'kaputt', busy: true })} />)
    expect(screen.getByRole('status')).toHaveTextContent('Fehler beim Abgleich')
  })

  it('shows the running sync while it lasts', () => {
    render(<SyncStatusBadge state={state({ status: 'connected', busy: true })} />)
    expect(screen.getByRole('status')).toHaveTextContent('wird abgeglichen')
  })
})
