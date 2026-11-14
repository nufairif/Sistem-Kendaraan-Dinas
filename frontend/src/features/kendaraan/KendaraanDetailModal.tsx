import { useEffect, useState } from 'react'
import { CalendarClock, Camera, Download, Eye, FileCheck2 } from 'lucide-react'
import { KondisiBadge } from '../../components/common/KondisiBadge'
import { Modal } from '../../components/common/Modal'
import { listRiwayatByKendaraan } from '../../services/kendaraan.service'
import type {
  KendaraanDinas,
  Pegawai,
  PerangkatDaerah,
  RiwayatKendaraan,
  VehicleDocument,
} from '../../types/bmd'
import {
  formatNip,
  formatTanggalIndonesia,
  formatTanggalPendek,
  getJenisLabel,
  getJenisRiwayatLabel,
} from '../../utils/format'
import { getTaxStatus } from '../../utils/vehicleRules'

function DetailDocumentRow({
  kind,
  doc,
  nomorPolisi,
  onPreviewDoc,
}: {
  kind: 'STNK' | 'BPKB'
  doc: VehicleDocument | null | undefined
  nomorPolisi: string
  onPreviewDoc: (doc: VehicleDocument, title: string) => void
}) {
  if (!doc) {
    return (
      <span className="inline-block rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-500">
        {kind} belum diunggah
      </span>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
      <span className="truncate font-mono font-semibold text-emerald-900">
        {kind}: {doc.fileName}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPreviewDoc(doc, `${kind} - ${nomorPolisi}`)}
          className="inline-flex items-center gap-1 rounded-md bg-[#0a3649] px-2.5 py-1 font-semibold text-white hover:bg-[#072836]"
        >
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          Lihat
        </button>
        <a
          href={doc.dataUrl}
          download={doc.fileName}
          className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-white px-2.5 py-1 font-semibold text-emerald-800 hover:bg-emerald-100"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Unduh
        </a>
      </div>
    </div>
  )
}

interface KendaraanDetailModalProps {
  detailItem: KendaraanDinas | null
  pdMap: Map<number, PerangkatDaerah>
  pegawaiMap: Map<number, Pegawai>
  onClose: () => void
  onPreviewDoc: (doc: VehicleDocument, title: string) => void
}

