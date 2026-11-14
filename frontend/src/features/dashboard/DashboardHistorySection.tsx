import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { KondisiBadge } from '../../components/common/KondisiBadge'
import type { DashboardSummary } from '../../types/bmd'
import {
  formatTanggalIndonesia,
  getJenisRiwayatLabel,
} from '../../utils/format'

interface DashboardHistorySectionProps {
  riwayat: DashboardSummary['riwayatTerbaru']
  canViewKendaraan: boolean
}

export function DashboardHistorySection({
  riwayat,
  canViewKendaraan,
}: DashboardHistorySectionProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#2563eb]" aria-hidden="true" />
          <h2 className="text-base font-bold text-slate-900">
            Riwayat Perubahan &amp; Serah Terima Terbaru
          </h2>
        </div>
        {canViewKendaraan && (
          <Link
            to="/kendaraan"
            className="text-xs font-semibold text-[#0a3649] hover:underline"
          >
            Buka Daftar KDO
          </Link>
        )}
      </div>

      {riwayat.length === 0 ? (
        <p className="p-6 text-sm text-slate-500">
          Belum ada catatan riwayat pada lingkup Perangkat Daerah ini.
        </p>
      ) : (
        <div className="divide-y divide-slate-100">
          {riwayat.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#0a3649]">
                    {item.nomorPolisi}
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {getJenisRiwayatLabel(item.jenisPerubahan)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-600">{item.catatan}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <KondisiBadge kondisi={item.kondisiSaatItu} />
                <span className="text-xs text-slate-500">
                  {formatTanggalIndonesia(item.tanggal)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
