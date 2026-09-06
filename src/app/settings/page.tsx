import type { Metadata } from 'next'
import { AutoSyncPanel } from '@/components/settings/AutoSyncPanel'
import { FileSyncPanel } from '@/components/settings/FileSyncPanel'

export const metadata: Metadata = {
  title: 'Einstellungen · Anime Tracker',
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-h2 font-bold text-text">Einstellungen</h1>
      <AutoSyncPanel />
      <FileSyncPanel />
    </div>
  )
}
