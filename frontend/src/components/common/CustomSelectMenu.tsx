import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Check, Search, X } from 'lucide-react'
import type { CustomSelectOption } from './CustomSelect'

export interface MenuPosition {
  left: number
  width: number
  top?: number
  bottom?: number
  maxHeight: number
  placement: 'bottom' | 'top'
}

interface CustomSelectMenuProps {
  menuRef: RefObject<HTMLDivElement | null>
  searchInputRef: RefObject<HTMLInputElement | null>
  triggerId: string
  listboxId: string
  menuPosition: MenuPosition
  isDark: boolean
  isSearchEnabled: boolean
  searchQuery: string
  searchPlaceholder: string
  emptyMessage: string
  value: string
  highlightedIndex: number
  filteredOptions: CustomSelectOption[]
  onSearchChange: (next: string) => void
  onHighlight: (index: number) => void
  onSelect: (value: string) => void
  onKeyDown: (e: ReactKeyboardEvent<HTMLElement>) => void
}

export function CustomSelectMenu({
  menuRef,
  searchInputRef,
  triggerId,
  listboxId,
  menuPosition,
  isDark,
  isSearchEnabled,
  searchQuery,
  searchPlaceholder,
  emptyMessage,
  value,
  highlightedIndex,
  filteredOptions,
  onSearchChange,
  onHighlight,
  onSelect,
  onKeyDown,
}: CustomSelectMenuProps) {
  return createPortal(
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
      onKeyDown={onKeyDown}
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
              className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400"
              aria-hidden="true"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
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
                  onSearchChange('')
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
            menuPosition.maxHeight - (isSearchEnabled ? 54 : 0),
          ),
        }}
        className="space-y-0.5 overflow-y-auto p-1.5"
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
                  if (!opt.disabled) onHighlight(idx)
                }}
                onClick={() => {
                  if (!opt.disabled) onSelect(opt.value)
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
    document.body,
  )
}

