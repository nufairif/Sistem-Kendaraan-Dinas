import { useCallback, useMemo, useState } from 'react'
import { CalendarClock, Clock, Plus, Search, Wallet, Wrench } from 'lucide-react'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { CustomSelect } from '../../components/common/CustomSelect'
import { DocumentViewerModal } from '../../components/common/DocumentViewerModal'
import { FeedbackBanner } from '../../components/common/FeedbackBanner'
import { ErrorState, LoadingState } from '../../components/common/StateViews'
import {
  JENIS_SERVIS_OPTIONS,
  STATUS_SERVIS_OPTIONS,
} from '../../constants/domainOptions'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { listKendaraan } from '../../services/kendaraan.service'
import { listPerangkatDaerah } from '../../services/master.service'
import { deleteServis, listServis } from '../../services/servis.service'
import type {
  CrudPermission,
  KendaraanDinas,
  PerangkatDaerah,
  ServisKendaraan,
  VehicleDocument,
} from '../../types/bmd'
import { formatRupiah } from '../../utils/format'
import { ServisDetailModal } from './ServisDetailModal'
import { ServisFormModal } from './ServisFormModal'
import { ServisTable } from './ServisTable'

interface ServisPageProps {
  selectedPdId?: number | null
  readOnly?: boolean
  permission?: CrudPermission
}

interface ServisBundle {
  servisList: ServisKendaraan[]
  kendaraanList: KendaraanDinas[]
  pdList: PerangkatDaerah[]
}

const INITIAL_BUNDLE: ServisBundle = {
  servisList: [],
  kendaraanList: [],
  pdList: [],
}

