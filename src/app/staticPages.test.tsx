import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HomeLoading from './loading'
import NotFound from './not-found'
import WatchlistLoading from './watchlist/loading'
import AnimeLoading from './anime/[id]/loading'
import AnimeError from './anime/[id]/error'

describe('Lade- und Fehlerseiten', () => {
  it('shows a grid of placeholders while the start page loads', () => {
    render(<HomeLoading />)
    expect(screen.getAllByRole('status')).toHaveLength(10)
  })

  it('shows list placeholders while the watchlist loads', () => {
    render(<WatchlistLoading />)
    expect(screen.getAllByRole('status')).toHaveLength(5)
  })

  it('shows one placeholder while a detail page loads', () => {
    render(<AnimeLoading />)
    expect(screen.getAllByRole('status')).toHaveLength(1)
  })

  it('tells the user a page does not exist', () => {
    render(<NotFound />)
    expect(screen.getByText('Seite nicht gefunden.')).toBeInTheDocument()
  })

  it('offers a retry when a single anime fails to load', async () => {
    const reset = vi.fn()
    render(<AnimeError error={new Error('x')} reset={reset} />)

    expect(screen.getByText('Dieser Anime konnte nicht geladen werden.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }))
    expect(reset).toHaveBeenCalledOnce()
  })
})
