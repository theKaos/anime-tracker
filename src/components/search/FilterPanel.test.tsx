import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterPanel } from './FilterPanel'
import { DEFAULT_FILTERS } from '@/lib/utils/searchParams'

describe('FilterPanel', () => {
  it('calls onChange when a filter is updated', async () => {
    const onChange = vi.fn()
    render(<FilterPanel filters={DEFAULT_FILTERS} onChange={onChange} />)
    await userEvent.selectOptions(screen.getByLabelText('Season'), 'FALL')
    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, season: 'FALL' })
  })

  it('clears a genre when its chip is removed', async () => {
    const onChange = vi.fn()
    render(<FilterPanel filters={{ ...DEFAULT_FILTERS, genres: ['Action'] }} onChange={onChange} />)
    await userEvent.click(screen.getByText(/Action ✕/))
    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, genres: [] })
  })
})
