import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActiveFilterChips } from './ActiveFilterChips'
import { DEFAULT_FILTERS } from '@/lib/utils/searchParams'

describe('ActiveFilterChips', () => {
  it('renders nothing when no filters are active', () => {
    const { container } = render(<ActiveFilterChips filters={DEFAULT_FILTERS} onRemove={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a chip per active filter and calls onRemove', async () => {
    const onRemove = vi.fn()
    render(
      <ActiveFilterChips
        filters={{ ...DEFAULT_FILTERS, search: 'bocchi', genres: ['Action'] }}
        onRemove={onRemove}
      />
    )
    expect(screen.getByText(/"bocchi"/)).toBeInTheDocument()
    await userEvent.click(screen.getByText(/Action/))
    expect(onRemove).toHaveBeenCalledWith('genres', 'Action')
  })
})
