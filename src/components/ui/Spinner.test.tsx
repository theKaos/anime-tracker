import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Spinner } from './Spinner'

describe('Spinner', () => {
  it('renders a loading status element', () => {
    render(<Spinner />)
    expect(screen.getByRole('status', { name: 'loading' })).toBeInTheDocument()
  })
})

describe('Spinner — Größen', () => {
  it('is smaller with size sm', () => {
    render(<Spinner size="sm" />)
    expect(screen.getByRole('status')).toHaveClass('h-4', 'w-4')
  })

  it('defaults to the medium size', () => {
    render(<Spinner className="extra" />)
    expect(screen.getByRole('status')).toHaveClass('h-6', 'w-6', 'extra')
  })
})
