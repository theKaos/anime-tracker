import { card, clickUntilUrl, expect, main, test } from './fixtures'

test.describe('Startseite und Suche', () => {
  test('zeigt die Trending-Liste, die der Server geliefert hat', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle('Anime Tracker')
    await expect(main(page).getByRole('heading', { name: 'Attack on Titan' })).toBeVisible()
    await expect(main(page).getByRole('heading', { name: 'Demon Slayer' })).toBeVisible()
  })

  test('lädt beim Scrollen die nächste Seite nach', async ({ page }) => {
    await page.goto('/')
    await expect(main(page).getByRole('heading', { name: 'Attack on Titan' })).toBeVisible()

    await page.mouse.wheel(0, 10_000)

    await expect(main(page).getByRole('heading', { name: /Frieren/ })).toBeVisible()
    await expect(main(page).getByRole('heading', { name: 'Mushishi' })).toBeVisible()
  })

  test('schreibt die Suche in die URL und zeigt die Treffer', async ({ page }) => {
    await page.goto('/')

    await main(page).getByLabel('Anime suchen').fill('bocchi')

    await expect(page).toHaveURL(/\?search=bocchi/)
    await expect(main(page).getByRole('heading', { name: 'Bocchi the Rock!' })).toBeVisible()
    await expect(main(page).getByRole('heading', { name: 'Attack on Titan' })).toHaveCount(0)
  })

  test('eine geteilte Such-URL zeigt sofort dieselben Treffer', async ({ page }) => {
    await page.goto('/?search=bocchi')

    await expect(main(page).getByLabel('Anime suchen')).toHaveValue('bocchi')
    await expect(main(page).getByRole('heading', { name: 'Bocchi the Rock!' })).toBeVisible()
    await expect(main(page).getByText('"bocchi" ✕')).toBeVisible()
  })

  test('sagt Bescheid, wenn eine Suche nichts findet', async ({ page }) => {
    await page.goto('/?search=nichts')

    await expect(main(page).getByText('Keine Anime gefunden. Versuch es mit anderen Filtern.')).toBeVisible()
  })

  test('setzt Filter als Chips und entfernt sie wieder', async ({ page }) => {
    await page.goto('/')

    await main(page).getByLabel('Season').selectOption('FALL')
    await expect(page).toHaveURL(/season=FALL/)
    // Die Filter kommen als Props vom Server. Erst wenn der Chip steht, kennt die
    // Seite den neuen Stand — eine schnellere zweite Auswahl ginge vom alten aus.
    await expect(main(page).getByRole('button', { name: 'FALL ✕' })).toBeVisible()
    await main(page).getByLabel('Format').selectOption('MOVIE')
    await expect(page).toHaveURL(/season=FALL&format=MOVIE/)
    await expect(main(page).getByRole('button', { name: 'MOVIE ✕' })).toBeVisible()

    await clickUntilUrl(page, main(page).getByRole('button', { name: 'FALL ✕' }), /\?format=MOVIE$/)
    await expect(main(page).getByRole('button', { name: 'FALL ✕' })).toHaveCount(0)

    await clickUntilUrl(page, main(page).getByRole('button', { name: 'MOVIE ✕' }), /\/$/)
  })

  test('Genres lassen sich an- und abwählen', async ({ page }) => {
    await page.goto('/')

    await main(page).getByRole('button', { name: 'Action', exact: true }).click()
    await expect(page).toHaveURL(/genres=Action/)
    await expect(main(page).getByRole('button', { name: 'Action ✕' })).toBeVisible()

    await clickUntilUrl(page, main(page).getByRole('button', { name: 'Action ✕' }), /\/$/)
  })
})

test.describe('AniList blockt den Server', () => {
  test('der Browser lädt die Liste selbst nach', async ({ page }) => {
    await page.goto('/?search=serverfail')

    await expect(main(page).getByRole('heading', { name: 'Bocchi the Rock!' })).toBeVisible()
    await expect(main(page).getByRole('alert')).toHaveCount(0)
  })

  test('scheitert auch der Browser, erklärt die Seite das und bietet einen Retry', async ({
    page,
  }) => {
    let blocked = true
    let attempts = 0
    await page.route('http://localhost:4010/**', (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      attempts += 1
      return blocked ? route.abort('connectionrefused') : route.fallback()
    })

    await page.goto('/?search=serverfail')
    const alert = main(page).getByRole('alert')
    await expect(alert).toContainText('Die Anime konnten nicht geladen werden.')

    // Regression: Früher feuerte der Infinite-Scroll-Trigger nach dem Fehler rund
    // 60 Anfragen pro Sekunde ab — bei einem Limit von 30 pro Minute.
    await page.waitForTimeout(1000)
    expect(attempts).toBe(1)

    blocked = false
    await alert.getByRole('button', { name: 'Erneut versuchen' }).click()

    await expect(card(page, 'Bocchi the Rock!')).toBeVisible()
    await expect(alert).toHaveCount(0)
  })
})
