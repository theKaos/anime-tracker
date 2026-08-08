import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'rounded-card border border-border bg-surface px-3 py-2 text-ui text-text outline-none focus:ring-2 focus:ring-secondary',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'
