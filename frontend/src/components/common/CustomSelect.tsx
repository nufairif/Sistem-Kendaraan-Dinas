import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { ChevronDown } from 'lucide-react'
import { CustomSelectMenu, type MenuPosition } from './CustomSelectMenu'

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

      {isOpen && menuPosition && (
        <CustomSelectMenu
          menuRef={menuRef}
          searchInputRef={searchInputRef}
          triggerId={triggerId}
          listboxId={listboxId}
          menuPosition={menuPosition}
          isDark={isDark}
          isSearchEnabled={isSearchEnabled}
          searchQuery={searchQuery}
          searchPlaceholder={searchPlaceholder}
          emptyMessage={emptyMessage}
          value={value}
          highlightedIndex={highlightedIndex}
          filteredOptions={filteredOptions}
          onSearchChange={(next) => {
            setSearchQuery(next)
            setHighlightedIndex(0)
          }}
          onHighlight={setHighlightedIndex}
          onSelect={selectValue}
          onKeyDown={handleKeyDown}
        />
      )}
    </div>
  )
}

