import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FileSyncProvider } from '@/context/FileSyncProvider'
import { createMemorySyncPort } from '@/test/utils/memorySyncPort'
import SettingsPage, { metadata } from './page'

describe('SettingsPage', () => {
  it('shows both ways to move the watchlist between devices', async () => {
    render(
      <FileSyncProvider port={createMemorySyncPort()}>
        <SettingsPage />
      </FileSyncProvider>
    )

    expect(screen.getByRole('heading', { name: 'Einstellungen', level: 1 })).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: 'Vorhandene Datei auswählen' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Watchlist exportieren' })).toBeInTheDocument()
  })

  it('has its own page title', () => {
    expect(metadata.title).toBe('Einstellungen · Anime Tracker')
  })
})
