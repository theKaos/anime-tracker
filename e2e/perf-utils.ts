import type { Page, TestInfo } from '@playwright/test'

/**
 * Ein Mittelklasse-Handy statt des Entwicklerrechners. Ohne Drosselung misst man
 * lokal fast immer Bestwerte, und ein Budget, das nie reißt, schützt vor nichts.
 */
export const THROTTLING = {
  /** Viermal langsamere CPU, die übliche Lighthouse-Annahme für "Mobile". */
  cpuRate: 4,
  /** Ungefähr "Fast 4G". */
  network: { latency: 40, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (1.5 * 1024 * 1024) / 8 },
}

/**
 * Wie oft jede Messung läuft. Geprüft wird der Median: Einzelwerte schwanken mit
 * der Last auf dem Rechner um mehr als das Doppelte.
 */
export const RUNS = 5

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

/** Median je Kennzahl über mehrere Messläufe. */
export function medianVitals(runs: PageVitals[]): PageVitals {
  const keys = Object.keys(runs[0]) as Array<keyof PageVitals>
  return Object.fromEntries(
    keys.map((key) => [key, median(runs.map((run) => run[key]))])
  ) as unknown as PageVitals
}

export async function throttle(page: Page): Promise<void> {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLING.cpuRate })
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', { offline: false, ...THROTTLING.network })
  // Jeder Messlauf soll ein Erstbesuch sein, nicht ein Besuch mit warmem Cache.
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
}

export interface PageVitals {
  /** Time to First Byte: Wie schnell antwortet der Next.js-Server? */
  ttfb: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  /** Summe aller Anteile über 50 ms in langen Tasks — der Labor-Stellvertreter für INP. */
  totalBlockingTime: number
  /** Komprimiert übertragenes JavaScript in KB. */
  scriptKb: number
  requestCount: number
}

declare global {
  interface Window {
    __perf: { lcp: number; cls: number; longTasks: Array<{ start: number; duration: number }> }
  }
}

/**
 * Hängt die PerformanceObserver vor dem ersten Skript der Seite ein. `buffered`
 * holt auch Einträge, die vor dem Beobachten entstanden sind.
 */
export async function observeVitals(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.__perf = { lcp: 0, cls: 0, longTasks: [] }
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__perf.lcp = entry.startTime
    }).observe({ type: 'largest-contentful-paint', buffered: true })
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) {
        // Verschiebungen direkt nach einer Eingabe zählen laut Definition nicht.
        if (!entry.hadRecentInput) window.__perf.cls += entry.value
      }
    }).observe({ type: 'layout-shift', buffered: true })
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__perf.longTasks.push({ start: entry.startTime, duration: entry.duration })
      }
    }).observe({ type: 'longtask', buffered: true })
  })
}

/** Liest die Messwerte, nachdem die Seite zur Ruhe gekommen ist. */
export async function collectVitals(page: Page): Promise<PageVitals> {
  await page.waitForLoadState('networkidle')
  // LCP und lange Tasks nach dem Laden noch einsammeln lassen.
  await page.waitForTimeout(500)

  return page.evaluate(() => {
    const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    const scripts = resources.filter((entry) => entry.initiatorType === 'script')
    const blocking = window.__perf.longTasks
      .filter((task) => task.start >= fcp)
      .reduce((sum, task) => sum + Math.max(0, task.duration - 50), 0)

    return {
      ttfb: Math.round(navigation.responseStart - navigation.startTime),
      firstContentfulPaint: Math.round(fcp),
      largestContentfulPaint: Math.round(window.__perf.lcp),
      cumulativeLayoutShift: Number(window.__perf.cls.toFixed(4)),
      totalBlockingTime: Math.round(blocking),
      scriptKb: Math.round(scripts.reduce((sum, entry) => sum + entry.encodedBodySize, 0) / 1024),
      requestCount: resources.length + 1,
    }
  })
}

/**
 * Schreibt die Messwerte in den Report: als Annotation (im HTML-Report sichtbar)
 * und als JSON-Anhang, damit man Verläufe zwischen Läufen vergleichen kann.
 */
export async function report(
  testInfo: TestInfo,
  name: string,
  metrics: object,
  runs?: object[]
): Promise<void> {
  const line = Object.entries(metrics)
    .map(([key, value]) => `${key}=${value}`)
    .join(' ')
  testInfo.annotations.push({ type: 'perf', description: `${name}: ${line}` })
  await testInfo.attach(`${name}.json`, {
    body: JSON.stringify({ median: metrics, runs }, null, 2),
    contentType: 'application/json',
  })
  console.log(`[perf] ${name}: ${line}`)
}

/** Misst, wie lange eine Aktion braucht, bis ihr sichtbares Ergebnis da ist. */
export async function timed(action: () => Promise<void>): Promise<number> {
  const start = performance.now()
  await action()
  return Math.round(performance.now() - start)
}
