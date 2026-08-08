'use client'

import { useState } from 'react'
import { useWatchlist } from '@/hooks/useWatchlist'
import { WatchlistFilterTabs } from '@/components/watchlist/WatchlistFilterTabs'
import { WatchlistItem } from '@/components/watchlist/WatchlistItem'
import type { WatchStatus } from '@/types/watchlist'

export default function WatchlistPage() {
  const { entries } = useWatchlist()
  const [filter, setFilter] = useState<WatchStatus | 'ALL'>('ALL')

  const filtered = filter === 'ALL' ? entries : entries.filter((entry) => entry.status === filter)

  return (
    <div className="space-y-6">
      <h1 className="text-h2 font-bold text-text">Meine Watchlist</h1>
      <WatchlistFilterTabs value={filter} onChange={setFilter} />
      {filtered.length === 0 ? (
        <p className="text-ui text-text-muted">Keine Einträge in dieser Ansicht.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <WatchlistItem key={entry.animeId} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
