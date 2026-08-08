import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Select } from './Select'

describe('Select', () => {
  it('renders provided options', () => {
    render(
      <Select aria-label="Format">
        <option value="TV">TV</option>
      </Select>
    )
    expect(screen.getByLabelText('Format')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'TV' })).toBeInTheDocument()
  })
})
