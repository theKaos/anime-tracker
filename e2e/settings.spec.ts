import { readFile } from 'node:fs/promises'
import { card, expect, main, storedWatchlist, test } from './fixtures'

function watchlistFile(entries: unknown[]) {
  return {
    name: 'anime-watchlist.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        schemaVersion: 1,
        exportedAt: '2026-08-01T00:00:00.000Z',
        app: 'anime-tracker',
        entries,
      })
    ),
  }
}

const imported = {
  animeId: 42,
  status: 'WATCHING',
  progress: 5,
  totalEpisodes: 24,
  addedAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  deletedAt: null,
  snapshot: {
    title: { romaji: 'Importiert', english: null, native: '' },
    coverImage: '/c.jpg',
    format: 'TV',
  },
}

test.describe('Einstellungen — manueller Transfer', () => {
  test('exportiert die Watchlist als JSON-Datei', async ({ page }) => {
    await page.goto('/')
    await card(page, 'Demon Slayer').getByRole('button', { name: 'hinzufügen' }).click()
    await page.getByRole('navigation').getByRole('link', { name: 'Einstellungen' }).click()
    await expect(main(page).getByText('1 Einträge in der Watchlist')).toBeVisible()

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      main(page).getByRole('button', { name: 'Watchlist exportieren' }).click(),
    ])

    expect(download.suggestedFilename()).toBe('anime-watchlist.json')
    const file = JSON.parse(await readFile((await download.path())!, 'utf8'))
    expect(file).toMatchObject({ app: 'anime-tracker', schemaVersion: 1 })
    expect(file.entries).toEqual([expect.objectContaining({ animeId: 2, status: 'PLANNING' })])
  })

  test('importiert eine Datei, führt zusammen und fasst das Ergebnis zusammen', async ({ page }) => {
    await page.goto('/settings')

    await main(page).getByLabel('Watchlist-Datei auswählen').setInputFiles(watchlistFile([imported]))

    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Import abgeschlossen')
    await expect(main(page).getByTestId('merge-stat-added')).toHaveText(/1/)
    await dialog.getByRole('button', { name: 'Schließen' }).click()
    await expect(dialog).toBeHidden()

    await expect(main(page).getByText('1 Einträge in der Watchlist')).toBeVisible()
    expect(await storedWatchlist(page)).toEqual([expect.objectContaining({ animeId: 42, progress: 5 })])

    await page.goto('/watchlist')
    await expect(main(page).getByText('Importiert')).toBeVisible()
  })

  test('lehnt eine fremde Datei ab, ohne die Watchlist anzufassen', async ({ page }) => {
    await page.goto('/settings')

    await main(page).getByLabel('Watchlist-Datei auswählen').setInputFiles({
      name: 'fremd.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ app: 'etwas-anderes', entries: [] })),
    })

    await expect(main(page).getByRole('alert')).toHaveText('Diese Datei stammt nicht aus dem Anime Tracker.')
    await expect(main(page).getByText('0 Einträge in der Watchlist')).toBeVisible()
  })

  test('meldet kaputtes JSON verständlich', async ({ page }) => {
    await page.goto('/settings')

    await main(page).getByLabel('Watchlist-Datei auswählen').setInputFiles({
      name: 'kaputt.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{nicht json'),
    })

    await expect(main(page).getByRole('alert')).toHaveText('Die Datei enthält kein gültiges JSON.')
  })
})

test.describe('Einstellungen — automatischer Abgleich', () => {
  test('Chromium bietet beide Wege zur Datei an', async ({ page }) => {
    await page.goto('/settings')

    await expect(main(page).getByRole('heading', { name: 'Automatischer Geräteabgleich' })).toBeVisible()
    await expect(main(page).getByRole('button', { name: 'Vorhandene Datei auswählen' })).toBeVisible()
  })

  test('ohne File System Access bleibt nur der manuelle Weg', async ({ page }) => {
    // So sieht die Seite in Firefox und Safari aus.
    await page.addInitScript(() => {
      delete (window as { showOpenFilePicker?: unknown }).showOpenFilePicker
      delete (window as { showSaveFilePicker?: unknown }).showSaveFilePicker
    })
    await page.goto('/settings')

    await expect(main(page).getByText(/unterstützt den direkten Dateizugriff nicht/)).toBeVisible()
    await expect(main(page).getByRole('button', { name: 'Vorhandene Datei auswählen' })).toHaveCount(0)
    await expect(main(page).getByRole('button', { name: 'Watchlist exportieren' })).toBeEnabled()
  })

  test('ein abgebrochener Dateidialog hinterlässt keinen Fehler', async ({ page }) => {
    await page.addInitScript(() => {
      window.showOpenFilePicker = async () => {
        throw new DOMException('Abgebrochen', 'AbortError')
      }
    })
    await page.goto('/settings')

    await main(page).getByRole('button', { name: 'Vorhandene Datei auswählen' }).click()

    await expect(main(page).getByRole('button', { name: 'Vorhandene Datei auswählen' })).toBeVisible()
    await expect(main(page).getByRole('alert')).toHaveCount(0)
  })
})
