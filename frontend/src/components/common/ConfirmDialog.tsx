import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  isLoading?: boolean
  errorMessage?: string | null
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Hapus Data',
  isLoading = false,
  errorMessage,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onCancel}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-sm leading-relaxed text-slate-700">{message}</p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800"
          >
            {errorMessage}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="min-h-[44px] rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-800 disabled:opacity-60"
          >
            {isLoading ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}

