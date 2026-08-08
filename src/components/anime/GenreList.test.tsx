import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GenreList } from './GenreList'

describe('GenreList', () => {
  it('renders each genre as a badge', () => {
    render(<GenreList genres={['Action', 'Drama']} />)
    expect(screen.getByText('Action')).toBeInTheDocument()
    expect(screen.getByText('Drama')).toBeInTheDocument()
  })

  it('renders nothing for an empty list', () => {
    const { container } = render(<GenreList genres={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
