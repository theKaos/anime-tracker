import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ManualTransferButtons } from './ManualTransferButtons'

describe('ManualTransferButtons', () => {
  it('reports an export request', async () => {
    const onExport = vi.fn()
    render(<ManualTransferButtons onExport={onExport} onFileSelected={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Watchlist exportieren' }))
    expect(onExport).toHaveBeenCalledOnce()
  })

  it('hands over the chosen file', async () => {
    const onFileSelected = vi.fn()
    render(<ManualTransferButtons onExport={vi.fn()} onFileSelected={onFileSelected} />)

    const file = new File(['{}'], 'watchlist.json', { type: 'application/json' })
    await userEvent.upload(screen.getByLabelText('Watchlist-Datei auswählen'), file)

    expect(onFileSelected).toHaveBeenCalledWith(file)
  })

  it('clears the input so the same file can be picked twice', async () => {
    const onFileSelected = vi.fn()
    render(<ManualTransferButtons onExport={vi.fn()} onFileSelected={onFileSelected} />)

    const input = screen.getByLabelText('Watchlist-Datei auswählen') as HTMLInputElement
    const file = new File(['{}'], 'watchlist.json', { type: 'application/json' })

    await userEvent.upload(input, file)
    await userEvent.upload(input, file)

    expect(onFileSelected).toHaveBeenCalledTimes(2)
  })

  it('can disable the export while the watchlist is not loaded yet', () => {
    render(<ManualTransferButtons onExport={vi.fn()} onFileSelected={vi.fn()} exportDisabled />)
    expect(screen.getByRole('button', { name: 'Watchlist exportieren' })).toBeDisabled()
  })
})

describe('ManualTransferButtons — Import-Knopf', () => {
  it('opens the hidden file input', async () => {
    render(<ManualTransferButtons onExport={vi.fn()} onFileSelected={vi.fn()} />)
    const input = screen.getByLabelText('Watchlist-Datei auswählen') as HTMLInputElement
    const click = vi.spyOn(input, 'click')

    await userEvent.click(screen.getByRole('button', { name: 'Datei importieren' }))

    expect(click).toHaveBeenCalledOnce()
  })
})
