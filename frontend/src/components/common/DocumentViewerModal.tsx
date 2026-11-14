import { Download, FileText } from 'lucide-react'
import { formatTanggalIndonesia } from '../../utils/format'
import type { VehicleDocument } from '../../types/bmd'
import { Modal } from './Modal'

interface DocumentViewerModalProps {
  doc: VehicleDocument | null
  title: string
  onClose: () => void
}

export function DocumentViewerModal({
  doc,
  title,
  onClose,
}: DocumentViewerModalProps) {
  const isPdf =
    doc?.mimeType === 'application/pdf' ||
    doc?.fileName.toLowerCase().endsWith('.pdf')

  return (
    <Modal
      isOpen={doc !== null}
      title={title}
      subtitle={
        doc
          ? `${doc.fileName} · Diunggah ${formatTanggalIndonesia(doc.uploadedAt)}`
          : undefined
      }
      onClose={onClose}
      maxWidthClass="max-w-4xl"
    >
      {doc && (
        <div className="space-y-4">
          {isPdf ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <iframe
                title={title}
                src={doc.dataUrl}
                className="h-[68vh] w-full bg-white"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-3">
              <img
                src={doc.dataUrl}
                alt={title}
                className="max-h-[68vh] w-auto rounded-lg object-contain shadow-sm"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <FileText className="h-4 w-4 text-[#0a3649]" aria-hidden="true" />
              <span className="font-mono">{doc.fileName}</span>
              <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] uppercase text-slate-600">
                {doc.mimeType}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={doc.dataUrl}
                download={doc.fileName}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#0a3649] px-4 py-2 text-xs font-semibold text-white hover:bg-[#072836]"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Unduh File
              </a>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[40px] rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
