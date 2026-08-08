import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Skeleton } from './Skeleton'

describe('Skeleton', () => {
  it('renders a loading status element', () => {
    render(<Skeleton className="h-4 w-4" />)
    expect(screen.getByRole('status', { name: 'loading' })).toBeInTheDocument()
  })
})
