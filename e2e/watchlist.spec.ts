import type { Page } from '@playwright/test'
import { STORAGE_KEY, card, expect, main, storedWatchlist, test } from './fixtures'

function entry(animeId: number, title: string, overrides: Record<string, unknown> = {}) {
  return {
    animeId,
    status: 'WATCHING',
    progress: 3,
    totalEpisodes: 12,
    addedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    snapshot: { title: { romaji: title, english: null, native: title }, coverImage: '/c.jpg', format: 'TV' },
    ...overrides,
  }
}

/**
 * Legt eine Watchlist an, bevor die App startet. Nur beim ersten Laden — sonst
 * überschriebe das Skript bei jedem Reload genau das, was der Test prüfen will.
 */
async function seed(page: Page, entries: unknown[]) {
  await page.addInitScript(
    ([key, value]) => {
      if (window.localStorage.getItem(key) === null) window.localStorage.setItem(key, value)
    },
    [STORAGE_KEY, JSON.stringify(entries)] as const
  )
}

test.describe('Watchlist', () => {
  test('ist anfangs leer', async ({ page }) => {
    await page.goto('/watchlist')

    await expect(main(page).getByRole('heading', { name: 'Meine Watchlist' })).toBeVisible()
    await expect(main(page).getByText('Keine Einträge in dieser Ansicht.')).toBeVisible()
  })

  test('übernimmt einen Anime aus der Suche und überlebt einen Reload', async ({ page }) => {
    await page.goto('/')
    await card(page, 'Attack on Titan').getByRole('button', { name: 'hinzufügen' }).click()
    await expect(card(page, 'Attack on Titan').getByRole('button', { name: 'entfernen' })).toBeVisible()

    await page.getByRole('navigation').getByRole('link', { name: 'Watchlist' }).click()
    await expect(page).toHaveURL('/watchlist')
    await expect(main(page).getByText('Attack on Titan')).toBeVisible()
    await expect(main(page).getByLabel('Status')).toHaveValue('PLANNING')

    await page.reload()
    await expect(main(page).getByText('Attack on Titan')).toBeVisible()
  })

  test('zählt Folgen hoch und runter, nie unter null oder über das Ende', async ({ page }) => {
    await seed(page, [entry(1, 'Mushishi', { progress: 11 })])
    await page.goto('/watchlist')
    const progress = main(page).getByLabel('Episoden-Fortschritt', { exact: true })

    await main(page).getByRole('button', { name: 'Episode vor' }).click()
    await expect(progress).toHaveText('12 / 12')
    await expect(main(page).getByRole('button', { name: 'Episode vor' })).toBeDisabled()

    await main(page).getByRole('button', { name: 'Episode zurück' }).click()
    await expect(progress).toHaveText('11 / 12')

    await page.reload()
    await expect(progress).toHaveText('11 / 12')
  })

  test('filtert nach Status und sortiert', async ({ page }) => {
    await seed(page, [
      entry(1, 'Zeta', { progress: 1 }),
      entry(2, 'Alpha', { progress: 9 }),
      entry(3, 'Mitte', { status: 'COMPLETED', progress: 12 }),
    ])
    await page.goto('/watchlist')
    const titles = page.locator('.font-semibold.break-words')

    await expect(titles).toHaveText(['Alpha', 'Mitte', 'Zeta'])

    await main(page).getByLabel('Watchlist sortieren').selectOption('PROGRESS_ASC')
    await expect(titles).toHaveText(['Zeta', 'Alpha', 'Mitte'])

    await main(page).getByRole('tab', { name: 'Abgeschlossen' }).click()
    await expect(titles).toHaveText(['Mitte'])
  })

  test('Statuswechsel verschiebt den Eintrag in den passenden Tab', async ({ page }) => {
    await seed(page, [entry(1, 'Mushishi')])
    await page.goto('/watchlist')

    await main(page).getByLabel('Status').selectOption('COMPLETED')
    await main(page).getByRole('tab', { name: 'Schaue ich' }).click()
    await expect(main(page).getByText('Keine Einträge in dieser Ansicht.')).toBeVisible()

    await main(page).getByRole('tab', { name: 'Abgeschlossen' }).click()
    await expect(main(page).getByText('Mushishi')).toBeVisible()
  })

  test('Entfernen hinterlässt einen Grabstein statt den Eintrag zu löschen', async ({ page }) => {
    await seed(page, [entry(1, 'Mushishi')])
    await page.goto('/watchlist')

    await main(page).getByRole('button', { name: 'Entfernen' }).click()

    await expect(main(page).getByText('Keine Einträge in dieser Ansicht.')).toBeVisible()
    // Der Grabstein ist nötig, damit die Löschung den Geräteabgleich übersteht.
    const [stored] = await storedWatchlist(page)
    expect(stored.deletedAt).toEqual(expect.any(String))
  })
})

test.describe('Mobile Ansicht', () => {
  test('Watchlist-Kachel passt auf 375px, ohne seitlich zu scrollen @mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await seed(page, [
      entry(1, 'Ein ziemlich langer Anime-Titel, der umbrechen muss', { progress: 10 }),
    ])
    await page.goto('/watchlist')

    const remove = main(page).getByRole('button', { name: 'Entfernen' })
    await expect(remove).toBeInViewport({ ratio: 1 })
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('Kopfzeile bricht um statt die Seite zu verbreitern @mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/')

    await expect(page.getByRole('link', { name: 'Einstellungen' })).toBeInViewport()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
