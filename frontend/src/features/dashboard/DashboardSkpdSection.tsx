import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { EmptyState } from '../../components/common/StateViews'
import type { DashboardSummary } from '../../types/bmd'
import { formatTanggalPendek } from '../../utils/format'

interface DashboardSkpdSectionProps {
  summary: DashboardSummary
  canViewPd: boolean
  canViewPajak: boolean
}

export function DashboardSkpdSection({
  summary,
  canViewPd,
  canViewPajak,
}: DashboardSkpdSectionProps) {
  const maxBar = Math.max(
    ...summary.perPerangkatDaerah.map((r) => r.totalKendaraan),
    1,
  )

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Kiri (7 kolom): Rekapitulasi Perangkat Daerah */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white xl:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Distribusi KDO per Perangkat Daerah
            </h2>
            <p className="text-xs text-slate-500">
              Sebaran kondisi fisik kendaraan dan jumlah PNS pengampu pada tiap SKPD.
            </p>
          </div>
          {canViewPd && (
            <Link
              to="/perangkat-daerah"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563eb] hover:underline"
            >
              Detail SKPD
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>

        {summary.perPerangkatDaerah.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Belum ada Perangkat Daerah"
              description="Tambahkan perangkat daerah agar distribusi aset kendaraan dapat ditampilkan."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {summary.perPerangkatDaerah.map((row) => {
              const barWidth = Math.round((row.totalKendaraan / maxBar) * 100)
              return (
                <div key={row.perangkatDaerah.id} className="px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-sm font-semibold text-slate-900">
                        {row.perangkatDaerah.nama}
                      </span>
                      <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                        {row.perangkatDaerah.singkatan}
                      </span>
                    </div>
                    <span className="font-mono text-sm font-bold text-[#0a3649]">
                      {row.totalKendaraan} Unit
                    </span>
                  </div>

                  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#0a3649] transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                    <span>{row.totalPegawai} PNS terdaftar</span>
                    <div className="flex flex-wrap gap-3 font-medium">
                      <span className="text-emerald-700">Baik: {row.baik}</span>
                      <span className="text-amber-700">
                        Rusak Ringan: {row.rusakRingan}
                      </span>
                      <span className="text-rose-700">
                        Rusak Berat: {row.rusakBerat}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Kanan (5 kolom): Pengingat Pajak Samsat */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white xl:col-span-5">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Peringatan Pajak &amp; Plat (&lt; 30 Hari)
            </h2>
            <p className="text-xs text-slate-500">
              Otomatis dari jadwal PKB tahunan &amp; plat 5 tahunan.
            </p>
          </div>
          {canViewPajak && (
            <Link
              to="/pajak-dokumen"
              className="text-xs font-semibold text-[#2563eb] hover:underline"
            >
              Semua Pajak
            </Link>
          )}
        </div>

        <div className="p-5">
          {summary.daftarPengingatPajak.length === 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-900">
              <p className="font-semibold">Seluruh jadwal pajak aman</p>
              <p className="mt-1 text-xs text-emerald-800">
                Tidak ada kendaraan dengan masa berlaku pajak kurang dari 30 hari atau lewat jatuh tempo.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {summary.daftarPengingatPajak.slice(0, 5).map((item, idx) => {
                const isOverdue = item.daysRemaining < 0
                return (
                  <li
                    key={`${item.kendaraanId}-${item.jenisPajak}-${idx}`}
                    className={`rounded-xl border p-3.5 ${
                      isOverdue
                        ? 'border-rose-200 bg-rose-50/60'
                        : 'border-amber-200 bg-amber-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-[#0a3649]">
                        {item.nomorPolisi}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          isOverdue
                            ? 'bg-rose-700 text-white'
                            : 'bg-amber-600 text-white'
                        }`}
                      >
                        {isOverdue
                          ? `Lewat ${Math.abs(item.daysRemaining)} hari`
                          : item.daysRemaining === 0
                            ? 'Hari Ini'
                            : `Sisa ${item.daysRemaining} hari`}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-900">
                      {item.merekModel} ({item.perangkatDaerahSingkatan})
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {item.jenisPajak === 'PKB_TAHUNAN'
                        ? 'Pajak Tahunan (PKB)'
                        : 'Pajak & Plat 5 Tahunan'}{' '}
                      · Jatuh tempo {formatTanggalPendek(item.tanggalJatuhTempo)}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

