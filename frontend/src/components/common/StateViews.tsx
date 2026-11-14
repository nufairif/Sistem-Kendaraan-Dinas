import { AlertCircle, FolderOpen, RotateCw } from 'lucide-react'

export function LoadingState({ label = 'Memuat data aset daerah...' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white px-6 py-14 text-center shadow-xs"
    >
      <RotateCw className="h-7 w-7 animate-spin text-[#0a3649]" aria-hidden="true" />
      <p className="mt-3 text-sm font-medium text-slate-700">{label}</p>
    </div>
  )
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50/70 px-6 py-12 text-center"
    >
      <AlertCircle className="h-8 w-8 text-rose-700" aria-hidden="true" />
      <h3 className="mt-3 text-base font-bold text-rose-900">
        Gagal Memuat Data
      </h3>
      <p className="mt-1 max-w-md text-sm text-rose-800">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 min-h-[44px] rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
        >
          Muat Ulang
        </button>
      )}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-xs">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-[#f3f6f9] text-[#0a3649]">
        <FolderOpen className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-3.5 text-base font-bold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-600">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 min-h-[44px] rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

