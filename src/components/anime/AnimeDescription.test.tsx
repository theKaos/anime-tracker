import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnimeDescription } from './AnimeDescription'

describe('AnimeDescription', () => {
  it('renders sanitized HTML', () => {
    render(<AnimeDescription description="<p>Hi</p><script>alert(1)</script>" />)
    expect(screen.getByText('Hi')).toBeInTheDocument()
    expect(document.querySelector('script')).not.toBeInTheDocument()
  })

  it('renders nothing when description is null', () => {
    const { container } = render(<AnimeDescription description={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
