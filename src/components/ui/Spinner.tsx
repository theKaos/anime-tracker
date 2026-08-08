import { cn } from '@/lib/utils/cn'

export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md'; className?: string }) {
  const dimension = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6'
  return (
    <div
      role="status"
      aria-label="loading"
      className={cn('animate-spin rounded-full border-2 border-border border-t-primary', dimension, className)}
    />
  )
}
