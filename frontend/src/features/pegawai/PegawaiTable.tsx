import { Car, Eye, Pencil, Trash2 } from 'lucide-react'
import type { KendaraanDinas, Pegawai, PerangkatDaerah } from '../../types/bmd'
import { formatNip } from '../../utils/format'

interface PegawaiTableProps {
  items: Pegawai[]
  pdMap: Map<number, PerangkatDaerah>
  kendaraanByPegawai: Map<number, KendaraanDinas[]>
  canUpdate: boolean
  canDelete: boolean
  onDetail: (item: Pegawai) => void
  onEdit: (item: Pegawai) => void
  onDelete: (item: Pegawai) => void
}

export function PegawaiTable({
  items,
  pdMap,
  kendaraanByPegawai,
  canUpdate,
  canDelete,
  onDetail,
  onEdit,
  onDelete,
}: PegawaiTableProps) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white lg:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="px-5 py-3.5">Nama &amp; NIP</th>
                <th className="px-4 py-3.5">Jabatan</th>
                <th className="px-4 py-3.5">Golongan / Pangkat</th>
                <th className="px-4 py-3.5">Perangkat Daerah</th>
                <th className="px-4 py-3.5">KDO Dipegang</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item) => {
                const pd = pdMap.get(item.perangkatDaerahId)
                const heldVehicles = kendaraanByPegawai.get(item.id) ?? []
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 align-top">
                      <p className="font-semibold text-slate-900">{item.nama}</p>
                      <p className="mt-0.5 font-mono text-xs text-slate-500">
                        {formatNip(item.nip)}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 align-top text-slate-700">
                      {item.jabatan}
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <span className="inline-block rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs font-semibold text-[#0a3649]">
                        {item.golongan}
                      </span>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {item.pangkat || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <p className="font-medium text-slate-900">
                        {pd?.nama ?? '-'}
                      </p>
                      {pd && (
                        <p className="mt-0.5 font-mono text-xs text-slate-500">
                          {pd.singkatan}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      {heldVehicles.length === 0 ? (
                        <span className="text-xs text-slate-500">
                          Tidak memegang unit
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {heldVehicles.map((k) => (
                            <span
                              key={k.id}
                              className="inline-flex items-center gap-1 rounded border border-[#0a3649]/20 bg-[#0a3649]/5 px-2 py-0.5 font-mono text-xs font-semibold text-[#0a3649]"
                            >
                              <Car className="h-3 w-3" aria-hidden="true" />
                              {k.nomorPolisi}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 align-top text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onDetail(item)}
                          aria-label={`Lihat detail ${item.nama}`}
                          title="Detail Pegawai"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </button>
                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            aria-label={`Edit ${item.nama}`}
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
                            aria-label={`Hapus ${item.nama}`}
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

      {/* Mobile Cards */}
      <div className="space-y-3 lg:hidden">
        {items.map((item) => {
          const pd = pdMap.get(item.perangkatDaerahId)
          const heldVehicles = kendaraanByPegawai.get(item.id) ?? []
          return (
            <article
              key={item.id}
              className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {item.nama}
                  </h2>
                  <p className="font-mono text-xs text-slate-500">
                    NIP {formatNip(item.nip)}
                  </p>
                </div>
                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs font-semibold text-[#0a3649]">
                  {item.golongan}
                </span>
              </div>

              <div className="space-y-1.5 rounded-lg bg-slate-50 p-3 text-xs">
                <p>
                  <span className="text-slate-500">Jabatan: </span>
                  <span className="font-medium text-slate-900">
                    {item.jabatan}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">Perangkat Daerah: </span>
                  <span className="font-medium text-slate-900">
                    {pd?.nama ?? '-'}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">KDO Dipegang: </span>
                  <span className="font-mono font-semibold text-[#0a3649]">
                    {heldVehicles.length > 0
                      ? heldVehicles.map((k) => k.nomorPolisi).join(', ')
                      : 'Tidak ada'}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onDetail(item)}
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  Detail
                </button>
                {canUpdate && (
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#0a3649]/30 bg-white px-3 text-xs font-semibold text-[#0a3649] hover:bg-slate-50"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50"
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

