import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Search, X } from 'lucide-react'

export interface CustomSelectOption {
  value: string
  label: string
  description?: string
  badge?: string
  dotClassName?: string
  disabled?: boolean
}

interface CustomSelectProps {
  id?: string
  value: string
  onChange: (value: string) => void
  options: CustomSelectOption[]
  placeholder?: string
  disabled?: boolean
  required?: boolean
  variant?: 'light' | 'dark'
  size?: 'sm' | 'md'
  searchable?: boolean
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  ariaLabel?: string
}

interface MenuPosition {
  left: number
  width: number
  top?: number
  bottom?: number
  maxHeight: number
  placement: 'bottom' | 'top'
}

export function CustomSelect({
  id,
  value,
  onChange,
  options,
  placeholder = '-- Pilih --',
  disabled = false,
  required = false,
  variant = 'light',
  size = 'md',
  searchable,
  searchPlaceholder = 'Cari pilihan...',
  emptyMessage = 'Pilihan tidak ditemukan',
  className = '',
  ariaLabel,
}: CustomSelectProps) {
  const autoId = useId()
  const triggerId = id ?? `custom-select-${autoId}`
  const listboxId = `${triggerId}-listbox`

  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)

  const isSearchEnabled = searchable ?? options.length >= 7
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  )

  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q || !isSearchEnabled) return options
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.description?.toLowerCase().includes(q) ?? false) ||
        (opt.badge?.toLowerCase().includes(q) ?? false)
    )
  }, [options, searchQuery, isSearchEnabled])

  const computePosition = useCallback((): MenuPosition | null => {
    const trigger = triggerRef.current
    if (!trigger) return null
    const rect = trigger.getBoundingClientRect()
    const viewportW = window.innerWidth
    const viewportH = window.innerHeight
    const spaceBelow = viewportH - rect.bottom - 12
    const spaceAbove = rect.top - 12
    const width = Math.min(Math.max(rect.width, 200), viewportW - 24)
    const left = Math.max(12, Math.min(rect.left, viewportW - width - 12))
    const openAbove = spaceBelow < 210 && spaceAbove > spaceBelow

    if (openAbove) {
      return {
        left,
        width,
        bottom: viewportH - rect.top + 6,
        maxHeight: Math.min(310, Math.max(140, spaceAbove)),
        placement: 'top',
      }
    }

    return {
      left,
      width,
      top: rect.bottom + 6,
      maxHeight: Math.min(310, Math.max(140, spaceBelow)),
      placement: 'bottom',
    }
  }, [])

  const closeMenu = useCallback(() => {
    setIsOpen(false)
    setSearchQuery('')
  }, [])

  const openMenu = useCallback(() => {
    if (disabled) return
    const pos = computePosition()
    setMenuPosition(pos)
    setSearchQuery('')
    const selectedIdx = options.findIndex(
      (opt) => opt.value === value && !opt.disabled
    )
    const firstEnabledIdx = options.findIndex((opt) => !opt.disabled)
    setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : Math.max(0, firstEnabledIdx))
    setIsOpen(true)
  }, [computePosition, disabled, options, value])

  const selectValue = useCallback(
    (nextValue: string) => {
      onChange(nextValue)
      closeMenu()
      triggerRef.current?.focus()
    },
    [closeMenu, onChange]
  )

  // Keep menu anchored cleanly on resize/scroll and handle outside clicks + Escape
  useEffect(() => {
    if (!isOpen) return

    const handleReposition = () => {
      const pos = computePosition()
      if (pos) setMenuPosition(pos)
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return
      }
      closeMenu()
    }

    const handleKeyDownCapture = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        closeMenu()
        triggerRef.current?.focus()
      }
    }

    const rafId = window.requestAnimationFrame(() => {
      handleReposition()
      if (isSearchEnabled) {
        searchInputRef.current?.focus()
      }
    })

    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition, true)
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDownCapture, true)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDownCapture, true)
    }
  }, [closeMenu, computePosition, isOpen, isSearchEnabled])

  const moveHighlight = (delta: number) => {
    if (filteredOptions.length === 0) return
    let idx = highlightedIndex
    for (let step = 0; step < filteredOptions.length; step++) {
      idx = (idx + delta + filteredOptions.length) % filteredOptions.length
      if (!filteredOptions[idx]?.disabled) {
        setHighlightedIndex(idx)
        return
      }
    }
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (disabled) return

    if (!isOpen) {
      if (
        event.key === 'ArrowDown' ||
        event.key === 'ArrowUp' ||
        event.key === 'Enter' ||
        event.key === ' '
      ) {
        event.preventDefault()
        openMenu()
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveHighlight(1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveHighlight(-1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      const first = filteredOptions.findIndex((o) => !o.disabled)
      if (first >= 0) setHighlightedIndex(first)
    } else if (event.key === 'End') {
      event.preventDefault()
      for (let i = filteredOptions.length - 1; i >= 0; i--) {
        if (!filteredOptions[i].disabled) {
          setHighlightedIndex(i)
          break
        }
      }
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const candidate = filteredOptions[highlightedIndex]
      if (candidate && !candidate.disabled) {
        selectValue(candidate.value)
      }
    } else if (event.key === 'Tab') {
      closeMenu()
    }
  }

  const isDark = variant === 'dark'
  const heightClass = size === 'sm' ? 'h-10 text-xs' : 'h-11 text-sm'

  const triggerClasses = isDark
    ? `${heightClass} w-full flex items-center justify-between gap-2 rounded-xl border px-3 text-left font-medium transition-all ${
        disabled
          ? 'cursor-not-allowed border-white/10 bg-[#072938]/60 text-slate-400'
          : isOpen
            ? 'border-[#38bdf8] bg-[#072938] text-white ring-2 ring-[#38bdf8]/25'
            : 'border-white/15 bg-[#072938] text-white hover:border-white/30'
      }`
    : `${heightClass} w-full flex items-center justify-between gap-2 rounded-xl border px-3.5 text-left transition-all ${
        disabled
          ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500'
          : isOpen
            ? 'border-[#2563eb] bg-white text-slate-900 shadow-sm ring-2 ring-[#2563eb]/20'
            : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400'
      }`

  return (
    <div className={`relative ${className}`}>
      {/* Native form required bridge without rendering OS select popup */}
      {required && !disabled && (
        <input
          type="text"
          tabIndex={-1}
          aria-hidden="true"
          required
          value={value}
          onChange={() => {}}
          onInvalid={(e) => {
            e.preventDefault()
            triggerRef.current?.focus()
            if (!isOpen) openMenu()
          }}
          className="pointer-events-none absolute inset-x-4 bottom-0 h-0 w-px opacity-0"
        />
      )}

      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        disabled={disabled}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={isOpen ? listboxId : undefined}
        aria-label={ariaLabel}
        onClick={() => (isOpen ? closeMenu() : openMenu())}
        onKeyDown={handleKeyDown}
        className={triggerClasses}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {selectedOption?.dotClassName && (
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${selectedOption.dotClassName}`}
              aria-hidden="true"
            />
          )}
          <span
            className={`truncate ${
              selectedOption
                ? isDark
                  ? 'text-white'
                  : 'text-slate-900'
                : isDark
                  ? 'text-slate-300'
                  : 'text-slate-400'
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          } ${
            isDark
              ? isOpen
                ? 'text-sky-300'
                : 'text-slate-300'
              : isOpen
                ? 'text-[#2563eb]'
                : 'text-slate-400'
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen &&
        menuPosition &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              left: menuPosition.left,
              width: menuPosition.width,
              top: menuPosition.top,
              bottom: menuPosition.bottom,
              zIndex: 120,
            }}
            onKeyDown={handleKeyDown}
            className={`overflow-hidden rounded-2xl border shadow-[0_20px_45px_-12px_rgba(10,54,73,0.28)] ${
              isDark
                ? 'border-white/15 bg-[#072938] text-white'
                : 'border-slate-200/90 bg-white text-slate-900 ring-1 ring-slate-900/5'
            }`}
          >
            {isSearchEnabled && (
              <div
                className={`border-b p-2 ${
                  isDark
                    ? 'border-white/10 bg-[#06222f]'
                    : 'border-slate-100 bg-slate-50/80'
                }`}
              >
                <div className="relative flex items-center">
                  <Search
                    className={`pointer-events-none absolute left-2.5 h-3.5 w-3.5 ${
                      isDark ? 'text-slate-400' : 'text-slate-400'
                    }`}
                    aria-hidden="true"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setHighlightedIndex(0)
                    }}
                    placeholder={searchPlaceholder}
                    className={`h-9 w-full rounded-xl border pl-8 pr-7 text-xs focus:outline-none ${
                      isDark
                        ? 'border-white/15 bg-[#0a3649] text-white placeholder:text-slate-400 focus:border-[#38bdf8]'
                        : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-[#2563eb]'
                    }`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('')
                        setHighlightedIndex(0)
                        searchInputRef.current?.focus()
                      }}
                      aria-label="Hapus pencarian"
                      className={`absolute right-2 rounded p-0.5 ${
                        isDark
                          ? 'text-slate-300 hover:text-white'
                          : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <ul
              id={listboxId}
              role="listbox"
              aria-labelledby={triggerId}
              style={{
                maxHeight: Math.max(
                  110,
                  menuPosition.maxHeight - (isSearchEnabled ? 54 : 0)
                ),
              }}
              className="overflow-y-auto p-1.5 space-y-0.5"
            >
              {filteredOptions.length === 0 ? (
                <li
                  className={`px-3 py-4 text-center text-xs ${
                    isDark ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {emptyMessage}
                </li>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = opt.value === value
                  const isHighlighted = idx === highlightedIndex

                  return (
                    <li
                      key={`${opt.value}-${idx}`}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={opt.disabled}
                      onMouseEnter={() => {
                        if (!opt.disabled) setHighlightedIndex(idx)
                      }}
                      onClick={() => {
                        if (!opt.disabled) selectValue(opt.value)
                      }}
                      className={`flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs transition-colors ${
                        opt.disabled
                          ? isDark
                            ? 'cursor-not-allowed text-slate-500 opacity-60'
                            : 'cursor-not-allowed text-slate-400 opacity-60'
                          : isSelected
                            ? isDark
                              ? 'cursor-pointer bg-[#2563eb] font-semibold text-white'
                              : 'cursor-pointer bg-blue-50 font-semibold text-[#1d4ed8]'
                            : isHighlighted
                              ? isDark
                                ? 'cursor-pointer bg-white/10 text-white'
                                : 'cursor-pointer bg-slate-100 text-slate-900'
                              : isDark
                                ? 'cursor-pointer text-slate-100 hover:bg-white/10'
                                : 'cursor-pointer text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex min-w-0 flex-1 items-start gap-2">
                        {opt.dotClassName && (
                          <span
                            className={`mt-1 h-2 w-2 shrink-0 rounded-full ${opt.dotClassName}`}
                            aria-hidden="true"
                          />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] leading-snug">
                            {opt.label}
                          </span>
                          {opt.description && (
                            <span
                              className={`mt-0.5 block truncate text-[11px] font-normal ${
                                isSelected
                                  ? isDark
                                    ? 'text-blue-100'
                                    : 'text-[#2563eb]/80'
                                  : isDark
                                    ? 'text-slate-300'
                                    : 'text-slate-500'
                              }`}
                            >
                              {opt.description}
                            </span>
                          )}
                        </span>
                      </span>

                      <span className="flex shrink-0 items-center gap-1.5">
                        {opt.badge && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              isSelected
                                ? isDark
                                  ? 'bg-white/20 text-white'
                                  : 'bg-blue-100 text-[#1d4ed8]'
                                : isDark
                                  ? 'bg-white/10 text-slate-200'
                                  : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        )}
                        {isSelected && (
                          <Check
                            className={`h-4 w-4 shrink-0 ${
                              isDark ? 'text-white' : 'text-[#2563eb]'
                            }`}
                            aria-hidden="true"
                          />
                        )}
                      </span>
                    </li>
                  )
                })
              )}
            </ul>
          </div>,
          document.body
        )}
    </div>
  )
}

