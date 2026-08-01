import { useEffect, useMemo, useState } from 'react'

const inputClass = 'min-w-0 w-full rounded-lg border border-neutral-300 px-4 py-3 outline-none transition focus:border-[#007cba] focus:ring-2 focus:ring-[#007cba]/20'

export default function SearchSelect({ disabled = false, onChange, options, placeholder, value }) {
  const selectedOption = options.find((option) => option.value === value)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return options
    return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
  }, [options, query])

  useEffect(() => {
    setQuery(selectedOption?.label || '')
  }, [selectedOption?.label])

  return (
    <div className="relative">
      <input
        aria-expanded={open}
        autoComplete="off"
        className={`${inputClass} disabled:bg-neutral-100`}
        disabled={disabled}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          setQuery('')
          setOpen(true)
        }}
        placeholder={placeholder}
        role="combobox"
        value={open ? query : selectedOption?.label || ''}
      />
      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto border border-neutral-300 bg-white shadow-lg">
          {filteredOptions.length ? (
            filteredOptions.map((option) => (
              <button
                className="block w-full px-4 py-3 text-left text-sm hover:bg-[#eef8ff] focus:bg-[#eef8ff]"
                key={option.value}
                onMouseDown={(event) => {
                  event.preventDefault()
                  onChange(option.value)
                  setQuery(option.label)
                  setOpen(false)
                }}
                type="button"
              >
                {option.label}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-neutral-500">No matching option</div>
          )}
        </div>
      )}
    </div>
  )
}
