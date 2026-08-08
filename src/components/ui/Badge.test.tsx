import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'

describe('Badge', () => {
  it('renders content with the requested variant', () => {
    render(<Badge variant="secondary">Neu</Badge>)
    expect(screen.getByText('Neu')).toHaveClass('bg-secondary')
  })
})
