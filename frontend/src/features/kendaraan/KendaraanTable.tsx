import { Eye, MapPin, Pencil, Trash2 } from 'lucide-react'
import { KondisiBadge } from '../../components/common/KondisiBadge'
import { EmptyState } from '../../components/common/StateViews'
import type {
  KendaraanDinas,
  Pegawai,
  PerangkatDaerah,
  VehicleDocument,
} from '../../types/bmd'
import { formatTanggalPendek, getJenisLabel } from '../../utils/format'
import { getTaxStatus } from '../../utils/vehicleRules'

interface KendaraanTableProps {
  totalCount: number
  items: KendaraanDinas[]
  pdMap: Map<number, PerangkatDaerah>
  pegawaiMap: Map<number, Pegawai>
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  onCreate: () => void
  onResetFilters: () => void
  onViewDetail: (item: KendaraanDinas) => void
  onEdit: (item: KendaraanDinas) => void
  onDelete: (item: KendaraanDinas) => void
  onPreviewDoc: (doc: VehicleDocument, title: string) => void
}

export function KendaraanTable({
  totalCount,
  items,
  pdMap,
  pegawaiMap,
  canCreate,
  canUpdate,
  canDelete,
  onCreate,
  onResetFilters,
  onViewDetail,
  onEdit,
  onDelete,
  onPreviewDoc,
}: KendaraanTableProps) {
  if (totalCount === 0) {
    return (
      <EmptyState
        title="Belum ada Kendaraan Dinas Operasional"
        description="Mulai pendataan BMD dengan menambahkan kendaraan dinas operasional pertama beserta perangkat daerah pemiliknya."
        actionLabel={canCreate ? 'Tambah KDO Pertama' : undefined}
        onAction={canCreate ? onCreate : undefined}
      />
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Tidak ada kendaraan yang cocok dengan filter"
        description="Ubah kata kunci pencarian atau setel ulang filter kondisi dan perangkat daerah untuk melihat data lainnya."
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
                <th className="px-5 py-3.5">Nomor Polisi</th>
                <th className="px-4 py-3.5">Merek &amp; Model</th>
                <th className="px-4 py-3.5">Kondisi &amp; Pajak PKB</th>
                <th className="px-4 py-3.5">Dokumen</th>
                <th className="px-4 py-3.5">SKPD &amp; Penanggung Jawab</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item) => {
                const pd = pdMap.get(item.perangkatDaerahId)
                const pj = item.pegawaiId
                  ? pegawaiMap.get(item.pegawaiId)
                  : undefined
                const pkbStatus = getTaxStatus(item.pajakTahunanJatuhTempo)

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 align-top">
                      <button
                        type="button"
                        onClick={() => onViewDetail(item)}
                        title="Klik plat nomor untuk melihat foto, no rangka/mesin, pajak & dokumen"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 font-mono text-xs font-bold text-[#0a3649] transition-colors hover:border-[#0a3649] hover:bg-[#0a3649] hover:text-white"
                      >
                        {item.nomorPolisi}
                      </button>
                      <p className="mt-1 font-mono text-[11px] text-slate-500">
                        {item.tahunProduksi} · {item.warna}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <p className="font-semibold text-slate-900">
                        {item.merek} {item.tipeModel}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {getJenisLabel(item.jenis)}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 align-top space-y-1.5">
                      <div>
                        <KondisiBadge kondisi={item.kondisi} />
                      </div>
                      {item.pajakTahunanJatuhTempo ? (
                        <p
                          className={`text-[11px] font-semibold ${
                            pkbStatus.status === 'OVERDUE'
                              ? 'text-rose-700'
                              : pkbStatus.status === 'WARNING'
                                ? 'text-amber-700'
                                : 'text-slate-600'
                          }`}
                        >
                          PKB: {formatTanggalPendek(item.pajakTahunanJatuhTempo)}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400">
                          PKB belum diisi
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <div className="flex flex-col gap-1">
                        {item.dokumenStnk ? (
                          <button
                            type="button"
                            onClick={() =>
                              onPreviewDoc(
                                item.dokumenStnk!,
                                `STNK - ${item.nomorPolisi}`
                              )
                            }
                            className="inline-flex w-fit items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
                          >
                            <Eye className="h-3 w-3" aria-hidden="true" />
                            STNK
                          </button>
                        ) : (
                          <span className="inline-flex w-fit items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                            STNK Kosong
                          </span>
                        )}
                        {item.dokumenBpkb ? (
                          <button
                            type="button"
                            onClick={() =>
                              onPreviewDoc(
                                item.dokumenBpkb!,
                                `BPKB - ${item.nomorPolisi}`
                              )
                            }
                            className="inline-flex w-fit items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
                          >
                            <Eye className="h-3 w-3" aria-hidden="true" />
                            BPKB
                          </button>
                        ) : (
                          <span className="inline-flex w-fit items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                            BPKB Kosong
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <p className="font-semibold text-slate-900">
                        {pd?.singkatan ?? '-'}
                      </p>
                      {pj ? (
                        <p className="mt-0.5 text-xs text-slate-600">{pj.nama}</p>
                      ) : (
                        <span className="mt-0.5 inline-block text-xs text-slate-500">
                          Pool Dinas
                        </span>
                      )}
                      {item.lokasiParkir && (
                        <p className="mt-1 inline-flex items-start gap-1 text-[11px] text-slate-500">
                          <MapPin
                            className="mt-0.5 h-3 w-3 shrink-0 text-[#0a3649]"
                            aria-hidden="true"
                          />
                          <span className="line-clamp-2">{item.lokasiParkir}</span>
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 align-top text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onViewDetail(item)}
                          aria-label={`Lihat detail ${item.nomorPolisi}`}
                          title="Detail & Riwayat"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </button>
                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            aria-label={`Edit ${item.nomorPolisi}`}
                            title="Edit Data"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#0a3649] hover:bg-slate-100"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(item)}
                            aria-label={`Hapus ${item.nomorPolisi}`}
                            title="Hapus Data"
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
          const pd = pdMap.get(item.perangkatDaerahId)
          const pj = item.pegawaiId ? pegawaiMap.get(item.pegawaiId) : undefined
          return (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <button
                    type="button"
                    onClick={() => onViewDetail(item)}
                    className="inline-block rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 font-mono text-xs font-bold text-[#0a3649] transition-colors hover:border-[#0a3649] hover:bg-[#0a3649] hover:text-white"
                  >
                    {item.nomorPolisi}
                  </button>
                  <h2 className="mt-1.5 text-base font-bold text-slate-900">
                    {item.merek} {item.tipeModel}
                  </h2>
                  <p className="text-xs text-slate-600">
                    {getJenisLabel(item.jenis)} · {item.tahunProduksi} ·{' '}
                    {item.warna}
                  </p>
                </div>
                <KondisiBadge kondisi={item.kondisi} />
              </div>

              <div className="grid grid-cols-1 gap-2 rounded-xl bg-slate-50 p-3 text-xs sm:grid-cols-2">
                <div>
                  <span className="text-slate-500">Perangkat Daerah:</span>
                  <p className="font-semibold text-slate-900">
                    {pd?.nama ?? '-'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Penanggung Jawab:</span>
                  <p className="font-semibold text-slate-900">
                    {pj ? pj.nama : 'Pool Perangkat Daerah'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Jatuh Tempo PKB:</span>
                  <p className="font-semibold text-slate-900">
                    {formatTanggalPendek(item.pajakTahunanJatuhTempo)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Dokumen:</span>
                  <p className="font-semibold text-slate-900">
                    STNK {item.dokumenStnk ? 'Ada' : 'Kosong'} · BPKB{' '}
                    {item.dokumenBpkb ? 'Ada' : 'Kosong'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
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

