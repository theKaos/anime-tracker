import type { Page } from '@playwright/test'
import { expect, main, STORAGE_KEY, test } from './fixtures'
import {
  collectVitals,
  median,
  medianVitals,
  observeVitals,
  report,
  RUNS,
  throttle,
  timed,
  type PageVitals,
} from './perf-utils'

/**
 * Budgets gelten für den gedrosselten Lauf (4× CPU, ~Fast 4G, siehe perf-utils.ts)
 * gegen den Produktions-Build und den lokalen AniList-Mock. Netzlatenz zu AniList
 * und echte Coverbilder sind also nicht enthalten — gemessen wird, was die App
 * selbst kostet.
 *
 * Die Web-Vitals-Grenzen orientieren sich an Googles "gut"-Schwellen (LCP 2,5 s,
 * CLS 0,1, TBT 200 ms). Die übrigen Werte liegen mit Abstand über der Baseline
 * vom Einrichten, damit Rauschen nicht anschlägt, ein echter Rückschritt aber schon.
 */
const BUDGET = {
  ttfb: 600,
  firstContentfulPaint: 1800,
  largestContentfulPaint: 2500,
  cumulativeLayoutShift: 0.1,
  totalBlockingTime: 200,
  /** Komprimiertes JS der Startseite. Baseline: 135 KB. */
  scriptKb: 200,
  /** Eine Aktion in der Watchlist, bis das Ergebnis zu sehen ist. Baseline (Median): 90–200 ms. */
  interactionMs: 300,
  /** Import von 600 Einträgen bis zur Zusammenfassung. Baseline: 70–90 ms. */
  importMs: 500,
}

/**
 * Bekannte Schwachstelle, bewusst eigenes Budget: Die Watchlist rendert alle
 * Einträge auf einmal, ohne Virtualisierung. Bei 300 Einträgen liegt das über
 * Googles TBT-Grenze, und ein einzelner Fortschritts-Klick kostet fast doppelt so
 * viel wie ein Tab-Wechsel. Die Werte hier verhindern, dass es schlimmer wird —
 * wer es verbessert, zieht sie nach.
 */
const LARGE_WATCHLIST_BUDGET = {
  /** Baseline (Median): 255–355 ms. */
  totalBlockingTime: 450,
  /** Baseline (Median): 220–280 ms. */
  progressMs: 400,
}

/** So groß wird eine Watchlist nach ein paar Jahren tatsächlich. */
const LARGE_WATCHLIST = 300

function watchlistEntries(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    animeId: index + 1,
    status: ['WATCHING', 'PLANNING', 'COMPLETED', 'PAUSED', 'DROPPED'][index % 5],
    progress: index % 24,
    totalEpisodes: 24,
    addedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    snapshot: {
      title: { romaji: `Anime ${String(index + 1).padStart(4, '0')}`, english: null, native: '' },
      coverImage: '/c.jpg',
      format: 'TV',
    },
  }))
}

async function seedWatchlist(page: Page, count: number) {
  await page.addInitScript(
    ([key, value]) => {
      if (window.localStorage.getItem(key) === null) window.localStorage.setItem(key, value)
    },
    [STORAGE_KEY, JSON.stringify(watchlistEntries(count))] as const
  )
}

function expectWithinVitalsBudget(
  vitals: PageVitals,
  budget: Partial<typeof BUDGET> = {}
) {
  const limits = { ...BUDGET, ...budget }
  expect.soft(vitals.ttfb, 'TTFB').toBeLessThanOrEqual(limits.ttfb)
  expect.soft(vitals.firstContentfulPaint, 'FCP').toBeLessThanOrEqual(limits.firstContentfulPaint)
  expect.soft(vitals.largestContentfulPaint, 'LCP').toBeLessThanOrEqual(limits.largestContentfulPaint)
  expect.soft(vitals.cumulativeLayoutShift, 'CLS').toBeLessThanOrEqual(limits.cumulativeLayoutShift)
  expect.soft(vitals.totalBlockingTime, 'TBT').toBeLessThanOrEqual(limits.totalBlockingTime)
}

