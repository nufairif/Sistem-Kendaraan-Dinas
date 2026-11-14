import { KondisiBadge } from '../../components/common/KondisiBadge'
import { Modal } from '../../components/common/Modal'
import type { KendaraanDinas, Pegawai, PerangkatDaerah } from '../../types/bmd'
import { formatNip } from '../../utils/format'

interface PegawaiDetailModalProps {
  item: Pegawai | null
  pd: PerangkatDaerah | undefined
  heldVehicles: KendaraanDinas[]
  onClose: () => void
}

export function PegawaiDetailModal({
  item,
  pd,
  heldVehicles,
  onClose,
}: PegawaiDetailModalProps) {
  return (
    <Modal
      isOpen={item !== null}
      title={item ? item.nama : ''}
      subtitle={item ? `NIP ${formatNip(item.nip)}` : undefined}
      onClose={onClose}
    >
      {item && (
        <div className="space-y-5">
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-slate-500">Jabatan</span>
              <span className="font-semibold text-slate-900">
                {item.jabatan}
              </span>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-slate-500">Golongan / Pangkat</span>
              <span className="font-semibold text-slate-900">
                {item.golongan} ({item.pangkat || '-'})
              </span>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-slate-500">Perangkat Daerah</span>
              <span className="font-semibold text-[#0a3649]">
                {pd?.nama ?? '-'}
              </span>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-slate-500">Kontak</span>
              <span className="text-slate-800">
                {item.noHp || '-'} / {item.email || '-'}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#0a3649]">
              Kendaraan Dinas dalam Tanggung Jawab ({heldVehicles.length})
            </h3>
            {heldVehicles.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Pegawai ini saat ini tidak tercatat memegang kendaraan dinas operasional.
              </p>
            ) : (
              <ul className="mt-2.5 space-y-2">
                {heldVehicles.map((k) => (
                  <li
                    key={k.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
                  >
                    <div>
                      <span className="font-mono text-xs font-bold text-[#0a3649]">
                        {k.nomorPolisi}
                      </span>
                      <p className="text-sm font-semibold text-slate-900">
                        {k.merek} {k.tipeModel} ({k.tahunProduksi})
                      </p>
                      <p className="text-xs text-slate-500">Warna: {k.warna}</p>
                    </div>
                    <KondisiBadge kondisi={k.kondisi} />
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

