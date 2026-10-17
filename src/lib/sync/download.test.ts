import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadTextFile, readFileAsText } from './download'

describe('downloadTextFile', () => {
  const createObjectURL = vi.fn(() => 'blob:mock')
  const revokeObjectURL = vi.fn()
  let click: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })
    // Verhindert, dass jsdom versucht, der Blob-URL zu folgen.
    click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    click.mockRestore()
    createObjectURL.mockClear()
    revokeObjectURL.mockClear()
  })

  it('clicks an anchor carrying the given filename', () => {
    downloadTextFile('anime-watchlist.json', '{}')

    expect(click).toHaveBeenCalledOnce()
    const anchor = click.mock.instances[0] as HTMLAnchorElement
    expect(anchor.download).toBe('anime-watchlist.json')
  })

  it('releases the object URL again', () => {
    downloadTextFile('anime-watchlist.json', '{}')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock')
  })

  it('leaves no anchor behind in the document', () => {
    downloadTextFile('anime-watchlist.json', '{}')
    expect(document.querySelectorAll('a')).toHaveLength(0)
  })
})

describe('readFileAsText', () => {
  it('reads the contents of a file', async () => {
    const file = new File(['{"app":"anime-tracker"}'], 'watchlist.json', {
      type: 'application/json',
    })
    await expect(readFileAsText(file)).resolves.toBe('{"app":"anime-tracker"}')
  })
})

describe('readFileAsText — Sonderfälle des FileReader', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  /** FileReader-Ersatz, der das gewünschte Ergebnis im nächsten Tick meldet. */
  function stubReader(outcome: { result?: unknown; error?: DOMException | null; fail?: boolean }) {
    class FakeReader {
      result: unknown = outcome.result ?? null
      error: DOMException | null = outcome.error ?? null
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      readAsText() {
        queueMicrotask(() => (outcome.fail ? this.onerror?.() : this.onload?.()))
      }
    }
    vi.stubGlobal('FileReader', FakeReader)
  }

  it('returns an empty string when the reader yields no text', async () => {
    stubReader({ result: new ArrayBuffer(4) })
    await expect(readFileAsText(new Blob(['x']))).resolves.toBe('')
  })

  it('passes the reader error through', async () => {
    const error = new DOMException('Datei weg', 'NotFoundError')
    stubReader({ fail: true, error })
    await expect(readFileAsText(new Blob(['x']))).rejects.toBe(error)
  })

  it('reports a readable error when the reader gives none', async () => {
    stubReader({ fail: true })
    await expect(readFileAsText(new Blob(['x']))).rejects.toThrow('konnte nicht gelesen werden')
  })
})
