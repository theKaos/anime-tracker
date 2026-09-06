import type { Metadata } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { FileSyncProvider } from '@/context/FileSyncProvider'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ReconnectBanner } from '@/components/layout/ReconnectBanner'
import './globals.css'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-sans' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

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
          <main className="mx-auto min-h-screen max-w-[1240px] px-[34px] py-8">{children}</main>
          <Footer />
        </FileSyncProvider>
      </body>
    </html>
  )
}
