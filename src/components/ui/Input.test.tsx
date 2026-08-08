import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Input } from './Input'

describe('Input', () => {
  it('renders and accepts a value', () => {
    render(<Input aria-label="Suche" defaultValue="bocchi" />)
    expect(screen.getByLabelText('Suche')).toHaveValue('bocchi')
  })
})
