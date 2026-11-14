interface UserStatusSwitchProps {
  checked: boolean
  disabled?: boolean
  loading?: boolean
  ariaLabel: string
  title?: string
  onToggle: () => void
}

export function UserStatusSwitch({
  checked,
  disabled = false,
  loading = false,
  ariaLabel,
  title,
  onToggle,
}: UserStatusSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      title={title}
      onClick={onToggle}
      className="inline-flex shrink-0 items-center gap-2.5 disabled:cursor-not-allowed disabled:opacity-55"
    >
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors ${
          checked ? 'bg-emerald-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </span>
      <span
        className={`text-xs font-semibold ${
          checked ? 'text-emerald-700' : 'text-slate-600'
        }`}
      >
        {loading ? 'Menyimpan...' : checked ? 'Aktif' : 'Nonaktif'}
      </span>
    </button>
  )
}

