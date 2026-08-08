import { describe, expect, it, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchBar } from './SearchBar'

describe('SearchBar', () => {
  it('calls onSearch with the debounced value', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const onSearch = vi.fn()
    const user = userEvent.setup({ delay: null })
    render(<SearchBar defaultValue="" onSearch={onSearch} />)

    await user.type(screen.getByLabelText('Anime suchen'), 'bocchi')
    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(onSearch).toHaveBeenLastCalledWith('bocchi')
    vi.useRealTimers()
  })
})
