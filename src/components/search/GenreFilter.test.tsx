import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GenreFilter } from './GenreFilter'

describe('GenreFilter', () => {
  it('adds a genre when toggled on', async () => {
    const onChange = vi.fn()
    render(<GenreFilter value={[]} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Action' }))
    expect(onChange).toHaveBeenCalledWith(['Action'])
  })

  it('removes a genre when toggled off', async () => {
    const onChange = vi.fn()
    render(<GenreFilter value={['Action']} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Action' }))
    expect(onChange).toHaveBeenCalledWith([])
  })
})