/**
 * Ruft die Seite RUNS-mal auf und liefert den Median jeder Kennzahl. Der erste
 * Lauf ist ein Erstbesuch, die übrigen entsprechen einem erneuten Aufruf derselben
 * Adresse. Der HTTP-Cache ist dabei abgeschaltet (siehe throttle).
 */
async function measureLoad(page: Page, url: string, ready: () => Promise<void>) {
  const runs: PageVitals[] = []
  for (let run = 0; run < RUNS; run += 1) {
    await page.goto(url)
    await ready()
    runs.push(await collectVitals(page))
  }
  return { vitals: medianVitals(runs), runs }
}

test.describe('Ladeleistung', () => {
  test.beforeEach(async ({ page }) => {
    await observeVitals(page)
    await throttle(page)
  })

  test('Startseite', async ({ page }, testInfo) => {
    const browserApiCalls: Array<{ page: number }> = []
    page.on('request', (request) => {
      if (request.url().startsWith('http://localhost:4010') && request.method() === 'POST') {
        browserApiCalls.push(request.postDataJSON().variables)
      }
    })

    const { vitals, runs } = await measureLoad(page, '/', () =>
      expect(main(page).getByRole('heading', { name: 'Attack on Titan' })).toBeVisible()
    )
    await report(testInfo, 'startseite', vitals, runs)

    expectWithinVitalsBudget(vitals)
    expect.soft(vitals.scriptKb, 'JavaScript (KB, komprimiert)').toBeLessThanOrEqual(BUDGET.scriptKb)
    // Die erste Seite rendert der Server. Fragt der Browser sie erneut an, wurde sie
    // doppelt geladen. Seite 2 darf kommen: Mit nur zwei Anime in den Testdaten ist
    // der Infinite-Scroll-Trigger sofort im Bild — einmal pro Seitenaufruf.
    const firstPageRequests = browserApiCalls.filter((variables) => variables.page === 1)
    expect.soft(firstPageRequests, 'Seite 1 erneut aus dem Browser geladen').toEqual([])
    expect.soft(browserApiCalls.length, 'AniList-Anfragen aus dem Browser').toBeLessThanOrEqual(RUNS)
  })

  test('Detailseite', async ({ page }, testInfo) => {
    const { vitals, runs } = await measureLoad(page, '/anime/1', () =>
      expect(main(page).getByRole('heading', { level: 1 })).toBeVisible()
    )
    await report(testInfo, 'detailseite', vitals, runs)

    expectWithinVitalsBudget(vitals)
  })

  test(`Watchlist mit ${LARGE_WATCHLIST} Einträgen`, async ({ page }, testInfo) => {
    await seedWatchlist(page, LARGE_WATCHLIST)

    const { vitals, runs } = await measureLoad(page, '/watchlist', () =>
      expect(main(page).getByRole('button', { name: 'Entfernen' })).toHaveCount(LARGE_WATCHLIST)
    )
    await report(testInfo, 'watchlist-laden', vitals, runs)

    expectWithinVitalsBudget(vitals, LARGE_WATCHLIST_BUDGET)
  })
})

