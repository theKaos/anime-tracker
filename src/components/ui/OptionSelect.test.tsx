import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OptionSelect } from './OptionSelect'

const options = [
  { value: 'A', label: 'Option A' },
  { value: 'B', label: 'Option B' },
]

describe('OptionSelect', () => {
  it('renders a placeholder and every option', () => {
    render(<OptionSelect ariaLabel="Test" value="" onChange={vi.fn()} options={options} placeholder="Bitte wählen" />)
    expect(screen.getByRole('option', { name: 'Bitte wählen' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Option A' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Option B' })).toBeInTheDocument()
  })

  it('omits the placeholder option when none is given', () => {
    render(<OptionSelect ariaLabel="Test" value="A" onChange={vi.fn()} options={options} />)
    expect(screen.getAllByRole('option')).toHaveLength(2)
  })

  it('calls onChange with the selected value', async () => {
    const onChange = vi.fn()
    render(<OptionSelect ariaLabel="Test" value="A" onChange={onChange} options={options} />)
    await userEvent.selectOptions(screen.getByLabelText('Test'), 'B')
    expect(onChange).toHaveBeenCalledWith('B')
  })
})
