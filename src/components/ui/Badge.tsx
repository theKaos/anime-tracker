import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'neutral'
}

const VARIANT_CLASSES: Record<NonNullable<BadgeProps['variant']>, string> = {
  primary: 'bg-primary text-on-accent',
  secondary: 'bg-secondary text-on-accent',
  neutral: 'bg-border text-text',
}

export function Badge({ variant = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-card px-2 py-0.5 text-meta font-mono uppercase tracking-wide',
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  )
}