export function KendaraanDetailModal({
  detailItem,
  pdMap,
  pegawaiMap,
  onClose,
  onPreviewDoc,
}: KendaraanDetailModalProps) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const [riwayat, setRiwayat] = useState<RiwayatKendaraan[]>([])

  useEffect(() => {
    if (!detailItem) return
    let active = true
    listRiwayatByKendaraan(detailItem.id)
      .then((logs) => {
        if (active) setRiwayat(logs)
      })
      .catch(() => {
        if (active) setRiwayat([])
      })
    return () => {
      active = false
    }
  }, [detailItem])

  if (!detailItem) {
    return (
      <Modal isOpen={false} title="" onClose={onClose} maxWidthClass="max-w-3xl">
        {null}
      </Modal>
    )
  }

  const pd = pdMap.get(detailItem.perangkatDaerahId)
  const pj = detailItem.pegawaiId
    ? pegawaiMap.get(detailItem.pegawaiId)
    : undefined
  const fotos = detailItem.fotos ?? []
  const activePhoto = fotos[photoIndex] ?? fotos[0]
  const pkbStatus = getTaxStatus(detailItem.pajakTahunanJatuhTempo)
  const platStatus = getTaxStatus(detailItem.pajakLimaTahunanJatuhTempo)

  return (
    <Modal
      isOpen
      title={`Detail KDO ${detailItem.nomorPolisi}`}
      subtitle={`${detailItem.merek} ${detailItem.tipeModel} (${detailItem.tahunProduksi})`}
      onClose={onClose}
      maxWidthClass="max-w-3xl"
    >
      <div className="space-y-6">
        {fotos.length > 0 && activePhoto ? (
          <div className="space-y-2.5">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <img
                src={activePhoto.dataUrl}
                alt={`Foto ${detailItem.nomorPolisi}: ${activePhoto.name}`}
                width={800}
                height={420}
                className="max-h-72 w-full object-contain"
              />
            </div>
            {fotos.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {fotos.map((photo, idx) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setPhotoIndex(idx)}
                    className={`overflow-hidden rounded-lg border-2 transition-all ${
                      idx === photoIndex
                        ? 'border-[#2563eb]'
                        : 'border-slate-200 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={photo.dataUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      width={72}
                      height={54}
                      className="h-14 w-18 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <Camera className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
            <span>
              Belum ada foto fisik kendaraan yang diunggah untuk unit ini.
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Status Kondisi Fisik Saat Ini
            </p>
            <div className="mt-1">
              <KondisiBadge kondisi={detailItem.kondisi} />
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-medium text-slate-500">
              Perangkat Daerah Pemilik
            </p>
            <p className="mt-0.5 text-sm font-bold text-[#0a3649]">
              {pd?.nama ?? '-'} ({pd?.singkatan ?? '-'})
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2.5 rounded-xl border border-slate-200 p-4 text-sm">
            <div className="flex items-center gap-2">
              <CalendarClock
                className="h-4 w-4 text-[#2563eb]"
                aria-hidden="true"
              />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Masa Berlaku Pajak &amp; Plat
              </h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Pajak Tahunan (PKB)</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatTanggalPendek(detailItem.pajakTahunanJatuhTempo)} (
                  {pkbStatus.label})
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Plat 5 Tahunan (TNKB)</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatTanggalPendek(detailItem.pajakLimaTahunanJatuhTempo)} (
                  {platStatus.label})
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 rounded-xl border border-slate-200 p-4 text-sm">
            <div className="flex items-center gap-2">
              <FileCheck2
                className="h-4 w-4 text-[#0a3649]"
                aria-hidden="true"
              />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Dokumen STNK &amp; BPKB
              </h3>
            </div>
            <div className="space-y-2.5 text-xs">
              <DetailDocumentRow
                kind="STNK"
                doc={detailItem.dokumenStnk}
                nomorPolisi={detailItem.nomorPolisi}
                onPreviewDoc={onPreviewDoc}
              />
              <DetailDocumentRow
                kind="BPKB"
                doc={detailItem.dokumenBpkb}
                nomorPolisi={detailItem.nomorPolisi}
                onPreviewDoc={onPreviewDoc}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2.5 rounded-xl border border-slate-200 p-4 text-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Spesifikasi Kendaraan
            </h3>
            <dl className="space-y-1.5">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Nomor Polisi</dt>
                <dd className="font-mono font-bold text-slate-900">
                  {detailItem.nomorPolisi}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Kode Barang BMD</dt>
                <dd className="font-mono text-xs text-slate-900">
                  {detailItem.kodeBarang || '-'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Jenis</dt>
                <dd className="text-slate-900">
                  {getJenisLabel(detailItem.jenis)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Warna</dt>
                <dd className="text-slate-900">{detailItem.warna}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Nomor Rangka</dt>
                <dd className="font-mono text-xs text-slate-900">
                  {detailItem.nomorRangka || '-'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Nomor Mesin</dt>
                <dd className="font-mono text-xs text-slate-900">
                  {detailItem.nomorMesin || '-'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="space-y-2.5 rounded-xl border border-slate-200 p-4 text-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              PNS Penanggung Jawab
            </h3>
            {pj ? (
              <dl className="space-y-1.5">
                <div>
                  <dt className="text-xs text-slate-500">Nama Lengkap</dt>
                  <dd className="font-bold text-slate-900">{pj.nama}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">NIP</dt>
                  <dd className="font-mono text-xs text-slate-800">
                    {formatNip(pj.nip)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Jabatan</dt>
                  <dd className="text-slate-800">{pj.jabatan}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">
                    Golongan / Pangkat
                  </dt>
                  <dd className="text-slate-800">
                    {pj.golongan} ({pj.pangkat || '-'})
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-slate-600">
                Kendaraan saat ini berada di{' '}
                <strong className="text-slate-900">
                  Pool Perangkat Daerah
                </strong>{' '}
                dan belum ditunjuk PNS pemegang khusus.
              </p>
            )}
          </div>
        </div>

        {(detailItem.lokasiParkir || detailItem.keterangan) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Lokasi Parkir / Penempatan
              </h3>
              <p className="mt-1 text-sm text-slate-800">
                {detailItem.lokasiParkir || '-'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Keterangan Operasional
              </h3>
              <p className="mt-1 text-sm text-slate-700">
                {detailItem.keterangan || '-'}
              </p>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-bold text-[#0a3649]">
            Riwayat Penanggung Jawab &amp; Kondisi Kendaraan
          </h3>
          {riwayat.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              Belum ada catatan riwayat perubahan untuk kendaraan ini.
            </p>
          ) : (
            <ol className="mt-3 space-y-2.5">
              {riwayat.map((log) => (
                <li
                  key={log.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-[#0a3649]">
                      {getJenisRiwayatLabel(log.jenisPerubahan)}
                    </span>
                    <div className="flex items-center gap-2">
                      <KondisiBadge kondisi={log.kondisiSaatItu} />
                      <span className="text-xs text-slate-500">
                        {formatTanggalIndonesia(log.tanggal)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-slate-700">{log.catatan}</p>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>
                      SKPD: <strong>{log.perangkatDaerahNamaSnapshot}</strong>
                    </span>
                    <span>
                      Pemegang:{' '}
                      <strong>{log.pegawaiNamaSnapshot ?? 'Pool Dinas'}</strong>
                    </span>
                    {log.nomorBast && log.nomorBast !== '-' && (
                      <span className="font-mono">
                        Dokumen: {log.nomorBast}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </Modal>
  )
}
