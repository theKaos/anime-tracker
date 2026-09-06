'use client'

import { useFileSync } from '@/context/FileSyncProvider'
import { Button } from '@/components/ui/Button'

/**
 * Das Datei-Handle überlebt den Browser-Neustart, die Berechtigung nicht. Beim
 * nächsten Start steht der Status also auf 'needs-permission' — und ein
 * automatischer `requestPermission()` würde ohne Nutzergeste scheitern. Deshalb
 * dieser Banner: Er ist der einzige Weg zurück in den Automatikmodus.
 */
export function ReconnectBanner() {
  const sync = useFileSync()

  if (!sync || sync.state.status !== 'needs-permission') return null

  return (
    <div className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-[34px] py-3">
        <p className="text-ui text-text">
          Der Zugriff auf deine Watchlist-Datei muss nach einem Browser-Neustart erneut
          bestätigt werden.
        </p>
        <Button size="sm" onClick={() => void sync.grantPermission()}>
          Datei wieder verbinden
        </Button>
      </div>
    </div>
  )
}
