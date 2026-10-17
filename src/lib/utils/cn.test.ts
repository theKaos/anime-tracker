import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('merges class names and resolves Tailwind conflicts', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('drops falsy values', () => {
    expect(cn('a', false, undefined, 'b')).toBe('a b')
  })
})

describe('cn — eigene Schriftgrößen', () => {
  it('keeps the text colour next to a custom font size', () => {
    expect(cn('text-on-accent', 'text-ui')).toBe('text-on-accent text-ui')
  })

  it('still lets a later custom font size win over an earlier one', () => {
    expect(cn('text-label', 'text-ui')).toBe('text-ui')
  })
})
