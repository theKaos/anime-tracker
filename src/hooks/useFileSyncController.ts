'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MergeStats } from '@/types/sync'
import type { SyncPort } from '@/lib/sync/syncPort'
import type { SyncController, SyncState } from '@/lib/sync/syncController'
import { createSyncController } from '@/lib/sync/syncController'
import { createFsaPort } from '@/lib/sync/fsaAdapter'
import { useWatchlistStore } from '@/store/watchlistStore'

export interface FileSyncApi {
  state: SyncState
  /** Ergebnis des letzten automatischen Abgleichs, bis es bestätigt wurde. */
  mergeStats: MergeStats | null
  dismissMergeStats: () => void
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  grantPermission: () => Promise<void>
  syncNow: () => Promise<void>
}

const IDLE: SyncState = {
  status: 'disconnected',
  lastSyncedAt: null,
  error: null,
  busy: false,
}

/**
 * Erzeugt genau einen Controller und hängt ihn an den Watchlist-Store. Genau einen,
 * weil zwei parallel laufende Controller dieselbe Datei gegeneinander schreiben würden
 * — deshalb wird dieser Hook nur vom FileSyncProvider benutzt, nicht von Komponenten.
 */
export function useFileSyncController(portOverride?: SyncPort): FileSyncApi {
  const [state, setState] = useState<SyncState>(IDLE)
  const [mergeStats, setMergeStats] = useState<MergeStats | null>(null)
  const controllerRef = useRef<SyncController | null>(null)

  // Ohne Memo baut jeder Render einen neuen Port und der Effekt läuft endlos.
  const port = useMemo(() => portOverride ?? createFsaPort(), [portOverride])

  useEffect(() => {
    const controller = createSyncController({
      port,
      getEntries: () => useWatchlistStore.getState().entries,
      setEntries: (entries) => useWatchlistStore.getState().replaceAll(entries),
      onState: setState,
      onMerged: setMergeStats,
    })

    controllerRef.current = controller
    setState(controller.getState())

    let cancelled = false
    void controller.refreshStatus().then(() => {
      // Beim Start nur abgleichen, wenn die Berechtigung noch steht. Bei
      // 'needs-permission' zeigt die UI einen Button — ein automatischer
      // Request ohne Nutzergeste würde scheitern.
      if (!cancelled && controller.getState().status === 'connected') void controller.syncNow()
    })

    const unsubscribe = useWatchlistStore.subscribe((next, previous) => {
      if (next.entries !== previous.entries) controller.scheduleSync()
    })

    return () => {
      cancelled = true
      unsubscribe()
      controller.dispose()
      controllerRef.current = null
    }
  }, [port])

  const connect = useCallback(async () => {
    await controllerRef.current?.connect()
  }, [])

  const disconnect = useCallback(async () => {
    await controllerRef.current?.disconnect()
  }, [])

  const grantPermission = useCallback(async () => {
    await controllerRef.current?.grantPermission()
  }, [])

  const syncNow = useCallback(async () => {
    await controllerRef.current?.syncNow()
  }, [])

  const dismissMergeStats = useCallback(() => setMergeStats(null), [])

  return { state, mergeStats, dismissMergeStats, connect, disconnect, grantPermission, syncNow }
}
