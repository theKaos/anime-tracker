import { Badge } from '@/components/ui/Badge'

export function GenreList({ genres }: { genres: string[] }) {
  if (genres.length === 0) return null
  return (
    <ul className="flex flex-wrap gap-2">
      {genres.map((genre) => (
        <li key={genre}>
          <Badge variant="secondary">{genre}</Badge>
        </li>
      ))}
    </ul>
  )
}
