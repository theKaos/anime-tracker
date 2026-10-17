import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorPage from './error'

const refresh = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh, push: vi.fn() }),
}))

let log: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  log = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  log.mockRestore()
  refresh.mockClear()
})

describe('Error boundary', () => {
  it('logs the error so it can be found in the server logs', () => {
    const error = new Error('kaputt')

    render(<ErrorPage error={error} reset={vi.fn()} />)

    expect(log).toHaveBeenCalledWith('[anime-tracker]', error)
  })

  it('shows the digest when Next.js provides one', () => {
    render(<ErrorPage error={Object.assign(new Error('x'), { digest: 'abc123' })} reset={vi.fn()} />)

    expect(screen.getByText('Fehler-ID: abc123')).toBeInTheDocument()
  })

  it('hides the digest line without one', () => {
    render(<ErrorPage error={new Error('x')} reset={vi.fn()} />)

    expect(screen.queryByText(/Fehler-ID/)).not.toBeInTheDocument()
  })

  it('retry refetches from the server and resets the boundary', async () => {
    const reset = vi.fn()
    render(<ErrorPage error={new Error('x')} reset={reset} />)

    await userEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }))

    expect(refresh).toHaveBeenCalledOnce()
    expect(reset).toHaveBeenCalledOnce()
  })
})
