'use client'

import { useState } from 'react'
import { useWatchlist } from '@/hooks/useWatchlist'
import { WatchlistFilterTabs } from '@/components/watchlist/WatchlistFilterTabs'
import { WatchlistItem } from '@/components/watchlist/WatchlistItem'
import { WatchlistSortSelect } from '@/components/watchlist/WatchlistSortSelect'
import { sortWatchlistEntries, type WatchlistSortOption } from '@/lib/watchlist/sort'
import type { WatchStatus } from '@/types/watchlist'

export default function WatchlistPage() {
  const { entries } = useWatchlist()
  const [filter, setFilter] = useState<WatchStatus | 'ALL'>('ALL')
  const [sort, setSort] = useState<WatchlistSortOption>('TITLE_ASC')

  const filtered = filter === 'ALL' ? entries : entries.filter((entry) => entry.status === filter)
  const sorted = sortWatchlistEntries(filtered, sort)

  return (
    <div className="space-y-6">
      <h1 className="text-h2 font-bold text-text">Meine Watchlist</h1>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <WatchlistFilterTabs value={filter} onChange={setFilter} />
        <WatchlistSortSelect value={sort} onChange={setSort} />
      </div>
      {sorted.length === 0 ? (
        <p className="text-ui text-text-muted">Keine Einträge in dieser Ansicht.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((entry) => (
            <WatchlistItem key={entry.animeId} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
