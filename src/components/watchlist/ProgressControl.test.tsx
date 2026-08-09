import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProgressControl } from './ProgressControl'

describe('ProgressControl', () => {
  it('increments progress', async () => {
    const onChange = vi.fn()
    render(<ProgressControl progress={2} totalEpisodes={12} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Episode vor' }))
    expect(onChange).toHaveBeenCalledWith(3)
  })

  it('decrements progress', async () => {
    const onChange = vi.fn()
    render(<ProgressControl progress={2} totalEpisodes={12} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Episode zurück' }))
    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('does not exceed totalEpisodes', async () => {
    const onChange = vi.fn()
    render(<ProgressControl progress={12} totalEpisodes={12} onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'Episode vor' })).toBeDisabled()
  })

  it('shows the progress as a non-editable span, not an input', () => {
    render(<ProgressControl progress={3} totalEpisodes={12} onChange={vi.fn()} />)
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Episoden-Fortschritt')).toHaveTextContent('3 / 12')
  })

  it('renders a progress bar reflecting progress/totalEpisodes when total is known', () => {
    render(<ProgressControl progress={3} totalEpisodes={12} onChange={vi.fn()} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '3')
    expect(bar).toHaveAttribute('aria-valuemax', '12')
  })

  it('does not render a progress bar when totalEpisodes is unknown', () => {
    render(<ProgressControl progress={3} totalEpisodes={null} onChange={vi.fn()} />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
})
