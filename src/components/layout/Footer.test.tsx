import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Footer } from './Footer'

describe('Footer', () => {
  it('renders attribution text', () => {
    render(<Footer />)
    expect(screen.getByText(/AniList/)).toBeInTheDocument()
  })
})
