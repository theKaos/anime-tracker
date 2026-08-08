import type { Metadata } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { WatchlistProvider } from '@/context/WatchlistProvider'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import './globals.css'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-sans' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Anime Tracker',
  description: 'Anime suchen, verfolgen, Fortschritt tracken.',
}

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem('anime-tracker:theme');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var shouldBeDark = stored ? stored === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', shouldBeDark);
  } catch (e) {}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} bg-bg font-sans text-text`}>
        <WatchlistProvider>
          <Header />
          <main className="mx-auto min-h-screen max-w-[1240px] px-[34px] py-8">{children}</main>
          <Footer />
        </WatchlistProvider>
      </body>
    </html>
  )
}
