const ALLOWED_TAGS = new Set(['br', 'b', 'i', 'strong', 'em', 'p'])

export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, tagName: string) => {
      const tag = tagName.toLowerCase()
      if (!ALLOWED_TAGS.has(tag)) return ''
      const isClosing = match.startsWith('</')
      return isClosing ? `</${tag}>` : `<${tag}>`
    })
}
