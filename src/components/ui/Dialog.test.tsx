import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dialog } from './Dialog'

describe('Dialog', () => {
  it('renders children when open', () => {
    render(
      <Dialog open onClose={vi.fn()}>
        <p>Inhalt</p>
      </Dialog>
    )
    expect(screen.getByText('Inhalt')).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    render(
      <Dialog open={false} onClose={vi.fn()}>
        <p>Inhalt</p>
      </Dialog>
    )
    expect(screen.queryByText('Inhalt')).not.toBeInTheDocument()
  })

  it('calls onClose when the backdrop is clicked', async () => {
    const onClose = vi.fn()
    render(
      <Dialog open onClose={onClose}>
        <p>Inhalt</p>
      </Dialog>
    )
    await userEvent.click(screen.getByRole('dialog').parentElement as HTMLElement)
    expect(onClose).toHaveBeenCalledOnce()
  })
})
