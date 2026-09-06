'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { SyncPort } from '@/lib/sync/syncPort'
import { useFileSyncController, type FileSyncApi } from '@/hooks/useFileSyncController'
import { useSyncTriggers } from '@/hooks/useSyncTriggers'

const FileSyncContext = createContext<FileSyncApi | null>(null)

/**
 * Liegt im Root-Layout, damit es genau einen Controller für die ganze App gibt.
 * `port` wird nur in Tests gesetzt — jsdom kennt keine File System Access API.
 */
export function FileSyncProvider({ children, port }: { children: ReactNode; port?: SyncPort }) {
  const api = useFileSyncController(port)

  useSyncTriggers(api.syncNow, api.state.status === 'connected')

  return <FileSyncContext.Provider value={api}>{children}</FileSyncContext.Provider>
}

/**
 * Gibt `null` zurück, wenn kein Provider darüber liegt. Absicht: Die
 * Einstellungsseite soll ihren manuellen Teil auch dann anzeigen, wenn die
 * Automatik nicht eingerichtet ist.
 */
export function useFileSync(): FileSyncApi | null {
  return useContext(FileSyncContext)
}
