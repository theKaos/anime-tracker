import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Dialog } from './Dialog'

function Harness({ withButtons = true }: { withButtons?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Öffnen</button>
      <Dialog open={open} title="Testdialog" onClose={() => setOpen(false)}>
        {withButtons ? (
          <>
            <button>Erster</button>
            <button disabled>Gesperrt</button>
            <button onClick={() => setOpen(false)}>Letzter</button>
          </>
        ) : (
          <p>Nur Text</p>
        )}
      </Dialog>
    </>
  )
}

describe('Dialog — Fokus', () => {
  it('moves focus to the first control when it opens', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Öffnen' }))

    expect(screen.getByRole('button', { name: 'Erster' })).toHaveFocus()
  })

  it('wraps Tab from the last control to the first, skipping disabled ones', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Öffnen' }))

    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Letzter' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Erster' })).toHaveFocus()
  })

  it('wraps Shift+Tab from the first control to the last', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Öffnen' }))

    await userEvent.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Letzter' })).toHaveFocus()
  })

  it('focuses the dialog itself when it has nothing focusable, and keeps it there', async () => {
    render(<Harness withButtons={false} />)
    await userEvent.click(screen.getByRole('button', { name: 'Öffnen' }))

    const dialog = screen.getByRole('dialog', { name: 'Testdialog' })
    expect(dialog).toHaveFocus()
    await userEvent.tab()
    expect(dialog).toHaveFocus()
  })

  it('returns focus to the opener when it closes', async () => {
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Öffnen' })
    await userEvent.click(opener)

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })

  it('ignores other keys', async () => {
    const onClose = vi.fn()
    render(
      <Dialog open title="Testdialog" onClose={onClose}>
        <button>Einzig</button>
      </Dialog>
    )

    await userEvent.keyboard('a')

    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Einzig' })).toHaveFocus()
  })
})
