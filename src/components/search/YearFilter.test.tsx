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
