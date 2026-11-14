import { Eye, FileCheck2, Pencil, Trash2 } from 'lucide-react'
import { EmptyState } from '../../components/common/StateViews'
import { StatusServisBadge } from '../../components/common/StatusBadges'
import type {
  KendaraanDinas,
  PerangkatDaerah,
  ServisKendaraan,
  VehicleDocument,
} from '../../types/bmd'
import {
  formatRupiah,
  formatTanggalPendek,
  getJenisServisLabel,
} from '../../utils/format'

interface ServisTableProps {
  totalCount: number
  items: ServisKendaraan[]
  kendaraanMap: Map<number, KendaraanDinas>
  pdMap: Map<number, PerangkatDaerah>
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  onCreate: () => void
  onResetFilters: () => void
  onViewDetail: (item: ServisKendaraan) => void
  onEdit: (item: ServisKendaraan) => void
  onDelete: (item: ServisKendaraan) => void
  onPreviewNota: (doc: VehicleDocument, title: string) => void
}

export function ServisTable({
  totalCount,
  items,
  kendaraanMap,
  pdMap,
  canCreate,
  canUpdate,
  canDelete,
  onCreate,
  onResetFilters,
  onViewDetail,
  onEdit,
  onDelete,
  onPreviewNota,
}: ServisTableProps) {
  if (totalCount === 0) {
    return (
      <EmptyState
        title="Belum ada catatan servis kendaraan"
        description="Catat jadwal servis rutin, penggantian suku cadang, atau perbaikan bengkel agar riwayat pemeliharaan KDO terdokumentasi."
        actionLabel={canCreate ? 'Catat Servis Pertama' : undefined}
        onAction={canCreate ? onCreate : undefined}
      />
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Tidak ada catatan servis yang sesuai filter"
        description="Ubah kata kunci pencarian atau pilih filter status dan jenis servis lainnya."
        actionLabel="Reset Filter"
        onAction={onResetFilters}
      />
    )
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white lg:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="px-5 py-3.5">Tanggal &amp; Jenis</th>
                <th className="px-4 py-3.5">Kendaraan &amp; SKPD</th>
                <th className="px-4 py-3.5">Bengkel &amp; Odometer</th>
                <th className="px-4 py-3.5">Biaya</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Nota</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item) => {
                const k = kendaraanMap.get(item.kendaraanId)
                const pd = k ? pdMap.get(k.perangkatDaerahId) : undefined
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 align-top">
                      <p className="font-mono text-xs font-bold text-slate-900">
                        {formatTanggalPendek(item.tanggalServis)}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-[#0a3649]">
                        {getJenisServisLabel(item.jenisServis)}
                      </p>
                      {item.servisBerikutnyaTanggal && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          Berikutnya:{' '}
                          {formatTanggalPendek(item.servisBerikutnyaTanggal)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <span className="inline-block rounded-md border border-slate-300 bg-slate-50 px-2.5 py-0.5 font-mono text-xs font-bold text-[#0a3649]">
                        {k?.nomorPolisi ?? 'Unit Dihapus'}
                      </span>
                      <p className="mt-1 text-xs font-semibold text-slate-900">
                        {k ? `${k.merek} ${k.tipeModel}` : '-'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {pd?.singkatan ?? '-'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <p className="font-medium text-slate-900">{item.bengkel}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-600">
                        {item.deskripsi}
                      </p>
                      {item.kilometer !== null && (
                        <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                          KM: {item.kilometer.toLocaleString('id-ID')} km
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 align-top font-mono text-xs font-bold text-slate-900">
                      {formatRupiah(item.biaya)}
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <StatusServisBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      {item.buktiNota ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              item.buktiNota &&
                              onPreviewNota(
                                item.buktiNota,
                                `Nota Servis - ${k?.nomorPolisi ?? 'KDO'}`
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
                          >
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                            Lihat
                          </button>
                          <a
                            href={item.buktiNota.dataUrl}
                            download={item.buktiNota.fileName}
                            title="Unduh Nota"
                            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50"
                          >
                            <FileCheck2
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 align-top text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onViewDetail(item)}
                          aria-label={`Detail servis ${k?.nomorPolisi ?? ''}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </button>
                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            aria-label={`Edit servis ${k?.nomorPolisi ?? ''}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#0a3649] hover:bg-slate-100"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(item)}
                            aria-label={`Hapus servis ${k?.nomorPolisi ?? ''}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        {items.map((item) => {
          const k = kendaraanMap.get(item.kendaraanId)
          const pd = k ? pdMap.get(k.perangkatDaerahId) : undefined
          return (
            <article
              key={item.id}
              className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-block rounded border border-slate-300 bg-slate-50 px-2.5 py-0.5 font-mono text-xs font-bold text-[#0a3649]">
                    {k?.nomorPolisi ?? 'Unit Dihapus'}
                  </span>
                  <h2 className="mt-1.5 text-sm font-bold text-slate-900">
                    {getJenisServisLabel(item.jenisServis)}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {formatTanggalPendek(item.tanggalServis)} ·{' '}
                    {pd?.singkatan ?? '-'}
                  </p>
                </div>
                <StatusServisBadge status={item.status} />
              </div>

              <div className="space-y-1 rounded-xl bg-slate-50 p-3 text-xs">
                <p>
                  <span className="text-slate-500">Bengkel: </span>
                  <strong className="text-slate-900">{item.bengkel}</strong>
                </p>
                <p className="text-slate-700">{item.deskripsi}</p>
                <p>
                  <span className="text-slate-500">Biaya: </span>
                  <strong className="font-mono text-slate-900">
                    {formatRupiah(item.biaya)}
                  </strong>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onViewDetail(item)}
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  Detail
                </button>
                {canUpdate && (
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#0a3649]/30 bg-white px-3 text-xs font-semibold text-[#0a3649] hover:bg-slate-50"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Hapus
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}

