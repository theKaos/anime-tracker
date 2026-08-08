import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 10 }).map((_, index) => (
        <Skeleton key={index} className="aspect-[2/3] w-full" />
      ))}
    </div>
  )
}
