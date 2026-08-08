import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WatchlistFilterTabs } from './WatchlistFilterTabs'

describe('WatchlistFilterTabs', () => {
  it('calls onChange with the selected tab', async () => {
    const onChange = vi.fn()
    render(<WatchlistFilterTabs value="ALL" onChange={onChange} />)
    await userEvent.click(screen.getByRole('tab', { name: 'Schaue ich' }))
    expect(onChange).toHaveBeenCalledWith('WATCHING')
  })
})
