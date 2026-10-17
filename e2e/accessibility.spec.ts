import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { card, expect, main, repeatUntilUrl, STORAGE_KEY, test } from './fixtures'

/** WCAG 2.2 bis Stufe AA — das, was z. B. die BITV 2.0 verlangt. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

/**
 * Prüft die Seite mit axe-core. Die Meldung listet jeden Verstoß mit den
 * betroffenen Elementen — ein nacktes "expected [] to equal [...]" hilft niemandem.
 */
async function expectNoViolations(page: Page, include?: string) {
  let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS)
  if (include) builder = builder.include(include)
  const { violations } = await builder.analyze()

  const readable = violations.map((violation) => ({
    rule: violation.id,
    impact: violation.impact,
    help: violation.help,
    targets: violation.nodes.map((node) => node.target.join(' ')),
  }))
  expect(readable, JSON.stringify(readable, null, 2)).toEqual([])
}

const entry = {
  animeId: 1,
  status: 'WATCHING',
  progress: 3,
  totalEpisodes: 12,
  addedAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deletedAt: null,
  snapshot: {
    title: { romaji: 'Mushishi', english: null, native: '蟲師' },
    coverImage: '/c.jpg',
    format: 'TV',
  },
}

async function seed(page: Page, entries: unknown[]) {
  await page.addInitScript(
    ([key, value]) => {
      if (window.localStorage.getItem(key) === null) window.localStorage.setItem(key, value)
    },
    [STORAGE_KEY, JSON.stringify(entries)] as const
  )
}

test.describe('axe-core: WCAG 2.2 AA', () => {
  test('Startseite', async ({ page }) => {
    await page.goto('/')
    await expect(card(page, 'Attack on Titan')).toBeVisible()
    await expectNoViolations(page)
  })

  test('Startseite mit aktiven Filtern', async ({ page }) => {
    await page.goto('/?season=FALL&genres=Action')
    await expect(main(page).getByRole('button', { name: 'FALL ✕' })).toBeVisible()
    await expectNoViolations(page)
  })

  test('Startseite mit Fehlermeldung', async ({ page }) => {
    await page.route('http://localhost:4010/**', (route) =>
      route.request().method() === 'POST' ? route.abort('connectionrefused') : route.fallback()
    )
    await page.goto('/?search=serverfail')
    await expect(main(page).getByRole('alert')).toBeVisible()
    await expectNoViolations(page)
  })

  test('Detailseite', async ({ page }) => {
    await page.goto('/anime/1')
    await expect(main(page).getByRole('heading', { level: 1 })).toBeVisible()
    await expectNoViolations(page)
  })

  test('Watchlist, leer', async ({ page }) => {
    await page.goto('/watchlist')
    await expect(main(page).getByText('Keine Einträge in dieser Ansicht.')).toBeVisible()
    await expectNoViolations(page)
  })

  test('Watchlist mit Einträgen', async ({ page }) => {
    await seed(page, [entry, { ...entry, animeId: 2, totalEpisodes: null, progress: 0 }])
    await page.goto('/watchlist')
    await expect(main(page).getByRole('button', { name: 'Entfernen' })).toHaveCount(2)
    await expectNoViolations(page)
  })

  test('Einstellungen', async ({ page }) => {
    await page.goto('/settings')
    await expect(main(page).getByRole('button', { name: 'Watchlist exportieren' })).toBeVisible()
    await expectNoViolations(page)
  })

  test('Einstellungen mit Importfehler', async ({ page }) => {
    await page.goto('/settings')
    await main(page).getByLabel('Watchlist-Datei auswählen').setInputFiles({
      name: 'kaputt.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{nicht json'),
    })
    await expect(main(page).getByRole('alert')).toBeVisible()
    await expectNoViolations(page)
  })

  test('Import-Dialog', async ({ page }) => {
    await page.goto('/settings')
    await main(page).getByLabel('Watchlist-Datei auswählen').setInputFiles({
      name: 'anime-watchlist.json',
      mimeType: 'application/json',
      buffer: Buffer.from(
        JSON.stringify({ schemaVersion: 1, exportedAt: entry.updatedAt, app: 'anime-tracker', entries: [entry] })
      ),
    })
    await expect(page.getByRole('dialog')).toBeVisible()
    await expectNoViolations(page)
  })

  test('Nicht-gefunden-Seite', async ({ page }) => {
    await page.goto('/anime/abc')
    await expect(main(page).getByText('Seite nicht gefunden.')).toBeVisible()
    await expectNoViolations(page)
  })
})

/** Beschreibt das gerade fokussierte Element, damit Fehlermeldungen lesbar bleiben. */
async function focused(page: Page) {
  return page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null
    if (!element || element === document.body) return 'body'
    const name = element.getAttribute('aria-label') ?? element.textContent?.trim().slice(0, 40)
    return `${element.tagName.toLowerCase()} "${name}"`
  })
}

/** Ob das fokussierte Element sichtbar markiert ist: Outline oder Ring. */
async function hasVisibleFocus(page: Page) {
  return page.evaluate(() => {
    const element = document.activeElement as HTMLElement
    const style = getComputedStyle(element)
    const outline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0
    const ring = style.boxShadow !== 'none'
    return outline || ring
  })
}

