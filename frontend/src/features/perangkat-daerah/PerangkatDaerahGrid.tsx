import { Building2, Eye, Pencil, Trash2 } from 'lucide-react'
import type { KendaraanDinas, Pegawai, PerangkatDaerah } from '../../types/bmd'

export interface PdStatsSummary {
  pegawai: Pegawai[]
  kendaraan: KendaraanDinas[]
  baik: number
  rusakRingan: number
  rusakBerat: number
}

const DEFAULT_PD_STATS: PdStatsSummary = {
  pegawai: [],
  kendaraan: [],
  baik: 0,
  rusakRingan: 0,
  rusakBerat: 0,
}

interface PerangkatDaerahGridProps {
  items: PerangkatDaerah[]
  statsByPd: Map<number, PdStatsSummary>
  canUpdate: boolean
  canDelete: boolean
  onDetail: (item: PerangkatDaerah) => void
  onEdit: (item: PerangkatDaerah) => void
  onDelete: (item: PerangkatDaerah) => void
}

export function PerangkatDaerahGrid({
  items,
  statsByPd,
  canUpdate,
  canDelete,
  onDetail,
  onEdit,
  onDelete,
}: PerangkatDaerahGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((pd) => {
        const stats = statsByPd.get(pd.id) ?? DEFAULT_PD_STATS

        return (
          <article
            key={pd.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[#0a3649]">
                    <Building2 className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-semibold text-[#2563eb]">
                      {pd.kodeSkpd} · {pd.singkatan}
                    </span>
                    <h2 className="text-base font-bold leading-snug text-slate-900">
                      {pd.nama}
                    </h2>
                  </div>
                </div>
              </div>

              <dl className="mt-4 space-y-1.5 text-xs text-slate-600">
                <div>
                  <dt className="inline text-slate-500">Kepala Dinas: </dt>
                  <dd className="inline font-medium text-slate-800">
                    {pd.kepalaDinas || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="inline text-slate-500">Telepon: </dt>
                  <dd className="inline font-mono text-slate-800">
                    {pd.telepon || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="inline text-slate-500">Alamat: </dt>
                  <dd className="inline text-slate-700">{pd.alamat || '-'}</dd>
                </div>
              </dl>

              {/* Ringkasan aset SKPD */}
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                <div>
                  <p className="text-[11px] font-medium text-slate-500">
                    Total KDO
                  </p>
                  <p className="font-mono text-lg font-bold tabular-nums text-[#0a3649]">
                    {stats.kendaraan.length}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-500">
                    Total PNS
                  </p>
                  <p className="font-mono text-lg font-bold tabular-nums text-slate-800">
                    {stats.pegawai.length}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-500">
                    KDO Baik
                  </p>
                  <p className="font-mono text-lg font-bold tabular-nums text-emerald-700">
                    {stats.baik}
                  </p>
                </div>
              </div>

              {(stats.rusakRingan > 0 || stats.rusakBerat > 0) && (
                <p className="mt-2 text-xs text-slate-600">
                  Perhatian kondisi:{' '}
                  {stats.rusakRingan > 0 && (
                    <span className="font-semibold text-amber-800">
                      {stats.rusakRingan} rusak ringan
                    </span>
                  )}
                  {stats.rusakRingan > 0 && stats.rusakBerat > 0 && ', '}
                  {stats.rusakBerat > 0 && (
                    <span className="font-semibold text-rose-700">
                      {stats.rusakBerat} rusak berat
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => onDetail(pd)}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
                Detail Aset
              </button>
              {canUpdate && (
                <button
                  type="button"
                  onClick={() => onEdit(pd)}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-[#0a3649]/30 bg-white px-3 text-xs font-semibold text-[#0a3649] hover:bg-slate-50"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(pd)}
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
  )
}
