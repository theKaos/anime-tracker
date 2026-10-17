import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YearFilter } from './YearFilter'

describe('YearFilter', () => {
  it('calls onChange with the selected year', async () => {
    const onChange = vi.fn()
    render(<YearFilter value={null} onChange={onChange} />)
    await userEvent.selectOptions(screen.getByLabelText('Erscheinungsjahr'), '2020')
    expect(onChange).toHaveBeenCalledWith(2020)
  })
})

describe('YearFilter — zurücksetzen', () => {
  it('shows the current year and reports null for the placeholder', async () => {
    const onChange = vi.fn()
    render(<YearFilter value={2020} onChange={onChange} />)

    expect(screen.getByLabelText('Erscheinungsjahr')).toHaveValue('2020')
    await userEvent.selectOptions(screen.getByLabelText('Erscheinungsjahr'), '')
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
