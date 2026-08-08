import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatusSelect } from './StatusSelect'

describe('StatusSelect', () => {
  it('calls onChange with the selected status', async () => {
    const onChange = vi.fn()
    render(<StatusSelect value="PLANNING" onChange={onChange} />)
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'WATCHING')
    expect(onChange).toHaveBeenCalledWith('WATCHING')
  })
})
