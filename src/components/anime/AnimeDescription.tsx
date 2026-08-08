import { sanitizeHtml } from '@/lib/utils/sanitize'

export function AnimeDescription({ description }: { description: string | null }) {
  if (!description) return null
  return (
    <div
      className="space-y-3 text-body leading-relaxed text-text"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }}
    />
  )
}
