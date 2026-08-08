import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormatFilter } from './FormatFilter'

describe('FormatFilter', () => {
  it('calls onChange with the selected format', async () => {
    const onChange = vi.fn()
    render(<FormatFilter value={null} onChange={onChange} />)
    await userEvent.selectOptions(screen.getByLabelText('Format'), 'MOVIE')
    expect(onChange).toHaveBeenCalledWith('MOVIE')
  })
})
