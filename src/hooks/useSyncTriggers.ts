'use client'

import { useEffect } from 'react'

/**
 * Es gibt keine Datei-Watch-API — Änderungen des anderen Geräts bemerkt die App nur,
 * wenn sie nachschaut. Diese beiden Momente decken den Alltag ab: Tab wird wieder
 * sichtbar, Fenster bekommt den Fokus zurück.
 */
export function useSyncTriggers(onTrigger: () => void, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') onTrigger()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', onTrigger)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', onTrigger)
    }
  }, [onTrigger, enabled])
}
