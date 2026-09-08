import Link from 'next/link'

export function Header() {
  return (
    <header className="border-b border-border bg-surface">
      {/*
        Umbruchfähig und mit schmalerem Rand auf kleinen Geräten: Logo plus drei
        Navigationspunkte passen bei 375px sonst nicht nebeneinander und schieben
        die ganze Seite in den horizontalen Scroll.
      */}
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-4 sm:px-[34px]">
        <Link href="/" className="text-lead font-bold tracking-tight text-text sm:text-h2">
          Anime Tracker
        </Link>
        <nav className="flex items-center gap-4 font-mono text-meta uppercase tracking-wide text-text-muted sm:gap-6">
          <Link href="/">Home</Link>
          <Link href="/watchlist">Watchlist</Link>
          <Link href="/settings">Einstellungen</Link>
        </nav>
      </div>
    </header>
  )
}
