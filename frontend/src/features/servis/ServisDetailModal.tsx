import { Download, Eye } from 'lucide-react'
import { Modal } from '../../components/common/Modal'
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

interface ServisDetailModalProps {
  detailItem: ServisKendaraan | null
  kendaraanMap: Map<number, KendaraanDinas>
  pdMap: Map<number, PerangkatDaerah>
  onClose: () => void
  onPreviewNota: (doc: VehicleDocument, title: string) => void
}

export function ServisDetailModal({
  detailItem,
  kendaraanMap,
  pdMap,
  onClose,
  onPreviewNota,
}: ServisDetailModalProps) {
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
      title={`Detail Servis - ${k?.nomorPolisi ?? 'KDO'}`}
      subtitle={getJenisServisLabel(detailItem.jenisServis)}
      onClose={onClose}
    >
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="text-xs text-slate-500">Status Pengerjaan</p>
            <div className="mt-1">
              <StatusServisBadge status={detailItem.status} />
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-slate-500">Realisasi / Estimasi Biaya</p>
            <p className="font-mono text-lg font-bold text-[#0a3649]">
              {formatRupiah(detailItem.biaya)}
            </p>
          </div>
        </div>

        <dl className="space-y-2 rounded-xl border border-slate-200 p-4">
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
            <dt className="text-slate-500">Tanggal Servis</dt>
            <dd className="font-mono text-slate-900">
              {formatTanggalPendek(detailItem.tanggalServis)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Bengkel Rekanan</dt>
            <dd className="text-slate-900">{detailItem.bengkel}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Odometer</dt>
            <dd className="font-mono text-slate-900">
              {detailItem.kilometer !== null
                ? `${detailItem.kilometer.toLocaleString('id-ID')} km`
                : '-'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Jadwal Servis Berikutnya</dt>
            <dd className="font-mono text-slate-900">
              {formatTanggalPendek(detailItem.servisBerikutnyaTanggal)}
            </dd>
          </div>
        </dl>

        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Uraian Pekerjaan
          </p>
          <p className="mt-1 text-slate-800">{detailItem.deskripsi}</p>
        </div>

        {detailItem.buktiNota && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
            <div>
              <p className="text-xs font-bold text-emerald-900">
                Bukti Nota Terunggah
              </p>
              <p className="font-mono text-xs text-emerald-800">
                {detailItem.buktiNota.fileName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  detailItem.buktiNota &&
                  onPreviewNota(
                    detailItem.buktiNota,
                    `Nota Servis - ${k?.nomorPolisi ?? 'KDO'}`
                  )
                }
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
              >
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                Lihat Nota
              </button>
              <a
                href={detailItem.buktiNota.dataUrl}
                download={detailItem.buktiNota.fileName}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Unduh Nota
              </a>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

