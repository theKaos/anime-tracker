'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { useDebounce } from '@/hooks/useDebounce'
import { DEBOUNCE_MS } from '@/constants/config'

export function SearchBar({
  defaultValue,
  onSearch,
}: {
  defaultValue: string
  onSearch: (value: string) => void
}) {
  const [value, setValue] = useState(defaultValue)
  const debounced = useDebounce(value, DEBOUNCE_MS)

  useEffect(() => {
    onSearch(debounced)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  return (
    <Input
      type="search"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder="Anime suchen…"
      aria-label="Anime suchen"
    />
  )
}
