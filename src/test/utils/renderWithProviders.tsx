import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { WatchlistProvider } from '@/context/WatchlistProvider'

function AllProviders({ children }: { children: ReactNode }) {
  return <WatchlistProvider>{children}</WatchlistProvider>
}

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options })
}

export * from '@testing-library/react'
