import { Select } from './Select'

export interface OptionSelectOption {
  value: string
  label: string
}

export function OptionSelect({
  ariaLabel,
  value,
  onChange,
  options,
  placeholder,
}: {
  ariaLabel: string
  value: string
  onChange: (value: string) => void
  options: OptionSelectOption[]
  placeholder?: string
}) {
  return (
    <Select aria-label={ariaLabel} value={value} onChange={(event) => onChange(event.target.value)}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  )
}
