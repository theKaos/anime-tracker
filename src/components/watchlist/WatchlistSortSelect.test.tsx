import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WatchlistSortSelect } from './WatchlistSortSelect'

describe('WatchlistSortSelect', () => {
  it('calls onChange with the selected sort option', async () => {
    const onChange = vi.fn()
    render(<WatchlistSortSelect value="TITLE_ASC" onChange={onChange} />)
    await userEvent.selectOptions(screen.getByLabelText('Watchlist sortieren'), 'PROGRESS_DESC')
    expect(onChange).toHaveBeenCalledWith('PROGRESS_DESC')
  })
})
