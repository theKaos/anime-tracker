'use client'

import { useEffect, useRef } from 'react'
import { Spinner } from '@/components/ui/Spinner'

export function InfiniteScrollTrigger({
  onIntersect,
  disabled,
}: {
  onIntersect: () => void
  disabled: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (disabled) return
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onIntersect()
      },
      { rootMargin: '200px' }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [onIntersect, disabled])

  if (disabled) return null

  return (
    <div ref={ref} className="flex justify-center py-6">
      <Spinner />
    </div>
  )
}
