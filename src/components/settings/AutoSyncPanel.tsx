'use client'

import { useEffect, useState } from 'react'
import { useFileSync } from '@/context/FileSyncProvider'
import { Button } from '@/components/ui/Button'
import { SyncStatusBadge } from './SyncStatusBadge'
import { MergeSummaryDialog } from './MergeSummaryDialog'

export function AutoSyncPanel() {
  const sync = useFileSync()
  // Der Status wird erst im Browser ermittelt; ohne diesen Schalter würde der
  // Server eine andere Zeile rendern als der Client.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!sync || !mounted) return null

  const { state } = sync
  const supported = state.status !== 'unsupported'

  return (
    <section className="space-y-4 rounded-panel border border-border bg-surface p-6 shadow-lift">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lead font-bold text-text">Automatischer Geräteabgleich</h2>
          <SyncStatusBadge state={state} />
        </div>

        {supported ? (
          <p className="text-ui text-text-muted">
            Verbinde eine Datei in deinem Dropbox-Ordner. Die App schreibt Änderungen
            hinein und liest sie beim Öffnen wieder ein — dein anderes Gerät braucht nur
            dieselbe Datei. Hat ein Gerät die Datei schon angelegt, wähle sie auf allen
            weiteren Geräten über <strong className="text-text">Vorhandene Datei
            auswählen</strong> aus.
          </p>
        ) : (
          <p className="text-ui text-text-muted">
            Dieser Browser unterstützt den direkten Dateizugriff nicht. Nutze den Export
            und Import weiter unten — der Abgleich funktioniert genauso, nur von Hand.
          </p>
        )}
      </div>

      {supported && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            {state.status === 'disconnected' && (
              <>
                {/*
                  Zwei getrennte Wege, weil die beiden Dateidialoge des Browsers
                  Unterschiedliches tun. Der Speichern-Dialog legt an — auf Android
                  erzeugt ein Cloud-Anbieter dabei eine neue Datei mit eigenem Namen,
                  selbst wenn man eine vorhandene antippt.
                */}
                <Button onClick={() => void sync.connect('open')}>
                  Vorhandene Datei auswählen
                </Button>
                {sync.canCreate && (
                  <Button variant="ghost" onClick={() => void sync.connect('create')}>
                    Neue Datei anlegen
                  </Button>
                )}
              </>
            )}

            {state.status === 'needs-permission' && (
              <>
                <Button onClick={() => void sync.grantPermission()}>Zugriff bestätigen</Button>
                <Button variant="ghost" onClick={() => void sync.disconnect()}>
                  Andere Datei wählen
                </Button>
              </>
            )}

            {state.status === 'connected' && (
              <>
                <Button onClick={() => void sync.syncNow()} disabled={state.busy}>
                  Jetzt abgleichen
                </Button>
                <Button variant="ghost" onClick={() => void sync.disconnect()}>
                  Verbindung lösen
                </Button>
              </>
            )}
          </div>

          {state.status === 'connected' && (
            <p className="text-label text-text-muted">
              Liegt die Datei in einem Cloud-Ordner, kann dein Anbieter bei gleichzeitigen
              Änderungen eine Konfliktkopie anlegen. Diese Datei sieht die App nicht — du
              kannst sie unten von Hand importieren.
            </p>
          )}

          {state.error && (
            <p role="alert" className="text-ui text-primary">
              {state.error}
            </p>
          )}
        </>
      )}

      <MergeSummaryDialog stats={sync.mergeStats} onClose={sync.dismissMergeStats} />
    </section>
  )
}
