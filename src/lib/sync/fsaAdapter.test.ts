import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WATCHLIST_FILE_NAME } from '@/constants/config'
import { createFsaPort } from './fsaAdapter'

/**
 * jsdom kennt File System Access nicht. Die Picker hängen wir deshalb selbst an
 * `window`, und das Handle ist ein Fake mit genau den Methoden, die der Adapter
 * benutzt. Der Handle-Speicher wird ersetzt: Ein Fake mit Funktionen ist nicht
 * strukturiert klonbar und käme durch IndexedDB nicht hindurch.
 */
const stored = vi.hoisted(() => ({ handle: null as FileSystemFileHandle | null }))

vi.mock('./fileHandleStore', () => ({
  saveFileHandle: vi.fn(async (handle: FileSystemFileHandle) => {
    stored.handle = handle
  }),
  loadFileHandle: vi.fn(async () => stored.handle),
  clearFileHandle: vi.fn(async () => {
    stored.handle = null
  }),
}))

interface FakeHandle {
  handle: FileSystemFileHandle
  written: string[]
  closed: () => boolean
}

function fakeHandle({
  query = 'granted',
  request = 'granted',
  text = '{"app":"anime-tracker"}',
  lastModified = 1234,
}: {
  query?: PermissionState
  request?: PermissionState
  text?: string
  lastModified?: number
} = {}): FakeHandle {
  const written: string[] = []
  let closed = false
  const handle = {
    name: WATCHLIST_FILE_NAME,
    kind: 'file',
    queryPermission: vi.fn(async () => query),
    requestPermission: vi.fn(async () => request),
    getFile: vi.fn(async () => ({ text: async () => text, lastModified })),
    createWritable: vi.fn(async () => ({
      write: vi.fn(async (chunk: string) => {
        written.push(chunk)
      }),
      close: vi.fn(async () => {
        closed = true
      }),
    })),
  } as unknown as FileSystemFileHandle
  return { handle, written, closed: () => closed }
}

const abort = () => new DOMException('Der Nutzer hat abgebrochen.', 'AbortError')

type PickerWindow = Window & {
  showOpenFilePicker?: unknown
  showSaveFilePicker?: unknown
}

function installPickers({
  open,
  save,
}: {
  open?: () => Promise<FileSystemFileHandle[]>
  save?: () => Promise<FileSystemFileHandle>
}) {
  const w = window as PickerWindow
  if (open) w.showOpenFilePicker = vi.fn(open)
  if (save) w.showSaveFilePicker = vi.fn(save)
}

beforeEach(() => {
  stored.handle = null
})

afterEach(() => {
  const w = window as PickerWindow
  delete w.showOpenFilePicker
  delete w.showSaveFilePicker
})

describe('createFsaPort — Unterstützung', () => {
  it('reports itself as fsa', () => {
    expect(createFsaPort().kind).toBe('fsa')
  })

  it('is unsupported when the browser has no open picker', async () => {
    const port = createFsaPort()

    expect(port.isSupported()).toBe(false)
    expect(port.canCreate()).toBe(false)
    await expect(port.getStatus()).resolves.toBe('unsupported')
  })

  it('distinguishes opening from creating — Android hat oft nur den Öffnen-Dialog', () => {
    installPickers({ open: async () => [] })
    const port = createFsaPort()

    expect(port.isSupported()).toBe(true)
    expect(port.canCreate()).toBe(false)
  })

  it('can create when the save picker exists', () => {
    installPickers({ open: async () => [], save: async () => fakeHandle().handle })

    expect(createFsaPort().canCreate()).toBe(true)
  })

  it('ignores a stored handle when the API is gone', async () => {
    stored.handle = fakeHandle().handle
    const port = createFsaPort()

    await expect(port.read()).resolves.toBeNull()
    await expect(port.requestPermission()).resolves.toBe(false)
  })
})