export function ServisPage({
  selectedPdId = null,
  readOnly = false,
  permission,
}: ServisPageProps) {
  const canCreate = permission ? permission.create : !readOnly
  const canUpdate = permission ? permission.update : !readOnly
  const canDelete = permission ? permission.delete : !readOnly

  const fetchAll = useCallback(async (): Promise<ServisBundle> => {
    const [servisList, kendaraanList, pdList] = await Promise.all([
      listServis(),
      listKendaraan(),
      listPerangkatDaerah(),
    ])
    return { servisList, kendaraanList, pdList }
  }, [])

  const {
    data: { servisList, kendaraanList, pdList },
    loading,
    error,
    reload,
  } = useAsyncData(
    fetchAll,
    INITIAL_BUNDLE,
    'Gagal memuat data servis & pemeliharaan.'
  )

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterJenis, setFilterJenis] = useState('ALL')
  const [formState, setFormState] = useState<{
    open: boolean
    editing: ServisKendaraan | null
  }>({ open: false, editing: null })
  const [detailItem, setDetailItem] = useState<ServisKendaraan | null>(null)
  const [previewNota, setPreviewNota] = useState<{
    doc: VehicleDocument
    title: string
  } | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const {
    deleteTarget,
    deleteError,
    deleting,
    requestDelete,
    cancelDelete,
    confirmDelete,
  } = useConfirmDelete<ServisKendaraan>(async (item) => {
    await deleteServis(item.id)
    setFeedback('Catatan servis kendaraan berhasil dihapus.')
    await reload()
  }, 'Gagal menghapus catatan servis.')

  const kendaraanMap = useMemo(
    () => new Map(kendaraanList.map((k) => [k.id, k])),
    [kendaraanList]
  )
  const pdMap = useMemo(() => new Map(pdList.map((p) => [p.id, p])), [pdList])

  const scopedKendaraanOptions = useMemo(
    () =>
      selectedPdId
        ? kendaraanList.filter((k) => k.perangkatDaerahId === selectedPdId)
        : kendaraanList,
    [kendaraanList, selectedPdId]
  )

  const scopedServisList = useMemo(
    () =>
      selectedPdId
        ? servisList.filter(
            (s) => kendaraanMap.get(s.kendaraanId)?.perangkatDaerahId === selectedPdId
          )
        : servisList,
    [servisList, selectedPdId, kendaraanMap]
  )

  const summary = useMemo(() => {
    let dalamPerbaikan = 0
    let terjadwal = 0
    let selesai = 0
    let totalBiaya = 0
    for (const s of scopedServisList) {
      if (s.status === 'DALAM_PERBAIKAN') dalamPerbaikan++
      if (s.status === 'TERJADWAL') terjadwal++
      if (s.status === 'SELESAI') selesai++
      totalBiaya += s.biaya
    }
    return {
      total: scopedServisList.length,
      dalamPerbaikan,
      terjadwal,
      selesai,
      totalBiaya,
    }
  }, [scopedServisList])

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase()
    return scopedServisList.filter((item) => {
      if (filterStatus !== 'ALL' && item.status !== filterStatus) return false
      if (filterJenis !== 'ALL' && item.jenisServis !== filterJenis) return false
      if (!q) return true
      const k = kendaraanMap.get(item.kendaraanId)
      const pd = k ? pdMap.get(k.perangkatDaerahId) : undefined
      return [
        k?.nomorPolisi ?? '',
        k?.merek ?? '',
        k?.tipeModel ?? '',
        pd?.nama ?? '',
        pd?.singkatan ?? '',
        item.bengkel,
        item.deskripsi,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [scopedServisList, filterStatus, filterJenis, search, kendaraanMap, pdMap])

  const resetFilters = () => {
    setSearch('')
    setFilterStatus('ALL')
    setFilterJenis('ALL')
  }

  if (loading) {
    return <LoadingState label="Memuat data servis & pemeliharaan KDO..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={reload} />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2563eb]">
            Pemeliharaan Aset BMD
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0a3649] sm:text-3xl">
            Servis &amp; Pemeliharaan Kendaraan
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Pantau jadwal perawatan berkala, unit yang sedang diperbaiki di bengkel, uji KIR, serta realisasi biaya pemeliharaan KDO.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() => setFormState({ open: true, editing: null })}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1d4ed8]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Catat Servis
          </button>
        )}
      </div>

      <FeedbackBanner message={feedback} onDismiss={() => setFeedback(null)} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Riwayat Servis
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#0a3649]">
              <Wrench className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tabular-nums text-slate-900">
              {summary.total}
            </span>
            <span className="text-xs font-medium text-slate-500">Catatan</span>
          </div>
          <p className="mt-2.5 text-xs text-slate-600">
            <strong className="text-emerald-700">{summary.selesai} selesai</strong>{' '}
            dikerjakan
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Dalam Perbaikan
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Clock className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tabular-nums text-amber-700">
              {summary.dalamPerbaikan}
            </span>
            <span className="text-xs font-medium text-slate-500">Unit</span>
          </div>
          <p className="mt-2.5 text-xs text-slate-600">
            Unit masih berada di bengkel
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Servis Terjadwal
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb]">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tabular-nums text-[#0a3649]">
              {summary.terjadwal}
            </span>
            <span className="text-xs font-medium text-slate-500">Jadwal</span>
          </div>
          <p className="mt-2.5 text-xs text-slate-600">
            Menunggu realisasi perawatan
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Biaya Servis
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Wallet className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tabular-nums text-emerald-700 sm:text-3xl">
              {formatRupiah(summary.totalBiaya)}
            </span>
          </div>
          <p className="mt-2.5 text-xs text-slate-600">
            Akumulasi biaya pada lingkup SKPD
          </p>
        </div>
      </div>

      <section
        aria-label="Filter servis kendaraan"
        className="rounded-2xl border border-slate-200/80 bg-white p-4"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label
              htmlFor="search-servis"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Cari Nopol, Bengkel, atau Uraian Pekerjaan
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="search-servis"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Contoh: B 9024 PQX, Auto2000, kampas rem..."
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0a3649] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="filter-status-servis"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Status Pengerjaan
            </label>
            <CustomSelect
              id="filter-status-servis"
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'ALL', label: 'Semua Status' },
                ...STATUS_SERVIS_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                  dotClassName:
                    opt.value === 'SELESAI'
                      ? 'bg-emerald-500'
                      : opt.value === 'DALAM_PERBAIKAN'
                        ? 'bg-blue-500'
                        : 'bg-amber-500',
                })),
              ]}
            />
          </div>

          <div>
            <label
              htmlFor="filter-jenis-servis"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Jenis Servis
            </label>
            <CustomSelect
              id="filter-jenis-servis"
              value={filterJenis}
              onChange={setFilterJenis}
              options={[
                { value: 'ALL', label: 'Semua Jenis' },
                ...JENIS_SERVIS_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                })),
              ]}
            />
          </div>
        </div>
      </section>

      <ServisTable
        totalCount={scopedServisList.length}
        items={filteredList}
        kendaraanMap={kendaraanMap}
        pdMap={pdMap}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onCreate={() => setFormState({ open: true, editing: null })}
        onResetFilters={resetFilters}
        onViewDetail={setDetailItem}
        onEdit={(item) => setFormState({ open: true, editing: item })}
        onDelete={requestDelete}
        onPreviewNota={(doc, title) => setPreviewNota({ doc, title })}
      />

      {formState.open && (
        <ServisFormModal
          key={formState.editing ? `edit-${formState.editing.id}` : 'create'}
          isOpen
          editingItem={formState.editing}
          scopedKendaraanOptions={scopedKendaraanOptions}
          kendaraanMap={kendaraanMap}
          pdMap={pdMap}
          onClose={() => setFormState({ open: false, editing: null })}
          onSaved={async (msg) => {
            setFeedback(msg)
            await reload()
          }}
        />
      )}

      <ServisDetailModal
        detailItem={detailItem}
        kendaraanMap={kendaraanMap}
        pdMap={pdMap}
        onClose={() => setDetailItem(null)}
        onPreviewNota={(doc, title) => setPreviewNota({ doc, title })}
      />

      <DocumentViewerModal
        doc={previewNota?.doc ?? null}
        title={previewNota?.title ?? 'Pratinjau Nota Servis'}
        onClose={() => setPreviewNota(null)}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Hapus Catatan Servis?"
        message="Apakah Anda yakin ingin menghapus catatan riwayat servis & pemeliharaan kendaraan ini?"
        isLoading={deleting}
        errorMessage={deleteError}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  )
}

