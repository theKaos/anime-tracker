import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MergeSummaryDialog } from './MergeSummaryDialog'

const stats = { unchanged: 14, updated: 3, added: 2, removed: 0 }

describe('MergeSummaryDialog', () => {
  it('renders nothing without stats', () => {
    render(<MergeSummaryDialog stats={null} onClose={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows every number so nothing disappears silently', () => {
    render(<MergeSummaryDialog stats={stats} onClose={vi.fn()} />)

    expect(screen.getByTestId('merge-stat-unchanged')).toHaveTextContent('14')
    expect(screen.getByTestId('merge-stat-updated')).toHaveTextContent('3')
    expect(screen.getByTestId('merge-stat-added')).toHaveTextContent('2')
    expect(screen.getByTestId('merge-stat-removed')).toHaveTextContent('0')
  })

  it('explains removals only when something was actually removed', () => {
    const { rerender } = render(<MergeSummaryDialog stats={stats} onClose={vi.fn()} />)
    expect(screen.queryByText(/gelöscht worden/)).not.toBeInTheDocument()

    rerender(<MergeSummaryDialog stats={{ ...stats, removed: 2 }} onClose={vi.fn()} />)
    expect(screen.getByText(/gelöscht worden/)).toBeInTheDocument()
  })

  it('closes on the button', async () => {
    const onClose = vi.fn()
    render(<MergeSummaryDialog stats={stats} onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: 'Schließen' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes on Escape', async () => {
    const onClose = vi.fn()
    render(<MergeSummaryDialog stats={stats} onClose={onClose} />)

    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })
})
