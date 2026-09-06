import { Badge } from '@/components/ui/Badge'

export function GenreList({ genres, limit }: { genres: string[]; limit?: number }) {
  if (genres.length === 0) return null
  const visible = limit ? genres.slice(0, limit) : genres
  return (
    <ul className="flex flex-wrap gap-2">
      {visible.map((genre) => (
        <li key={genre}>
          <Badge variant="secondary">{genre}</Badge>
        </li>
      ))}
    </ul>
  )
}
