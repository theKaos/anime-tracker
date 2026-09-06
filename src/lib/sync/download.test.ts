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
