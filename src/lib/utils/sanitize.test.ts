import { describe, expect, it } from 'vitest'
import { sanitizeHtml } from './sanitize'

describe('sanitizeHtml', () => {
  it('strips script tags and their content', () => {
    expect(sanitizeHtml('<p>Hi</p><script>alert(1)</script>')).toBe('<p>Hi</p>')
  })

  it('strips attributes from allowed tags', () => {
    expect(sanitizeHtml('<b onclick="evil()">Hi</b>')).toBe('<b>Hi</b>')
  })

  it('removes disallowed tags but keeps their text', () => {
    expect(sanitizeHtml('<div>Hello</div>')).toBe('Hello')
  })

  it('keeps allowed tags without attributes', () => {
    expect(sanitizeHtml('Line1<br>Line2')).toBe('Line1<br>Line2')
  })
})
