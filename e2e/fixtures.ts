import { test as base, expect, type Locator, type Page } from '@playwright/test'

/** 1×1 transparentes PNG. */
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
)

export const STORAGE_KEY = 'anime-tracker:watchlist:v1'

/**
 * next/image lädt Cover über /_next/image vom AniList-CDN. Das bräuchte Netz und
 * bremst die Tests — ein Platzhalterbild reicht, um Layout und Alt-Texte zu prüfen.
 */
export const test = base.extend({
  // Nicht "use" genannt: Die React-Hook-Regel von ESLint hielte das für einen Hook.
  page: async ({ page }, provide) => {
    await page.route('**/_next/image**', (route) =>
      route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL })
    )
    await provide(page)
  },
})

export { expect }

/**
 * Alles unterhalb von <main>. Nötig, weil das DOM kurzzeitig doppelt ist: React 19
 * parkt gestreamte Inhalte für einige hundert Millisekunden in einem versteckten
 * <div> außerhalb von <main>, bevor es sie einsetzt. Und Next.js hängt einen
 * unsichtbaren Route-Announcer mit role="alert" an die Seite.
 */
export function main(page: Page) {
  return page.getByRole('main')
}

/** Eine Karte der Trefferliste, gefunden über ihre Überschrift. */
export function card(page: Page, title: string) {
  return main(page)
    .locator('div.group')
    .filter({ has: page.getByRole('heading', { name: title, exact: true }) })
}

/** Liest die gespeicherte Watchlist direkt aus dem localStorage. */
export async function storedWatchlist(page: Page) {
  return page.evaluate(
    (key) => JSON.parse(window.localStorage.getItem(key) ?? '[]') as Array<Record<string, unknown>>,
    STORAGE_KEY
  )
}

/**
 * Klickt, bis die URL passt. Nur für die Filter-Chips: Vereinzelt (rund einer von
 * hundert Läufen) übernahm der Next.js-Router die Navigation nach einem Chip-Klick
 * nicht, obwohl der Server in wenigen Millisekunden mit 200 antwortete — die URL
 * blieb stehen. Ursache ungeklärt, gezielt nachstellen ließ es sich nicht. Ob ein
 * zweiter Klick hilft, ist deshalb nicht belegt. Scheitert der Test trotzdem hier,
 * liegt es an der App, nicht am Test.
 */
export async function clickUntilUrl(page: Page, target: Locator, url: RegExp) {
  await repeatUntilUrl(page, () => target.click({ timeout: 1_000 }), url)
}

/** Wie clickUntilUrl, für beliebige Aktionen — etwa Fokus setzen und Enter drücken. */
export async function repeatUntilUrl(page: Page, action: () => Promise<void>, url: RegExp) {
  await expect(async () => {
    if (!url.test(page.url())) await action()
    await expect(page).toHaveURL(url, { timeout: 1_500 })
  }).toPass({ timeout: 10_000 })
}
