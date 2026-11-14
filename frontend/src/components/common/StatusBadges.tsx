import {
  CalendarClock,
  Car,
  CheckCircle2,
  Wrench,
  XCircle,
} from 'lucide-react'
import type { StatusPeminjaman, StatusServis } from '../../types/bmd'
import { getStatusPeminjamanLabel } from '../../utils/format'

export function StatusPeminjamanBadge({
  status,
}: {
  status: StatusPeminjaman
}) {
  if (status === 'DIPINJAM') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#1d4ed8]">
        <Car className="h-3 w-3" aria-hidden="true" />
        Sedang Dipinjam
      </span>
    )
  }
  if (status === 'TERJADWAL') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">
        <CalendarClock className="h-3 w-3" aria-hidden="true" />
        Terjadwal
      </span>
    )
  }
  if (status === 'SELESAI') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
        Dikembalikan
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
      <XCircle className="h-3 w-3" aria-hidden="true" />
      {getStatusPeminjamanLabel(status)}
    </span>
  )
}

export function StatusServisBadge({ status }: { status: StatusServis }) {
  if (status === 'SELESAI') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        Selesai
      </span>
    )
  }
  if (status === 'DALAM_PERBAIKAN') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">
        <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
        Dalam Perbaikan
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-[#0a3649]">
      <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
      Terjadwal
    </span>
  )
}
