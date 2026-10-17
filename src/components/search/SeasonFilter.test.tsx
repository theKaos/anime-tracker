import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SeasonFilter } from './SeasonFilter'

describe('SeasonFilter', () => {
  it('calls onChange with the selected season', async () => {
    const onChange = vi.fn()
    render(<SeasonFilter value={null} onChange={onChange} />)
    await userEvent.selectOptions(screen.getByLabelText('Season'), 'FALL')
    expect(onChange).toHaveBeenCalledWith('FALL')
  })
})

describe('SeasonFilter — zurücksetzen', () => {
  it('shows the current season and reports null for the placeholder', async () => {
    const onChange = vi.fn()
    render(<SeasonFilter value="FALL" onChange={onChange} />)

    expect(screen.getByLabelText('Season')).toHaveValue('FALL')
    await userEvent.selectOptions(screen.getByLabelText('Season'), '')
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
