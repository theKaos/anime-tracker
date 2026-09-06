import { describe, expect, it, vi } from 'vitest'
import {
  queryReadWritePermission,
  requestReadWritePermission,
  toPortStatus,
} from './permissions'

function fakeHandle(overrides: Partial<FileSystemFileHandle>): FileSystemFileHandle {
  return overrides as FileSystemFileHandle
}

describe('toPortStatus', () => {
  it('treats granted as connected', () => {
    expect(toPortStatus('granted')).toBe('connected')
  })

  it('treats prompt as needs-permission, never as connected', () => {
    // 'prompt' bedeutet: Handle da, Zugriff weg. Ein automatischer Request würde
    // ohne Nutzergeste scheitern — also muss die UI danach fragen.
    expect(toPortStatus('prompt')).toBe('needs-permission')
  })

  it('treats denied as needs-permission so the user can try again', () => {
    expect(toPortStatus('denied')).toBe('needs-permission')
  })
})

describe('queryReadWritePermission', () => {
  it('passes the readwrite mode through', async () => {
    const queryPermission = vi.fn().mockResolvedValue('granted')
    await queryReadWritePermission(fakeHandle({ queryPermission }))

    expect(queryPermission).toHaveBeenCalledWith({ mode: 'readwrite' })
  })

  it('reports denied when the browser throws', async () => {
    const queryPermission = vi.fn().mockRejectedValue(new Error('nope'))
    await expect(queryReadWritePermission(fakeHandle({ queryPermission }))).resolves.toBe('denied')
  })
})

describe('requestReadWritePermission', () => {
  it('returns true only for granted', async () => {
    const granted = fakeHandle({ requestPermission: vi.fn().mockResolvedValue('granted') })
    const denied = fakeHandle({ requestPermission: vi.fn().mockResolvedValue('denied') })

    await expect(requestReadWritePermission(granted)).resolves.toBe(true)
    await expect(requestReadWritePermission(denied)).resolves.toBe(false)
  })

  it('returns false when the browser rejects the request', async () => {
    const handle = fakeHandle({ requestPermission: vi.fn().mockRejectedValue(new Error('gesture')) })
    await expect(requestReadWritePermission(handle)).resolves.toBe(false)
  })
})
