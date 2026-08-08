import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from './ThemeToggle'

afterEach(() => {
  document.documentElement.classList.remove('dark')
})

describe('ThemeToggle', () => {
  it('toggles the dark class on <html> when clicked', async () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button', { name: 'Farbschema umschalten' })

    await userEvent.click(button)
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    await userEvent.click(button)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
