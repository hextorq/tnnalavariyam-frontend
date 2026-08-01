import { Check, ChevronDown, MapPin, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { bilingualName, tamilNaduDistricts } from '../data/signup.js'

export default function SearchableDistrictSelect({
  value,
  onChange,
  required = false,
  label = 'District / மாவட்டம்',
  placeholder = 'Select District / மாவட்டத்தைத் தேர்ந்தெடுக்கவும்',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef(null)
  const searchInputRef = useRef(null)

  // Map districts to normalized search objects
  const districtItems = useMemo(() => {
    return tamilNaduDistricts.map((district) => {
      const bLabel = bilingualName(district)
      const tamilName = district.name || ''
      const englishName = district.englishName || ''
      return {
        district,
        value: district.name,
        code: district.code,
        label: bLabel,
        searchKey: `${tamilName} ${englishName} ${district.code}`.toLowerCase(),
      }
    })
  }, [])

  // Currently selected item object
  const selectedItem = useMemo(() => {
    if (!value) return null
    return districtItems.find(
      (item) => item.value === value || item.code === value || item.district.englishName?.toLowerCase() === value.toLowerCase()
    )
  }, [value, districtItems])

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return districtItems
    const q = searchQuery.toLowerCase().trim()
    return districtItems.filter((item) => item.searchKey.includes(q))
  }, [districtItems, searchQuery])

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    } else {
      setSearchQuery('')
    }
  }, [isOpen])

  function handleSelect(itemValue) {
    onChange?.(itemValue)
    setIsOpen(false)
  }

  return (
    <div className="relative grid gap-2" ref={containerRef}>
      <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
        <MapPin className="text-[#007cba]" size={15} />
        <span>{label}</span>
        {required && <span className="text-rose-500">*</span>}
      </label>

      {/* Select Trigger Box */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-4 py-3 text-left text-sm font-medium transition shadow-2xs outline-none focus:ring-2 focus:ring-[#007cba]/20 ${
          isOpen ? 'border-[#007cba] ring-2 ring-[#007cba]/20' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        {selectedItem ? (
          <span className="font-bold text-slate-900 truncate">
            {selectedItem.label}
          </span>
        ) : (
          <span className="text-slate-400 truncate">{placeholder}</span>
        )}
        <ChevronDown
          className={`shrink-0 text-slate-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#007cba]' : ''
          }`}
          size={18}
        />
      </button>

      {/* Searchable Dropdown Overlay Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-[80] mt-1.5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Search Box Header */}
          <div className="border-b border-slate-100 bg-slate-50/80 p-2.5">
            <div className="relative flex items-center">
              <Search className="absolute left-3 text-slate-400" size={16} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Tamil or English district name... / மாவட்டம் தேடுக..."
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-8 text-xs font-semibold text-slate-900 outline-none transition focus:border-[#007cba] focus:ring-2 focus:ring-[#007cba]/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] font-semibold text-slate-500">
              <span>District Search / மாவட்டத் தேடல்</span>
              <span>{filteredItems.length} found</span>
            </div>
          </div>

          {/* District Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const isSelected = selectedItem?.value === item.value
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleSelect(item.value)}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs transition ${
                      isSelected
                        ? 'bg-[#007cba] font-bold text-white shadow-xs'
                        : 'text-slate-800 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <span className="truncate">{item.label}</span>
                    {isSelected && <Check className="shrink-0 text-white" size={15} />}
                  </button>
                )
              })
            ) : (
              <div className="p-4 text-center text-xs font-semibold text-slate-500">
                No districts found matching &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
