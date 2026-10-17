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

describe('FilterPanel — jeder Filter meldet sich', () => {
  it('passes year, format, sort and genre changes on with the other filters intact', async () => {
    const onChange = vi.fn()
    const filters = { ...DEFAULT_FILTERS, search: 'frieren' }
    render(<FilterPanel filters={filters} onChange={onChange} />)

    await userEvent.selectOptions(screen.getByLabelText('Erscheinungsjahr'), '2020')
    expect(onChange).toHaveBeenLastCalledWith({ ...filters, year: 2020 })

    await userEvent.selectOptions(screen.getByLabelText('Format'), 'MOVIE')
    expect(onChange).toHaveBeenLastCalledWith({ ...filters, format: 'MOVIE' })

    await userEvent.selectOptions(screen.getByLabelText('Sortierung'), 'SCORE_DESC')
    expect(onChange).toHaveBeenLastCalledWith({ ...filters, sort: 'SCORE_DESC' })

    await userEvent.click(screen.getByRole('button', { name: 'Action' }))
    expect(onChange).toHaveBeenLastCalledWith({ ...filters, genres: ['Action'] })
  })
})