test.describe('Reaktionszeit', () => {
  test.beforeEach(async ({ page }) => {
    await throttle(page)
  })

  test(`Watchlist mit ${LARGE_WATCHLIST} Einträgen bleibt flüssig`, async ({ page }, testInfo) => {
    await seedWatchlist(page, LARGE_WATCHLIST)
    await page.goto('/watchlist')
    const items = main(page).getByRole('button', { name: 'Entfernen' })
    await expect(items).toHaveCount(LARGE_WATCHLIST)
    const firstProgress = main(page).getByLabel('Episoden-Fortschritt', { exact: true }).first()
    const samples = { progressMs: [] as number[], tabMs: [] as number[], sortMs: [] as number[], removeMs: [] as number[] }

    // Erster Eintrag (nach Titel sortiert) ist "Anime 0001" mit 0 Folgen.
    for (let run = 1; run <= RUNS; run += 1) {
      samples.progressMs.push(
        await timed(async () => {
          await main(page).getByRole('button', { name: 'Episode vor' }).first().click()
          await expect(firstProgress).toHaveText(`${run} / 24`)
        })
      )
    }

    for (let run = 0; run < RUNS; run += 1) {
      samples.tabMs.push(
        await timed(async () => {
          await main(page).getByRole('tab', { name: 'Abgeschlossen' }).click()
          await expect(items).toHaveCount(LARGE_WATCHLIST / 5)
        })
      )
      await main(page).getByRole('tab', { name: 'Alle' }).click()
      await expect(items).toHaveCount(LARGE_WATCHLIST)
    }

    await main(page).getByRole('tab', { name: 'Abgeschlossen' }).click()
    const sortSelect = main(page).getByLabel('Watchlist sortieren')
    for (let run = 0; run < RUNS; run += 1) {
      samples.sortMs.push(
        await timed(async () => {
          await sortSelect.selectOption('PROGRESS_DESC')
          // Höchster Fortschritt unter den abgeschlossenen: Eintrag 48 mit 23 Folgen.
          await expect(firstProgress).toHaveText('23 / 24')
        })
      )
      await sortSelect.selectOption('TITLE_ASC')
      await expect(firstProgress).toHaveText('2 / 24')
    }

    for (let run = 1; run <= RUNS; run += 1) {
      samples.removeMs.push(
        await timed(async () => {
          await items.first().click()
          await expect(items).toHaveCount(LARGE_WATCHLIST / 5 - run)
        })
      )
    }

    const metrics = Object.fromEntries(
      Object.entries(samples).map(([name, values]) => [name, median(values)])
    ) as Record<keyof typeof samples, number>
    await report(testInfo, 'watchlist-interaktion', metrics, [samples])

    expect.soft(metrics.progressMs, 'progressMs').toBeLessThanOrEqual(LARGE_WATCHLIST_BUDGET.progressMs)
    for (const name of ['tabMs', 'sortMs', 'removeMs'] as const) {
      expect.soft(metrics[name], name).toBeLessThanOrEqual(BUDGET.interactionMs)
    }
  })

  test('Import einer großen Datei', async ({ page }, testInfo) => {
    await seedWatchlist(page, LARGE_WATCHLIST)

    // Gleiche IDs mit neuerem Stand plus genauso viele neue: Der Merge hat zu tun.
    const incoming = watchlistEntries(LARGE_WATCHLIST * 2).map((entry) => ({
      ...entry,
      progress: 5,
      updatedAt: '2026-06-01T00:00:00.000Z',
    }))
    const file = {
      name: 'anime-watchlist.json',
      mimeType: 'application/json',
      buffer: Buffer.from(
        JSON.stringify({
          schemaVersion: 1,
          exportedAt: '2026-06-01T00:00:00.000Z',
          app: 'anime-tracker',
          entries: incoming,
        })
      ),
    }

    const runs: number[] = []
    for (let run = 0; run < RUNS; run += 1) {
      // Jeder Lauf startet mit der Ausgangsliste, sonst gäbe es ab Lauf 2 nichts zu
      // mergen. Nach dem Löschen legt das Init-Skript sie beim Neuladen wieder an.
      await page.goto('/settings')
      await page.evaluate((key) => window.localStorage.removeItem(key), STORAGE_KEY)
      await page.reload()
      await expect(main(page).getByText(`${LARGE_WATCHLIST} Einträge in der Watchlist`)).toBeVisible()

      runs.push(
        await timed(async () => {
          await main(page).getByLabel('Watchlist-Datei auswählen').setInputFiles(file)
          await expect(page.getByRole('dialog')).toContainText('Import abgeschlossen')
        })
      )
      await expect(page.getByTestId('merge-stat-added')).toContainText(String(LARGE_WATCHLIST))
    }

    const importMs = median(runs)
    await report(testInfo, 'import', { entries: incoming.length, importMs }, runs.map((ms) => ({ ms })))
    expect.soft(importMs, 'Import').toBeLessThanOrEqual(BUDGET.importMs)
  })
})
