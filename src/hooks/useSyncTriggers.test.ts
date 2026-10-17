import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSyncTriggers } from './useSyncTriggers'

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

afterEach(() => {
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
})

describe('useSyncTriggers', () => {
  it('fires when the tab becomes visible again', () => {
    const onTrigger = vi.fn()
    renderHook(() => useSyncTriggers(onTrigger, true))

    setVisibility('visible')

    expect(onTrigger).toHaveBeenCalledTimes(1)
  })

  it('stays quiet when the tab is hidden', () => {
    const onTrigger = vi.fn()
    renderHook(() => useSyncTriggers(onTrigger, true))

    setVisibility('hidden')

    expect(onTrigger).not.toHaveBeenCalled()
  })

  it('fires when the window regains focus', () => {
    const onTrigger = vi.fn()
    renderHook(() => useSyncTriggers(onTrigger, true))

    window.dispatchEvent(new Event('focus'))

    expect(onTrigger).toHaveBeenCalledTimes(1)
  })

  it('does nothing while disabled', () => {
    const onTrigger = vi.fn()
    renderHook(() => useSyncTriggers(onTrigger, false))

    setVisibility('visible')
    window.dispatchEvent(new Event('focus'))

    expect(onTrigger).not.toHaveBeenCalled()
  })

  it('removes its listeners on unmount', () => {
    const onTrigger = vi.fn()
    const { unmount } = renderHook(() => useSyncTriggers(onTrigger, true))

    unmount()
    setVisibility('visible')
    window.dispatchEvent(new Event('focus'))

    expect(onTrigger).not.toHaveBeenCalled()
  })
})
