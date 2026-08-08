import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { InfiniteScrollTrigger } from './InfiniteScrollTrigger'

describe('InfiniteScrollTrigger', () => {
  it('calls onIntersect when the element intersects', () => {
    let capturedCallback: IntersectionObserverCallback = () => {}
    class MockObserver {
      constructor(callback: IntersectionObserverCallback) {
        capturedCallback = callback
      }
      observe = vi.fn()
      disconnect = vi.fn()
    }
    // @ts-expect-error test stub
    global.IntersectionObserver = MockObserver

    const onIntersect = vi.fn()
    render(<InfiniteScrollTrigger onIntersect={onIntersect} disabled={false} />)

    capturedCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
    expect(onIntersect).toHaveBeenCalledOnce()
  })

  it('renders nothing when disabled', () => {
    const { container } = render(<InfiniteScrollTrigger onIntersect={vi.fn()} disabled />)
    expect(container).toBeEmptyDOMElement()
  })

  it('does not show the spinner when not actively loading', () => {
    const { queryByRole } = render(
      <InfiniteScrollTrigger onIntersect={vi.fn()} disabled={false} isLoading={false} />
    )
    expect(queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows the spinner while loading', () => {
    const { getByRole } = render(
      <InfiniteScrollTrigger onIntersect={vi.fn()} disabled={false} isLoading />
    )
    expect(getByRole('status')).toBeInTheDocument()
  })
})
