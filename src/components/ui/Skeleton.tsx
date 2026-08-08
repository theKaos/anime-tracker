import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-label="loading"
      className={cn('animate-pulse rounded-card bg-border', className)}
      {...props}
    />
  )
}
