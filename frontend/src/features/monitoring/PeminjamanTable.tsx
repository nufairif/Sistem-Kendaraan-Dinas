import { ClipboardCheck, Eye, Pencil, Trash2 } from 'lucide-react'
import { EmptyState } from '../../components/common/StateViews'
import { StatusPeminjamanBadge } from '../../components/common/StatusBadges'
import type {
  KendaraanDinas,
  PeminjamanKendaraan,
  PerangkatDaerah,
} from '../../types/bmd'
import { formatTanggalPendek } from '../../utils/format'

interface PeminjamanTableProps {
  totalCount: number
  items: PeminjamanKendaraan[]
  kendaraanMap: Map<number, KendaraanDinas>
  pdMap: Map<number, PerangkatDaerah>
  canCreate: boolean
  hasEligibleUnits: boolean
  canUpdate: boolean
  canDelete: boolean
  onCreateFirst: () => void
  onResetFilters: () => void
  onViewDetail: (item: PeminjamanKendaraan) => void
  onReturn: (item: PeminjamanKendaraan) => void
  onEdit: (item: PeminjamanKendaraan) => void
  onDelete: (item: PeminjamanKendaraan) => void
}

export function PeminjamanTable({
  totalCount,
  items,
  kendaraanMap,
  pdMap,
  canCreate,
  hasEligibleUnits,
  canUpdate,
  canDelete,
  onCreateFirst,
  onResetFilters,
  onViewDetail,
  onReturn,
  onEdit,
  onDelete,
}: PeminjamanTableProps) {
  if (totalCount === 0) {
    return (
      <EmptyState
        title="Belum ada transaksi peminjaman"
        description="Catat peminjaman kendaraan berkondisi Baik agar histori penggunaan unit pool dan perjalanan dinas tercatat rapi."
        actionLabel={
          canCreate && hasEligibleUnits ? 'Catat Peminjaman Pertama' : undefined
        }
        onAction={canCreate && hasEligibleUnits ? onCreateFirst : undefined}
      />
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Data peminjaman tidak ditemukan"
        description="Sesuaikan kata kunci pencarian atau pilih Semua Status."
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
                <th className="px-5 py-3.5">Periode &amp; Surat Tugas</th>
                <th className="px-4 py-3.5">Kendaraan</th>
                <th className="px-4 py-3.5">Peminjam &amp; Keperluan</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item) => {
                const k = kendaraanMap.get(item.kendaraanId)
                const pd = k ? pdMap.get(k.perangkatDaerahId) : undefined
                const isActiveBooking =
                  item.status === 'DIPINJAM' || item.status === 'TERJADWAL'
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 align-top">
                      <p className="font-mono text-xs font-bold text-slate-900">
                        {formatTanggalPendek(item.tanggalPinjam)} s/d{' '}
                        {formatTanggalPendek(item.tanggalKembaliRencana)}
                      </p>
                      {item.tanggalKembaliAktual && (
                        <p className="mt-0.5 text-[11px] text-emerald-700">
                          Kembali aktual:{' '}
                          {formatTanggalPendek(item.tanggalKembaliAktual)}
                        </p>
                      )}
                      {item.nomorSuratTugas && (
                        <p className="mt-1 font-mono text-[11px] text-slate-500">
                          No: {item.nomorSuratTugas}
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
                      <p className="font-semibold text-slate-900">
                        {item.peminjamNama}
                      </p>
                      {item.peminjamInstansi && (
                        <p className="text-xs text-slate-500">
                          {item.peminjamInstansi}
                        </p>
                      )}
                      <p className="mt-1 line-clamp-1 text-xs text-slate-700">
                        {item.tujuanKeperluan}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <StatusPeminjamanBadge status={item.status} />
                      {item.kondisiSaatKembali && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          Kembali: {item.kondisiSaatKembali.replace('_', ' ')}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 align-top text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onViewDetail(item)}
                          aria-label={`Detail peminjaman ${k?.nomorPolisi ?? ''}`}
                          title="Detail Peminjaman"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </button>
                        {isActiveBooking && canUpdate && (
                          <button
                            type="button"
                            onClick={() => onReturn(item)}
                            aria-label={`Selesaikan peminjaman ${k?.nomorPolisi ?? ''}`}
                            title="Catat Pengembalian Unit"
                            className="inline-flex h-9 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                          >
                            <ClipboardCheck
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            Kembali
                          </button>
                        )}
                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            aria-label={`Edit peminjaman ${k?.nomorPolisi ?? ''}`}
                            title="Edit Peminjaman"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#0a3649] hover:bg-slate-100"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(item)}
                            aria-label={`Hapus peminjaman ${k?.nomorPolisi ?? ''}`}
                            title="Hapus Peminjaman"
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
          const isActiveBooking =
            item.status === 'DIPINJAM' || item.status === 'TERJADWAL'
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
                  <h3 className="mt-1.5 text-sm font-bold text-slate-900">
                    {item.peminjamNama}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {formatTanggalPendek(item.tanggalPinjam)} s/d{' '}
                    {formatTanggalPendek(item.tanggalKembaliRencana)} ·{' '}
                    {pd?.singkatan ?? '-'}
                  </p>
                </div>
                <StatusPeminjamanBadge status={item.status} />
              </div>

              <div className="space-y-1 rounded-xl bg-slate-50 p-3 text-xs">
                <p className="font-medium text-slate-900">
                  {item.tujuanKeperluan}
                </p>
                {item.lokasiTujuan && (
                  <p className="text-slate-600">Lokasi: {item.lokasiTujuan}</p>
                )}
                {item.nomorSuratTugas && (
                  <p className="font-mono text-[11px] text-slate-500">
                    Surat Tugas: {item.nomorSuratTugas}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onViewDetail(item)}
                  className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  Detail
                </button>
                {isActiveBooking && canUpdate && (
                  <button
                    type="button"
                    onClick={() => onReturn(item)}
                    className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                  >
                    <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                    Kembali
                  </button>
                )}
                {canUpdate && (
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-[#0a3649]/30 bg-white px-3 text-xs font-semibold text-[#0a3649] hover:bg-slate-50"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50"
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

