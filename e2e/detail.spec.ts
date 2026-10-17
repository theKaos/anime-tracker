import { card, expect, main, test } from './fixtures'

test.describe('Detailseite', () => {
  test('öffnet sich aus der Liste und zeigt die Eckdaten', async ({ page }) => {
    await page.goto('/')

    await card(page, 'Attack on Titan').getByRole('link').click()

    await expect(page).toHaveURL('/anime/1')
    await expect(main(page).getByRole('heading', { level: 1, name: 'Attack on Titan' })).toBeVisible()
    await expect(main(page).getByText('進撃の巨人')).toBeVisible()
    await expect(main(page).getByText('Episoden')).toBeVisible()
    await expect(main(page).getByRole('heading', { name: 'Verwandte Anime' })).toBeVisible()
  })

  /*
   * Kein Blick auf den HTTP-Status: Wegen loading.tsx streamt Next.js die Seite,
   * der Status 200 ist schon unterwegs, wenn notFound() fällt. Next.js markiert
   * die Seite stattdessen mit noindex — darauf verlassen sich Suchmaschinen.
   */
  for (const [label, id] of [
    ['eine Zahl, die AniList nicht kennt', '404'],
    ['eine ID, die keine Zahl ist', 'abc'],
  ]) {
    test(`${label}, führt zur Nicht-gefunden-Seite`, async ({ page }) => {
      await page.goto(`/anime/${id}`)

      await expect(main(page).getByText('Seite nicht gefunden.')).toBeVisible()
      await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', /noindex/)
    })
  }

  test('der Watchlist-Knopf wechselt zwischen hinzufügen und entfernen', async ({ page }) => {
    await page.goto('/anime/1')

    await main(page).getByRole('button', { name: 'hinzufügen' }).click()
    await expect(main(page).getByRole('button', { name: 'entfernen' })).toBeVisible()

    await main(page).getByRole('button', { name: 'entfernen' }).click()
    await expect(main(page).getByRole('button', { name: 'hinzufügen' })).toBeVisible()
  })
})