test.describe('Tastaturbedienung', () => {
  test('die Navigation ist per Tab erreichbar, in sinnvoller Reihenfolge', async ({ page }) => {
    await page.goto('/')
    await expect(card(page, 'Attack on Titan')).toBeVisible()

    const order: string[] = []
    for (let step = 0; step < 5; step += 1) {
      await page.keyboard.press('Tab')
      order.push(await focused(page))
    }

    expect(order).toEqual([
      'a "Anime Tracker"',
      'a "Home"',
      'a "Watchlist"',
      'a "Einstellungen"',
      'input "Anime suchen"',
    ])
  })

  test('jedes fokussierte Element ist sichtbar markiert (WCAG 2.4.7)', async ({ page }) => {
    await page.goto('/')
    await expect(card(page, 'Attack on Titan')).toBeVisible()

    const unmarked: string[] = []
    // Kopf, Suche, Filter, Genres, erste Karten — ein repräsentativer Querschnitt.
    for (let step = 0; step < 40; step += 1) {
      await page.keyboard.press('Tab')
      const current = await focused(page)
      // Hinter dem letzten Element landet Tab kurz auf dem Dokument selbst.
      if (current !== 'body' && !(await hasVisibleFocus(page))) unmarked.push(current)
    }

    expect(unmarked).toEqual([])
  })

  test('Suche und Filter funktionieren ohne Maus', async ({ page }) => {
    await page.goto('/')
    await expect(card(page, 'Attack on Titan')).toBeVisible()

    await main(page).getByLabel('Anime suchen').focus()
    await page.keyboard.type('bocchi')
    await expect(page).toHaveURL(/search=bocchi/)
    await expect(card(page, 'Bocchi the Rock!')).toBeVisible()

    const genre = main(page).getByRole('button', { name: 'Action', exact: true })
    await repeatUntilUrl(
      page,
      async () => {
        await genre.focus()
        await page.keyboard.press('Enter')
      },
      /search=bocchi&genres=Action/
    )
    await expect(main(page).getByRole('button', { name: 'Action', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  test('Watchlist: Fortschritt per Tastatur, Knöpfe sind beschriftet', async ({ page }) => {
    await seed(page, [entry])
    await page.goto('/watchlist')

    const forward = main(page).getByRole('button', { name: 'Episode vor' })
    await forward.focus()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Space')

    await expect(main(page).getByLabel('Episoden-Fortschritt', { exact: true })).toHaveText('5 / 12')
    await expect(main(page).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '5')
  })

  test('Watchlist-Tabs melden den aktiven Tab', async ({ page }) => {
    await seed(page, [entry])
    await page.goto('/watchlist')

    const tablist = main(page).getByRole('tablist')
    await expect(tablist.getByRole('tab', { selected: true })).toHaveText('Alle')

    await tablist.getByRole('tab', { name: 'Schaue ich' }).focus()
    await page.keyboard.press('Enter')
    await expect(tablist.getByRole('tab', { selected: true })).toHaveText('Schaue ich')
  })
})

test.describe('Dialog', () => {
  async function openImportDialog(page: Page) {
    await page.goto('/settings')
    await main(page).getByLabel('Watchlist-Datei auswählen').setInputFiles({
      name: 'anime-watchlist.json',
      mimeType: 'application/json',
      buffer: Buffer.from(
        JSON.stringify({ schemaVersion: 1, exportedAt: entry.updatedAt, app: 'anime-tracker', entries: [entry] })
      ),
    })
    const dialog = page.getByRole('dialog', { name: 'Import abgeschlossen' })
    await expect(dialog).toBeVisible()
    return dialog
  }

  test('ist als modaler Dialog mit Namen ausgezeichnet', async ({ page }) => {
    const dialog = await openImportDialog(page)
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  test('Escape schließt ihn', async ({ page }) => {
    const dialog = await openImportDialog(page)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('der Fokus springt beim Öffnen in den Dialog (WCAG 2.4.3)', async ({ page }) => {
    const dialog = await openImportDialog(page)
    await expect
      .poll(() => dialog.evaluate((element) => element.contains(document.activeElement)))
      .toBe(true)
  })

  test('Tab verlässt den offenen Dialog nicht', async ({ page }) => {
    const dialog = await openImportDialog(page)
    await dialog.getByRole('button', { name: 'Schließen' }).focus()

    for (let step = 0; step < 3; step += 1) {
      await page.keyboard.press('Tab')
      expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)
    }
  })
})

test.describe('Umbruch auf schmalen Bildschirmen (WCAG 1.4.10)', () => {
  // 320 CSS-Pixel entsprechen 1280 px bei 400 % Zoom — die Grenze aus der Norm.
  test.use({ viewport: { width: 320, height: 640 } })

  for (const path of ['/', '/anime/1', '/watchlist', '/settings']) {
    test(`${path} scrollt nicht seitlich`, async ({ page }) => {
      await seed(page, [entry])
      await page.goto(path)
      await expect(main(page)).toBeVisible()
      await page.waitForLoadState('networkidle')

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }
})
