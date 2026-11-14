import { Download, Eye, FileX2 } from 'lucide-react'
import type {
  KendaraanDinas,
  PerangkatDaerah,
  VehicleDocument,
} from '../../types/bmd'
import { formatTanggalPendek } from '../../utils/format'
import { getTaxStatus } from '../../utils/vehicleRules'

function TaxStatusPill({ dateStr }: { dateStr: string | null }) {
  const status = getTaxStatus(dateStr)
  if (status.status === 'NONE') {
    return (
      <span className="inline-block rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
        Belum Diatur
      </span>
    )
  }
  if (status.status === 'OVERDUE') {
    return (
      <span className="inline-block rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-800">
        {status.label}
      </span>
    )
  }
  if (status.status === 'WARNING') {
    return (
      <span className="inline-block rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
        {status.label}
      </span>
    )
  }
  return (
    <span className="inline-block rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
      {status.label}
    </span>
  )
}

function DocBadge({
  doc,
  label,
  onView,
}: {
  doc: VehicleDocument | null
  label: string
  onView: () => void
}) {
  if (!doc) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500">
        <FileX2 className="h-3.5 w-3.5" aria-hidden="true" />
        {label}: Kosong
      </span>
    )
  }
  return (
    <div className="inline-flex items-center overflow-hidden rounded-md border border-emerald-200 bg-emerald-50 text-[11px] font-semibold text-emerald-800">
      <button
        type="button"
        onClick={onView}
        className="inline-flex items-center gap-1 px-2 py-1 hover:bg-emerald-100"
        title={`Lihat ${doc.fileName}`}
      >
        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </button>
      <a
        href={doc.dataUrl}
        download={doc.fileName}
        className="border-l border-emerald-200 px-1.5 py-1 hover:bg-emerald-100"
        aria-label={`Unduh ${doc.fileName}`}
        title={`Unduh ${doc.fileName}`}
      >
        <Download className="h-3 w-3" aria-hidden="true" />
      </a>
    </div>
  )
}

interface PajakTableProps {
  items: KendaraanDinas[]
  pdMap: Map<number, PerangkatDaerah>
  onPreviewDoc: (doc: VehicleDocument, title: string) => void
}

export function PajakTable({ items, pdMap, onPreviewDoc }: PajakTableProps) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white lg:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="px-5 py-3.5">Kendaraan &amp; SKPD</th>
                <th className="px-4 py-3.5">Pajak Tahunan (PKB)</th>
                <th className="px-4 py-3.5">Pajak &amp; Plat 5 Tahunan</th>
                <th className="px-5 py-3.5">Arsip Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((k) => {
                const pd = pdMap.get(k.perangkatDaerahId)
                return (
                  <tr key={k.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 align-top">
                      <span className="inline-block rounded border border-slate-300 bg-slate-50 px-2 py-0.5 font-mono text-xs font-bold text-[#0a3649]">
                        {k.nomorPolisi}
                      </span>
                      <p className="mt-1 font-semibold text-slate-900">
                        {k.merek} {k.tipeModel}
                      </p>
                      <p className="text-xs text-slate-500">
                        {pd?.nama ?? '-'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <p className="font-mono text-xs font-medium text-slate-800">
                        {formatTanggalPendek(k.pajakTahunanJatuhTempo)}
                      </p>
                      <div className="mt-1">
                        <TaxStatusPill dateStr={k.pajakTahunanJatuhTempo} />
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <p className="font-mono text-xs font-medium text-slate-800">
                        {formatTanggalPendek(k.pajakLimaTahunanJatuhTempo)}
                      </p>
                      <div className="mt-1">
                        <TaxStatusPill dateStr={k.pajakLimaTahunanJatuhTempo} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 align-top">
                      <div className="flex flex-wrap gap-2">
                        <DocBadge
                          doc={k.dokumenStnk}
                          label="STNK"
                          onView={() =>
                            k.dokumenStnk &&
                            onPreviewDoc(
                              k.dokumenStnk,
                              `STNK - ${k.nomorPolisi}`,
                            )
                          }
                        />
                        <DocBadge
                          doc={k.dokumenBpkb}
                          label="BPKB"
                          onView={() =>
                            k.dokumenBpkb &&
                            onPreviewDoc(
                              k.dokumenBpkb,
                              `BPKB - ${k.nomorPolisi}`,
                            )
                          }
                        />
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
        {items.map((k) => {
          const pd = pdMap.get(k.perangkatDaerahId)
          return (
            <article
              key={k.id}
              className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4"
            >
              <div>
                <span className="inline-block rounded border border-slate-300 bg-slate-50 px-2.5 py-0.5 font-mono text-xs font-bold text-[#0a3649]">
                  {k.nomorPolisi}
                </span>
                <h2 className="mt-1.5 text-sm font-bold text-slate-900">
                  {k.merek} {k.tipeModel}
                </h2>
                <p className="text-xs text-slate-500">{pd?.nama ?? '-'}</p>
              </div>

              <div className="grid grid-cols-1 gap-2 rounded-xl bg-slate-50 p-3 text-xs sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-medium text-slate-500">
                    Pajak Tahunan (PKB)
                  </p>
                  <p className="mt-0.5 font-mono font-semibold text-slate-800">
                    {formatTanggalPendek(k.pajakTahunanJatuhTempo)}
                  </p>
                  <div className="mt-1">
                    <TaxStatusPill dateStr={k.pajakTahunanJatuhTempo} />
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-500">
                    Pajak &amp; Plat 5 Tahunan
                  </p>
                  <p className="mt-0.5 font-mono font-semibold text-slate-800">
                    {formatTanggalPendek(k.pajakLimaTahunanJatuhTempo)}
                  </p>
                  <div className="mt-1">
                    <TaxStatusPill dateStr={k.pajakLimaTahunanJatuhTempo} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <DocBadge
                  doc={k.dokumenStnk}
                  label="STNK"
                  onView={() =>
                    k.dokumenStnk &&
                    onPreviewDoc(k.dokumenStnk, `STNK - ${k.nomorPolisi}`)
                  }
                />
                <DocBadge
                  doc={k.dokumenBpkb}
                  label="BPKB"
                  onView={() =>
                    k.dokumenBpkb &&
                    onPreviewDoc(k.dokumenBpkb, `BPKB - ${k.nomorPolisi}`)
                  }
                />
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}

