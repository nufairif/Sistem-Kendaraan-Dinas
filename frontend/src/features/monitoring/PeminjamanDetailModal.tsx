import { Modal } from '../../components/common/Modal'
import { StatusPeminjamanBadge } from '../../components/common/StatusBadges'
import type {
  KendaraanDinas,
  PeminjamanKendaraan,
  PerangkatDaerah,
} from '../../types/bmd'
import {
  formatTanggalPendek,
  getStatusPeminjamanLabel,
} from '../../utils/format'

interface PeminjamanDetailModalProps {
  detailItem: PeminjamanKendaraan | null
  kendaraanMap: Map<number, KendaraanDinas>
  pdMap: Map<number, PerangkatDaerah>
  onClose: () => void
}

export function PeminjamanDetailModal({
  detailItem,
  kendaraanMap,
  pdMap,
  onClose,
}: PeminjamanDetailModalProps) {
  if (!detailItem) {
    return (
      <Modal isOpen={false} title="" onClose={onClose}>
        {null}
      </Modal>
    )
  }

  const k = kendaraanMap.get(detailItem.kendaraanId)
  const pd = k ? pdMap.get(k.perangkatDaerahId) : undefined

  return (
    <Modal
      isOpen
      title={`Detail Peminjaman - ${k?.nomorPolisi ?? 'KDO'}`}
      subtitle={getStatusPeminjamanLabel(detailItem.status)}
      onClose={onClose}
    >
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="text-xs text-slate-500">Status</p>
            <div className="mt-1">
              <StatusPeminjamanBadge status={detailItem.status} />
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-slate-500">No. Surat Tugas</p>
            <p className="font-mono text-sm font-bold text-[#0a3649]">
              {detailItem.nomorSuratTugas || '-'}
            </p>
          </div>
        </div>

        <dl className="space-y-2 rounded-xl border border-slate-200 p-4 text-xs sm:text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Kendaraan</dt>
            <dd className="font-semibold text-slate-900">
              {k ? `${k.nomorPolisi} (${k.merek} ${k.tipeModel})` : '-'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Perangkat Daerah</dt>
            <dd className="font-semibold text-slate-900">{pd?.nama ?? '-'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Peminjam</dt>
            <dd className="font-semibold text-slate-900">
              {detailItem.peminjamNama}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Unit Kerja</dt>
            <dd className="text-slate-900">
              {detailItem.peminjamInstansi || '-'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Periode Pinjam</dt>
            <dd className="font-mono text-slate-900">
              {formatTanggalPendek(detailItem.tanggalPinjam)} s/d{' '}
              {formatTanggalPendek(detailItem.tanggalKembaliRencana)}
            </dd>
          </div>
          {detailItem.tanggalKembaliAktual && (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Kembali Aktual</dt>
              <dd className="font-mono font-semibold text-emerald-700">
                {formatTanggalPendek(detailItem.tanggalKembaliAktual)}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Lokasi Tujuan</dt>
            <dd className="text-slate-900">{detailItem.lokasiTujuan || '-'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Odometer</dt>
            <dd className="font-mono text-slate-900">
              {detailItem.kilometerAwal !== null
                ? `${detailItem.kilometerAwal.toLocaleString('id-ID')} km`
                : '-'}{' '}
              s/d{' '}
              {detailItem.kilometerAkhir !== null
                ? `${detailItem.kilometerAkhir.toLocaleString('id-ID')} km`
                : '-'}
            </dd>
          </div>
        </dl>

        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Keperluan Tugas
          </p>
          <p className="mt-1 text-slate-800">{detailItem.tujuanKeperluan}</p>
          {detailItem.catatan && (
            <p className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-600">
              Catatan: {detailItem.catatan}
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}

