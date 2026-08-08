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
