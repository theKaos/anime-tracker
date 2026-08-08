import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Spinner } from './Spinner'

describe('Spinner', () => {
  it('renders a loading status element', () => {
    render(<Spinner />)
    expect(screen.getByRole('status', { name: 'loading' })).toBeInTheDocument()
  })
})
