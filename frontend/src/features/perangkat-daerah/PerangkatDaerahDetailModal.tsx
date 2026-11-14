import { KondisiBadge } from '../../components/common/KondisiBadge'
import { Modal } from '../../components/common/Modal'
import type { Pegawai, PerangkatDaerah } from '../../types/bmd'
import type { PdStatsSummary } from './PerangkatDaerahGrid'

interface PerangkatDaerahDetailModalProps {
  item: PerangkatDaerah | null
  stats: PdStatsSummary
  pegawaiMap: Map<number, Pegawai>
  onClose: () => void
}

export function PerangkatDaerahDetailModal({
  item,
  stats,
  pegawaiMap,
  onClose,
}: PerangkatDaerahDetailModalProps) {
  return (
    <Modal
      isOpen={item !== null}
      title={item ? item.nama : ''}
      subtitle={
        item ? `Kode SKPD ${item.kodeSkpd} (${item.singkatan})` : undefined
      }
      onClose={onClose}
      maxWidthClass="max-w-3xl"
    >
      {item && (
        <div className="space-y-6">
          <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
            <p>
              <span className="text-slate-500">Kepala Dinas: </span>
              <strong className="text-slate-900">
                {item.kepalaDinas || '-'}
              </strong>
            </p>
            <p>
              <span className="text-slate-500">Telepon: </span>
              <span className="font-mono text-slate-800">
                {item.telepon || '-'}
              </span>
            </p>
            <p>
              <span className="text-slate-500">Alamat: </span>
              <span className="text-slate-800">{item.alamat || '-'}</span>
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#0a3649]">
              Daftar Kendaraan Dinas Operasional ({stats.kendaraan.length})
            </h3>
            {stats.kendaraan.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Belum ada unit KDO yang tercatat di perangkat daerah ini.
              </p>
            ) : (
              <ul className="mt-2.5 space-y-2">
                {stats.kendaraan.map((k) => {
                  const pj = k.pegawaiId
                    ? pegawaiMap.get(k.pegawaiId)
                    : undefined
                  return (
                    <li
                      key={k.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3 text-sm"
                    >
                      <div>
                        <span className="font-mono text-xs font-bold text-[#0a3649]">
                          {k.nomorPolisi}
                        </span>
                        <p className="font-semibold text-slate-900">
                          {k.merek} {k.tipeModel} ({k.tahunProduksi})
                        </p>
                        <p className="text-xs text-slate-500">
                          Penanggung jawab:{' '}
                          {pj ? pj.nama : 'Pool Perangkat Daerah'}
                        </p>
                      </div>
                      <KondisiBadge kondisi={k.kondisi} />
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#0a3649]">
              Daftar PNS Terdaftar ({stats.pegawai.length})
            </h3>
            {stats.pegawai.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Belum ada PNS yang terdaftar pada perangkat daerah ini.
              </p>
            ) : (
              <ul className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {stats.pegawai.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-lg border border-slate-200 p-3 text-xs"
                  >
                    <p className="font-bold text-slate-900">{p.nama}</p>
                    <p className="mt-0.5 font-mono text-slate-500">
                      NIP {p.nip}
                    </p>
                    <p className="mt-1 text-slate-700">
                      {p.jabatan} ({p.golongan})
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

