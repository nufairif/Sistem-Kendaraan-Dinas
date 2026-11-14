import { AlertTriangle, CheckCircle2, X } from 'lucide-react'

interface FeedbackBannerProps {
  message: string | null
  variant?: 'success' | 'error'
  onDismiss: () => void
}

export function FeedbackBanner({
  message,
  variant = 'success',
  onDismiss,
}: FeedbackBannerProps) {
  if (!message) return null

  const isSuccess = variant === 'success'
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-xs ${
        isSuccess
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-rose-200 bg-rose-50 text-rose-700'
      }`}
    >
      <div className="flex items-center gap-2 font-medium">
        {isSuccess ? (
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <span>{message}</span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Tutup notifikasi"
        className={`rounded-lg p-1 ${
          isSuccess ? 'hover:bg-emerald-100' : 'hover:bg-rose-100'
        }`}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}

