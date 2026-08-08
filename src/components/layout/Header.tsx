import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-[34px] py-4">
        <Link href="/" className="text-h2 font-bold tracking-tight text-text">
          Anime Tracker
        </Link>
        <nav className="flex items-center gap-6 font-mono text-meta uppercase tracking-wide text-text-muted">
          <Link href="/">Home</Link>
          <Link href="/watchlist">Watchlist</Link>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  )
}