describe('createFsaPort — vorhandene Datei öffnen', () => {
  it('connects and asks for write access right away', async () => {
    const file = fakeHandle()
    installPickers({ open: async () => [file.handle] })

    await expect(createFsaPort().connect('open')).resolves.toBe('connected')
    expect(file.handle.requestPermission).toHaveBeenCalledWith({ mode: 'readwrite' })
    expect(stored.handle).toBe(file.handle)
  })

  it('remembers the handle even if write access is denied', async () => {
    const file = fakeHandle({ request: 'denied' })
    installPickers({ open: async () => [file.handle] })

    await expect(createFsaPort().connect('open')).resolves.toBe('permission-denied')
    expect(stored.handle).toBe(file.handle)
  })

  it('treats a closed dialog as cancelled, not as an error', async () => {
    installPickers({
      open: async () => {
        throw abort()
      },
    })

    await expect(createFsaPort().connect('open')).resolves.toBe('cancelled')
    expect(stored.handle).toBeNull()
  })

  it('rethrows every other picker failure', async () => {
    const failure = new DOMException('Blockiert', 'SecurityError')
    installPickers({
      open: async () => {
        throw failure
      },
    })

    await expect(createFsaPort().connect('open')).rejects.toBe(failure)
  })
})

describe('createFsaPort — neue Datei anlegen', () => {
  it('suggests the default file name and connects', async () => {
    const file = fakeHandle()
    installPickers({ open: async () => [], save: async () => file.handle })
    const port = createFsaPort()

    await expect(port.connect('create')).resolves.toBe('connected')
    expect(window.showSaveFilePicker).toHaveBeenCalledWith(
      expect.objectContaining({ suggestedName: WATCHLIST_FILE_NAME })
    )
    expect(stored.handle).toBe(file.handle)
  })

  it('treats a closed save dialog as cancelled', async () => {
    installPickers({
      save: async () => {
        throw abort()
      },
    })

    await expect(createFsaPort().connect('create')).resolves.toBe('cancelled')
  })

  it('rethrows every other save picker failure', async () => {
    installPickers({
      save: async () => {
        throw new TypeError('kaputt')
      },
    })

    await expect(createFsaPort().connect('create')).rejects.toThrow('kaputt')
  })
})

describe('createFsaPort — Status und Berechtigung', () => {
  beforeEach(() => {
    installPickers({ open: async () => [] })
  })

  it('is disconnected without a stored handle', async () => {
    await expect(createFsaPort().getStatus()).resolves.toBe('disconnected')
  })

  it('is connected when the permission survived', async () => {
    stored.handle = fakeHandle({ query: 'granted' }).handle

    await expect(createFsaPort().getStatus()).resolves.toBe('connected')
  })

  it('needs permission after a browser restart', async () => {
    stored.handle = fakeHandle({ query: 'prompt' }).handle

    await expect(createFsaPort().getStatus()).resolves.toBe('needs-permission')
  })

  it('cannot request permission without a handle', async () => {
    await expect(createFsaPort().requestPermission()).resolves.toBe(false)
  })

  it('passes the permission answer through', async () => {
    stored.handle = fakeHandle({ request: 'granted' }).handle
    await expect(createFsaPort().requestPermission()).resolves.toBe(true)

    stored.handle = fakeHandle({ request: 'denied' }).handle
    await expect(createFsaPort().requestPermission()).resolves.toBe(false)
  })

  it('disconnect forgets the handle', async () => {
    stored.handle = fakeHandle().handle
    const port = createFsaPort()

    await port.disconnect()

    expect(stored.handle).toBeNull()
    await expect(port.getStatus()).resolves.toBe('disconnected')
  })
})

describe('createFsaPort — lesen und schreiben', () => {
  beforeEach(() => {
    installPickers({ open: async () => [] })
  })

  it('reads nothing without a connected file', async () => {
    await expect(createFsaPort().read()).resolves.toBeNull()
  })

  it('reads text and modification time', async () => {
    stored.handle = fakeHandle({ text: '{"x":1}', lastModified: 42 }).handle

    await expect(createFsaPort().read()).resolves.toEqual({ text: '{"x":1}', lastModified: 42 })
  })

  it('refuses to write without a connected file', async () => {
    await expect(createFsaPort().write('{}')).rejects.toThrow('keine Watchlist-Datei')
  })

  it('writes the text and closes the stream so the file is committed', async () => {
    const file = fakeHandle()
    stored.handle = file.handle

    await createFsaPort().write('{"neu":true}')

    expect(file.written).toEqual(['{"neu":true}'])
    expect(file.closed()).toBe(true)
  })
})
