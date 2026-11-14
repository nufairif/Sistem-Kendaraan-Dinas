import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Download,
  Eye,
  FileX2,
  Search,
} from 'lucide-react'
import { CustomSelect } from '../components/common/CustomSelect'
import { DocumentViewerModal } from '../components/common/DocumentViewerModal'
import { EmptyState, ErrorState, LoadingState } from '../components/common/StateViews'
import { listKendaraan, listPerangkatDaerah } from '../services/bmdService'
import type {
  KendaraanDinas,
  PerangkatDaerah,
  VehicleDocument,
} from '../types/bmd'
import { formatTanggalPendek, getTaxStatus } from '../utils/format'

interface PajakDokumenPageProps {
  selectedPdId: number | null
}

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

export function PajakDokumenPage({ selectedPdId }: PajakDokumenPageProps) {
  const [kendaraanList, setKendaraanList] = useState<KendaraanDinas[]>([])
  const [pdList, setPdList] = useState<PerangkatDaerah[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [previewDoc, setPreviewDoc] = useState<{
    doc: VehicleDocument
    title: string
  } | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([listKendaraan(), listPerangkatDaerah()])
      .then(([kdo, pds]) => {
        if (active) {
          setKendaraanList(kdo)
          setPdList(pds)
          setError(null)
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Gagal memuat data dokumen & pajak kendaraan.'
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const pdMap = useMemo(() => new Map(pdList.map((p) => [p.id, p])), [pdList])

  const scopedList = useMemo(() => {
    if (!selectedPdId) return kendaraanList
    return kendaraanList.filter((k) => k.perangkatDaerahId === selectedPdId)
  }, [kendaraanList, selectedPdId])

  const summaryCounts = useMemo(() => {
    let overdueOrWarning = 0
    let completeDocs = 0
    for (const k of scopedList) {
      const s1 = getTaxStatus(k.pajakTahunanJatuhTempo).status
      const s2 = getTaxStatus(k.pajakLimaTahunanJatuhTempo).status
      if (
        s1 === 'OVERDUE' ||
        s1 === 'WARNING' ||
        s2 === 'OVERDUE' ||
        s2 === 'WARNING'
      ) {
        overdueOrWarning++
      }
      if (k.dokumenStnk && k.dokumenBpkb) {
        completeDocs++
      }
    }
    return { overdueOrWarning, completeDocs }
  }, [scopedList])

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase()
    return scopedList.filter((k) => {
      const s1 = getTaxStatus(k.pajakTahunanJatuhTempo).status
      const s2 = getTaxStatus(k.pajakLimaTahunanJatuhTempo).status

      if (filterStatus === 'ATTENTION') {
        if (
          s1 !== 'OVERDUE' &&
          s1 !== 'WARNING' &&
          s2 !== 'OVERDUE' &&
          s2 !== 'WARNING'
        ) {
          return false
        }
      } else if (filterStatus === 'MISSING_DOCS') {
        if (k.dokumenStnk && k.dokumenBpkb) return false
      }

      if (q) {
        const pd = pdMap.get(k.perangkatDaerahId)
        const hay = [k.nomorPolisi, k.merek, k.tipeModel, pd?.nama ?? '', pd?.singkatan ?? '']
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [scopedList, filterStatus, search, pdMap])

  if (loading) {
    return <LoadingState label="Memuat status STNK, BPKB, dan pajak kendaraan..." />
  }

  if (error) {
    return <ErrorState message={error} />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2563eb]">
            Pengingat Samsat &amp; Arsip Legalitas
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0a3649] sm:text-3xl">
            Dokumen STNK, BPKB &amp; Pajak Kendaraan
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Pantau jatuh tempo PKB tahunan, penggantian plat 5 tahunan, serta kelengkapan berkas STNK dan BPKB setiap unit KDO.
          </p>
        </div>

        <Link
          to="/kendaraan"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0a3649] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#082c3b]"
        >
          Perbarui di Halaman Kendaraan
        </Link>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Unit Dipantau
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#0a3649]">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tabular-nums text-slate-900">
              {scopedList.length}
            </span>
            <span className="text-xs font-medium text-slate-500">Unit</span>
          </div>
          <p className="mt-2.5 text-xs text-slate-600">
            Tercatat pada lingkup SKPD aktif
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pajak &lt; 30 Hari / Lewat
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb]">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tabular-nums text-[#2563eb]">
              {summaryCounts.overdueOrWarning}
            </span>
            <span className="text-xs font-medium text-slate-500">Unit</span>
          </div>
          <p className="mt-2.5 text-xs text-slate-600">
            Perlu pengurusan perpanjangan Samsat
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              STNK &amp; BPKB Lengkap
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tabular-nums text-emerald-700">
              {summaryCounts.completeDocs}
            </span>
            <span className="text-xs font-medium text-slate-500">
              dari {scopedList.length} Unit
            </span>
          </div>
          <p className="mt-2.5 text-xs text-slate-600">
            Arsip digital kedua dokumen tersedia
          </p>
        </div>
      </div>

      {/* Filter */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <label
              htmlFor="search-pajak"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Cari Nomor Polisi, Merek, Model, atau SKPD
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="search-pajak"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Contoh: B 2189 PQH, Toyota..."
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="filter-pajak-status"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Filter Status
            </label>
            <CustomSelect
              id="filter-pajak-status"
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                {
                  value: 'ALL',
                  label: 'Semua Kendaraan',
                  dotClassName: 'bg-slate-400',
                },
                {
                  value: 'ATTENTION',
                  label: 'Pajak < 30 Hari / Terlambat',
                  dotClassName: 'bg-amber-500',
                },
                {
                  value: 'MISSING_DOCS',
                  label: 'STNK / BPKB Belum Lengkap',
                  dotClassName: 'bg-rose-500',
                },
              ]}
            />
          </div>
        </div>
      </section>

      {filteredList.length === 0 ? (
        <EmptyState
          title="Tidak ada data yang sesuai filter"
          description="Sesuaikan pencarian atau pilih Semua Kendaraan untuk melihat jadwal pajak seluruh unit."
          actionLabel="Tampilkan Semua"
          onAction={() => {
            setSearch('')
            setFilterStatus('ALL')
          }}
        />
      ) : (
        <>
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
                  {filteredList.map((k) => {
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
                                setPreviewDoc({
                                  doc: k.dokumenStnk,
                                  title: `STNK - ${k.nomorPolisi}`,
                                })
                              }
                            />
                            <DocBadge
                              doc={k.dokumenBpkb}
                              label="BPKB"
                              onView={() =>
                                k.dokumenBpkb &&
                                setPreviewDoc({
                                  doc: k.dokumenBpkb,
                                  title: `BPKB - ${k.nomorPolisi}`,
                                })
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
            {filteredList.map((k) => {
              const pd = pdMap.get(k.perangkatDaerahId)
              return (
                <article
                  key={k.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3"
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
                        setPreviewDoc({
                          doc: k.dokumenStnk,
                          title: `STNK - ${k.nomorPolisi}`,
                        })
                      }
                    />
                    <DocBadge
                      doc={k.dokumenBpkb}
                      label="BPKB"
                      onView={() =>
                        k.dokumenBpkb &&
                        setPreviewDoc({
                          doc: k.dokumenBpkb,
                          title: `BPKB - ${k.nomorPolisi}`,
                        })
                      }
                    />
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}

      <DocumentViewerModal
        doc={previewDoc?.doc ?? null}
        title={previewDoc?.title ?? 'Pratinjau Dokumen'}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  )
}

