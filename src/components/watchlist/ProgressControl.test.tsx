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
})
