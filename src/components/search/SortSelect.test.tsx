import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SortSelect } from './SortSelect'

describe('SortSelect', () => {
  it('calls onChange with the selected sort option', async () => {
    const onChange = vi.fn()
    render(<SortSelect value="TRENDING_DESC" onChange={onChange} />)
    await userEvent.selectOptions(screen.getByLabelText('Sortierung'), 'SCORE_DESC')
    expect(onChange).toHaveBeenCalledWith('SCORE_DESC')
  })
})
