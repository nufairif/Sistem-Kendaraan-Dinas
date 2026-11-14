import { Ban, CalendarCheck, CheckCircle2, RotateCcw } from 'lucide-react'
import { KondisiBadge } from '../../components/common/KondisiBadge'
import { EmptyState } from '../../components/common/StateViews'
import { StatusPeminjamanBadge } from '../../components/common/StatusBadges'
import type { PeminjamanKendaraan } from '../../types/bmd'
import { formatTanggalPendek } from '../../utils/format'
import type { FleetFilter, FleetStatusRow } from './monitoringTypes'

interface FleetStatusSectionProps {
  fleetFilter: FleetFilter
  filteredFleet: FleetStatusRow[]
  canCreate: boolean
  canUpdate: boolean
  onChangeFilter: (filter: FleetFilter) => void
  onCreateLoan: (kendaraanId: number) => void
  onReturnLoan: (loan: PeminjamanKendaraan) => void
}

const FILTER_TABS: Array<[FleetFilter, string]> = [
  ['ALL', 'Semua Unit'],
  ['READY', 'Siap Dipinjam'],
  ['BORROWED', 'Sedang Dipinjam'],
  ['BLOCKED', 'Diblokir / Servis'],
]

export function FleetStatusSection({
  fleetFilter,
  filteredFleet,
  canCreate,
  canUpdate,
  onChangeFilter,
  onCreateLoan,
  onReturnLoan,
}: FleetStatusSectionProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-[#0a3649]">
            Status Ketersediaan Armada Saat Ini
          </h2>
          <p className="text-xs text-slate-500">
            Pemantauan kesiapan seluruh unit KDO pada lingkup Perangkat Daerah aktif.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FILTER_TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onChangeFilter(key)}
              className={`min-h-[34px] rounded-xl px-3 text-xs font-semibold transition-colors ${
                fleetFilter === key
                  ? 'bg-[#0a3649] text-white'
                  : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filteredFleet.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title="Tidak ada unit pada kategori ini"
            description="Pilih kategori filter lain untuk melihat status armada KDO."
            actionLabel="Tampilkan Semua Unit"
            onAction={() => onChangeFilter('ALL')}
          />
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="px-5 py-3.5">Plat &amp; Unit</th>
                  <th className="px-4 py-3.5">SKPD &amp; Parkir / Pengampu</th>
                  <th className="px-4 py-3.5">Kondisi Fisik</th>
                  <th className="px-4 py-3.5">Status Ketersediaan</th>
                  <th className="px-5 py-3.5 text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredFleet.map(({ kendaraan: k, pd, holder, eval: ev }) => (
                  <tr key={k.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 align-top">
                      <span className="inline-block rounded-md border border-slate-300 bg-slate-50 px-2.5 py-0.5 font-mono text-xs font-bold text-[#0a3649]">
                        {k.nomorPolisi}
                      </span>
                      <p className="mt-1 font-semibold text-slate-900">
                        {k.merek} {k.tipeModel}
                      </p>
                      <p className="text-xs text-slate-500">
                        Tahun {k.tahunProduksi} · {k.warna}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <p className="font-medium text-slate-900">
                        {pd?.singkatan ?? '-'} - {pd?.nama ?? '-'}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {k.lokasiParkir || 'Lokasi parkir belum diisi'}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {holder ? `Pengampu: ${holder.nama}` : 'Unit Pool SKPD'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <KondisiBadge kondisi={k.kondisi} />
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      {!ev.eligible ? (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                            <Ban className="h-3 w-3" aria-hidden="true" />
                            Diblokir Pinjam
                          </span>
                          <p className="mt-1 text-xs text-rose-700">
                            {ev.blockReasons.join(' · ')}
                          </p>
                        </div>
                      ) : ev.activeLoan ? (
                        <div>
                          <StatusPeminjamanBadge status="DIPINJAM" />
                          <p className="mt-1 text-xs font-medium text-slate-800">
                            {ev.activeLoan.peminjamNama}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Rencana kembali:{' '}
                            {formatTanggalPendek(
                              ev.activeLoan.tanggalKembaliRencana
                            )}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                            Siap Dipinjam
                          </span>
                          {ev.scheduledCount > 0 && (
                            <p className="mt-1 text-[11px] text-amber-700">
                              {ev.scheduledCount} jadwal booking mendatang
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 align-top text-right">
                      {ev.eligible && !ev.activeLoan && canCreate ? (
                        <button
                          type="button"
                          onClick={() => onCreateLoan(k.id)}
                          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#2563eb] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
                        >
                          <CalendarCheck
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          Pinjamkan
                        </button>
                      ) : ev.activeLoan && canUpdate ? (
                        <button
                          type="button"
                          onClick={() =>
                            ev.activeLoan && onReturnLoan(ev.activeLoan)
                          }
                          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                        >
                          <RotateCcw
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          Kembalikan
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {!ev.eligible ? 'Tidak Layak' : '-'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-200 lg:hidden">
            {filteredFleet.map(({ kendaraan: k, pd, eval: ev }) => (
              <div key={k.id} className="space-y-2.5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block rounded border border-slate-300 bg-slate-50 px-2 py-0.5 font-mono text-xs font-bold text-[#0a3649]">
                      {k.nomorPolisi}
                    </span>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {k.merek} {k.tipeModel}
                    </p>
                    <p className="text-xs text-slate-500">
                      {pd?.singkatan ?? '-'} · {k.lokasiParkir || 'Pool SKPD'}
                    </p>
                  </div>
                  <KondisiBadge kondisi={k.kondisi} />
                </div>

                {!ev.eligible ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs text-rose-800">
                    <strong>Diblokir:</strong> {ev.blockReasons.join(' · ')}
                  </div>
                ) : ev.activeLoan ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50/60 px-3 py-2 text-xs">
                    <div>
                      <p className="font-semibold text-[#1d4ed8]">
                        Dipinjam: {ev.activeLoan.peminjamNama}
                      </p>
                      <p className="text-slate-600">
                        Kembali:{' '}
                        {formatTanggalPendek(ev.activeLoan.tanggalKembaliRencana)}
                      </p>
                    </div>
                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() =>
                          ev.activeLoan && onReturnLoan(ev.activeLoan)
                        }
                        className="min-h-[34px] rounded-xl border border-emerald-300 bg-white px-3 font-semibold text-emerald-800"
                      >
                        Kembalikan
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                      Siap Dipinjam
                    </span>
                    {canCreate && (
                      <button
                        type="button"
                        onClick={() => onCreateLoan(k.id)}
                        className="min-h-[36px] rounded-xl bg-[#2563eb] px-3 text-xs font-semibold text-white"
                      >
                        Pinjamkan
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

