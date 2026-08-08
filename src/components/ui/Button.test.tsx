import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renders children and handles click', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Klick mich</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Klick mich' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('applies the primary variant by default', () => {
    render(<Button>Test</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-primary')
  })
})
