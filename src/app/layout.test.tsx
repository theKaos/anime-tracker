import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import RootLayout, { metadata } from './layout'

// next/font lädt Schriften zur Build-Zeit — im Test reicht der Klassenname.
vi.mock('next/font/google', () => ({
  Space_Grotesk: () => ({ variable: 'font-sans-var' }),
  JetBrains_Mono: () => ({ variable: 'font-mono-var' }),
}))

/**
 * Statisch gerendert statt mit Testing Library: Das Layout bringt <html> und <body>
 * selbst mit und ließe sich nicht in ein <div> der Testumgebung einhängen.
 */
describe('RootLayout', () => {
  const markup = renderToStaticMarkup(
    <RootLayout>
      <p>Seiteninhalt</p>
    </RootLayout>
  )

  it('declares German as the document language', () => {
    expect(markup).toMatch(/^<html lang="de">/)
  })

  it('wires both font variables into the body', () => {
    expect(markup).toContain('font-sans-var font-mono-var')
  })

  it('places the page between header and footer inside main', () => {
    const main = markup.indexOf('<main')
    expect(markup.indexOf('<header')).toBeLessThan(main)
    expect(markup.indexOf('Seiteninhalt')).toBeGreaterThan(main)
    expect(markup.indexOf('<footer')).toBeGreaterThan(markup.indexOf('</main>'))
  })

  it('names the app in the metadata', () => {
    expect(metadata.title).toBe('Anime Tracker')
  })
})
