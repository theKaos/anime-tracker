import type { Metadata } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { FileSyncProvider } from '@/context/FileSyncProvider'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ReconnectBanner } from '@/components/layout/ReconnectBanner'
import './globals.css'

/*
 * next/font überschreibt mit `variable` die gleichnamige Tailwind-Variable aus
 * globals.css, deren Ersatzschriften gelten dann nicht mehr — daher `fallback`.
 *
 * Für JetBrains Mono zusätzlich `adjustFontFallback: false`: Sonst legt Next.js
 * als Ersatz ein auf 134,6 % vergrößertes Arial an. Das trifft die mittlere
 * Zeichenbreite, aber nicht die der Großbuchstaben — die Genre-Knöpfe (uppercase)
 * waren bis zum Schrifttausch rund 30 % breiter, brachen anders um, und das
 * Anime-Raster sprang (CLS 0,34). Eine echte Monospace-Schrift liegt viel näher.
 */
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
})
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  adjustFontFallback: false,
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
})

export const metadata: Metadata = {
  title: 'Anime Tracker',
  description: 'Anime suchen, verfolgen, Fortschritt tracken.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} bg-bg font-sans text-text`}>
        <FileSyncProvider>
          <Header />
          <ReconnectBanner />
          <main className="mx-auto min-h-screen max-w-[1240px] px-4 py-8 sm:px-[34px]">{children}</main>
          <Footer />
        </FileSyncProvider>
      </body>
    </html>
  )
}
