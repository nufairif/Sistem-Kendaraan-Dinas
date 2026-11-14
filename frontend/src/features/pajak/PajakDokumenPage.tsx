import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Search,
} from 'lucide-react'
import { CustomSelect } from '../../components/common/CustomSelect'
import { DocumentViewerModal } from '../../components/common/DocumentViewerModal'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/StateViews'
import { useAsyncData } from '../../hooks/useAsyncData'
import { listKendaraan } from '../../services/kendaraan.service'
import { listPerangkatDaerah } from '../../services/master.service'
import type {
  KendaraanDinas,
  PerangkatDaerah,
  VehicleDocument,
} from '../../types/bmd'
import { getTaxStatus } from '../../utils/vehicleRules'
import { PajakTable } from './PajakTable'

interface PajakDokumenPageProps {
  selectedPdId: number | null
}

interface PajakBundle {
  kendaraanList: KendaraanDinas[]
  pdList: PerangkatDaerah[]
}

const INITIAL_BUNDLE: PajakBundle = {
  kendaraanList: [],
  pdList: [],
}

function isTaxAttention(k: KendaraanDinas): boolean {
  const s1 = getTaxStatus(k.pajakTahunanJatuhTempo).status
  const s2 = getTaxStatus(k.pajakLimaTahunanJatuhTempo).status
  return (
    s1 === 'OVERDUE' ||
    s1 === 'WARNING' ||
    s2 === 'OVERDUE' ||
    s2 === 'WARNING'
  )
}

export function PajakDokumenPage({ selectedPdId }: PajakDokumenPageProps) {
  const { data, loading, error, reload } = useAsyncData<PajakBundle>(
    async () => {
      const [kendaraanList, pdList] = await Promise.all([
        listKendaraan(),
        listPerangkatDaerah(),
      ])
      return { kendaraanList, pdList }
    },
    INITIAL_BUNDLE,
    'Gagal memuat data dokumen & pajak kendaraan.',
  )

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [previewDoc, setPreviewDoc] = useState<{
    doc: VehicleDocument
    title: string
  } | null>(null)

  const { kendaraanList, pdList } = data
  const pdMap = useMemo(() => new Map(pdList.map((p) => [p.id, p])), [pdList])

  const scopedList = useMemo(() => {
    if (!selectedPdId) return kendaraanList
    return kendaraanList.filter((k) => k.perangkatDaerahId === selectedPdId)
  }, [kendaraanList, selectedPdId])

  const summaryCounts = useMemo(() => {
    let overdueOrWarning = 0
    let completeDocs = 0
    for (const k of scopedList) {
      if (isTaxAttention(k)) overdueOrWarning++
      if (k.dokumenStnk && k.dokumenBpkb) completeDocs++
    }
    return { overdueOrWarning, completeDocs }
  }, [scopedList])

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase()
    return scopedList.filter((k) => {
      if (filterStatus === 'ATTENTION' && !isTaxAttention(k)) {
        return false
      }
      if (filterStatus === 'MISSING_DOCS' && k.dokumenStnk && k.dokumenBpkb) {
        return false
      }
      if (q) {
        const pd = pdMap.get(k.perangkatDaerahId)
        const hay = [
          k.nomorPolisi,
          k.merek,
          k.tipeModel,
          pd?.nama ?? '',
          pd?.singkatan ?? '',
        ]
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [scopedList, filterStatus, search, pdMap])

  if (loading) {
    return (
      <LoadingState label="Memuat status STNK, BPKB, dan pajak kendaraan..." />
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={reload} />
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
        <PajakTable
          items={filteredList}
          pdMap={pdMap}
          onPreviewDoc={(doc, title) => setPreviewDoc({ doc, title })}
        />
      )}

      <DocumentViewerModal
        doc={previewDoc?.doc ?? null}
        title={previewDoc?.title ?? 'Pratinjau Dokumen'}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  )
}

