import { useCallback, useMemo, useState } from 'react'
import { Ban, Car, CheckCircle2, Info, Plus, Search, Wrench } from 'lucide-react'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { CustomSelect } from '../../components/common/CustomSelect'
import { FeedbackBanner } from '../../components/common/FeedbackBanner'
import { ErrorState, LoadingState } from '../../components/common/StateViews'
import { STATUS_PEMINJAMAN_OPTIONS } from '../../constants/domainOptions'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { listKendaraan } from '../../services/kendaraan.service'
import { listPegawai, listPerangkatDaerah } from '../../services/master.service'
import {
  deletePeminjaman,
  listPeminjaman,
} from '../../services/peminjaman.service'
import { listServis } from '../../services/servis.service'
import type {
  CrudPermission,
  KendaraanDinas,
  Pegawai,
  PeminjamanKendaraan,
  PerangkatDaerah,
  ServisKendaraan,
} from '../../types/bmd'
import { evaluateVehicleBorrowStatus } from '../../utils/vehicleRules'
import { FleetStatusSection } from './FleetStatusSection'
import { PeminjamanDetailModal } from './PeminjamanDetailModal'
import { PeminjamanFormModal } from './PeminjamanFormModal'
import { PeminjamanTable } from './PeminjamanTable'
import { ReturnVehicleModal } from './ReturnVehicleModal'
import type { FleetFilter } from './monitoringTypes'

interface MonitoringPageProps {
  selectedPdId?: number | null
  readOnly?: boolean
  permission?: CrudPermission
}

interface MonitoringBundle {
  peminjamanList: PeminjamanKendaraan[]
  kendaraanList: KendaraanDinas[]
  servisList: ServisKendaraan[]
  pegawaiList: Pegawai[]
  pdList: PerangkatDaerah[]
}

const INITIAL_BUNDLE: MonitoringBundle = {
  peminjamanList: [],
  kendaraanList: [],
  servisList: [],
  pegawaiList: [],
  pdList: [],
}

export function MonitoringPage({
  selectedPdId = null,
  readOnly = false,
  permission,
}: MonitoringPageProps) {
  const canCreate = permission ? permission.create : !readOnly
  const canUpdate = permission ? permission.update : !readOnly
  const canDelete = permission ? permission.delete : !readOnly

  const fetchAll = useCallback(async (): Promise<MonitoringBundle> => {
    const [peminjamanList, kendaraanList, servisList, pegawaiList, pdList] =
      await Promise.all([
        listPeminjaman(),
        listKendaraan(),
        listServis(),
        listPegawai(),
        listPerangkatDaerah(),
      ])
    return { peminjamanList, kendaraanList, servisList, pegawaiList, pdList }
  }, [])

  const {
    data: { peminjamanList, kendaraanList, servisList, pegawaiList, pdList },
    loading,
    error,
    reload,
  } = useAsyncData(
    fetchAll,
    INITIAL_BUNDLE,
    'Gagal memuat data monitoring & peminjaman kendaraan.'
  )

  const [fleetFilter, setFleetFilter] = useState<FleetFilter>('ALL')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [formState, setFormState] = useState<{
    open: boolean
    editing: PeminjamanKendaraan | null
    preselectedKendaraanId?: number
  }>({ open: false, editing: null })
  const [returnTarget, setReturnTarget] = useState<PeminjamanKendaraan | null>(
    null
  )
  const [detailItem, setDetailItem] = useState<PeminjamanKendaraan | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const {
    deleteTarget,
    deleteError,
    deleting,
    requestDelete,
    cancelDelete,
    confirmDelete,
  } = useConfirmDelete<PeminjamanKendaraan>(async (item) => {
    await deletePeminjaman(item.id)
    setFeedback('Data peminjaman kendaraan berhasil dihapus.')
    await reload()
  }, 'Gagal menghapus data peminjaman.')

  const kendaraanMap = useMemo(
    () => new Map(kendaraanList.map((k) => [k.id, k])),
    [kendaraanList]
  )
  const pdMap = useMemo(() => new Map(pdList.map((p) => [p.id, p])), [pdList])
  const pegawaiMap = useMemo(
    () => new Map(pegawaiList.map((p) => [p.id, p])),
    [pegawaiList]
  )

  const scopedKendaraanList = useMemo(
    () =>
      selectedPdId
        ? kendaraanList.filter((k) => k.perangkatDaerahId === selectedPdId)
        : kendaraanList,
    [kendaraanList, selectedPdId]
  )

  const scopedPegawaiList = useMemo(
    () =>
      selectedPdId
        ? pegawaiList.filter((p) => p.perangkatDaerahId === selectedPdId)
        : pegawaiList,
    [pegawaiList, selectedPdId]
  )

  const scopedPeminjamanList = useMemo(
    () =>
      selectedPdId
        ? peminjamanList.filter(
            (p) => kendaraanMap.get(p.kendaraanId)?.perangkatDaerahId === selectedPdId
          )
        : peminjamanList,
    [peminjamanList, selectedPdId, kendaraanMap]
  )

  const fleetStatusList = useMemo(
    () =>
      scopedKendaraanList.map((k) => ({
        kendaraan: k,
        pd: pdMap.get(k.perangkatDaerahId),
        holder: k.pegawaiId ? pegawaiMap.get(k.pegawaiId) : undefined,
        eval: evaluateVehicleBorrowStatus(k, servisList, peminjamanList),
      })),
    [scopedKendaraanList, pdMap, pegawaiMap, servisList, peminjamanList]
  )

  const summary = useMemo(() => {
    let siapDipinjam = 0
    let sedangDipinjam = 0
    let dalamServis = 0
    let diblokir = 0

    for (const row of fleetStatusList) {
      if (row.eval.inRepair) dalamServis++
      if (!row.eval.eligible) {
        diblokir++
      } else if (row.eval.activeLoan) {
        sedangDipinjam++
      } else {
        siapDipinjam++
      }
    }

    return {
      siapDipinjam,
      sedangDipinjam,
      dalamServis,
      diblokir,
      terjadwalCount: scopedPeminjamanList.filter(
        (p) => p.status === 'TERJADWAL'
      ).length,
    }
  }, [fleetStatusList, scopedPeminjamanList])

  const filteredFleet = useMemo(
    () =>
      fleetStatusList.filter((row) => {
        if (fleetFilter === 'READY') return row.eval.eligible && !row.eval.activeLoan
        if (fleetFilter === 'BORROWED') return row.eval.activeLoan !== null
        if (fleetFilter === 'BLOCKED') return !row.eval.eligible
        return true
      }),
    [fleetStatusList, fleetFilter]
  )

  const filteredPeminjaman = useMemo(() => {
    const q = search.trim().toLowerCase()
    return scopedPeminjamanList.filter((item) => {
      if (filterStatus !== 'ALL' && item.status !== filterStatus) return false
      if (!q) return true
      const k = kendaraanMap.get(item.kendaraanId)
      const pd = k ? pdMap.get(k.perangkatDaerahId) : undefined
      return [
        k?.nomorPolisi ?? '',
        k?.merek ?? '',
        k?.tipeModel ?? '',
        pd?.nama ?? '',
        pd?.singkatan ?? '',
        item.peminjamNama,
        item.peminjamInstansi,
        item.tujuanKeperluan,
        item.lokasiTujuan,
        item.nomorSuratTugas,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [scopedPeminjamanList, filterStatus, search, kendaraanMap, pdMap])

  const hasEligibleUnits = useMemo(
    () => fleetStatusList.some((row) => row.eval.eligible),
    [fleetStatusList]
  )

  if (loading) {
    return (
      <LoadingState label="Memuat status armada dan jadwal peminjaman KDO..." />
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
            Operasional &amp; Pinjam Pakai
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0a3649] sm:text-3xl">
            Monitoring &amp; Peminjaman Kendaraan
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Pantau ketersediaan unit secara real-time, catat peminjaman operasional, dan verifikasi kelayakan armada sebelum jalan.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() => setFormState({ open: true, editing: null })}
            disabled={!hasEligibleUnits}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1d4ed8] disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Catat Peminjaman
          </button>
        )}
      </div>

      <FeedbackBanner message={feedback} onDismiss={() => setFeedback(null)} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Siap Dipinjam
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tabular-nums text-emerald-700">
              {summary.siapDipinjam}
            </span>
            <span className="text-xs font-medium text-slate-500">Unit</span>
          </div>
          <p className="mt-2.5 text-xs text-slate-600">
            Kondisi Baik, tidak servis, &amp; pajak aktif
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sedang Dipinjam
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb]">
              <Car className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tabular-nums text-[#2563eb]">
              {summary.sedangDipinjam}
            </span>
            <span className="text-xs font-medium text-slate-500">Unit</span>
          </div>
          <p className="mt-2.5 text-xs text-slate-600">
            <strong className="text-slate-800">
              {summary.terjadwalCount} jadwal
            </strong>{' '}
            pinjam berikutnya
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Dalam Perbaikan
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Wrench className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tabular-nums text-amber-700">
              {summary.dalamServis}
            </span>
            <span className="text-xs font-medium text-slate-500">Unit</span>
          </div>
          <p className="mt-2.5 text-xs text-slate-600">
            Dikunci otomatis saat servis bengkel
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tidak Layak / Diblokir
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
              <Ban className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tabular-nums text-rose-700">
              {summary.diblokir}
            </span>
            <span className="text-xs font-medium text-slate-500">Unit</span>
          </div>
          <p className="mt-2.5 text-xs text-slate-600">
            Rusak ringan/berat, servis, atau pajak mati
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 px-4 py-3.5 text-xs text-slate-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#2563eb]" aria-hidden="true" />
        <div>
          <p className="font-bold text-[#0a3649]">
            Standar Kelayakan Peminjaman KDO (Ketat)
          </p>
          <p className="mt-0.5 leading-relaxed">
            Hanya unit dengan kondisi fisik <strong>Baik</strong>, tidak sedang berstatus{' '}
            <strong>Dalam Perbaikan</strong> di menu Servis, dan{' '}
            <strong>Pajak/STNK masih berlaku</strong> yang dapat dipinjam. Unit Rusak Ringan/Rusak Berat diblokir otomatis demi keselamatan dan tertib BMD.
          </p>
        </div>
      </div>

      <FleetStatusSection
        fleetFilter={fleetFilter}
        filteredFleet={filteredFleet}
        canCreate={canCreate}
        canUpdate={canUpdate}
        onChangeFilter={setFleetFilter}
        onCreateLoan={(kendaraanId) =>
          setFormState({
            open: true,
            editing: null,
            preselectedKendaraanId: kendaraanId,
          })
        }
        onReturnLoan={setReturnTarget}
      />

      <section
        aria-label="Filter riwayat dan jadwal peminjaman"
        className="rounded-2xl border border-slate-200/80 bg-white p-4"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <label
              htmlFor="search-peminjaman"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Cari Nopol, Nama Peminjam, Keperluan, atau Surat Tugas
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="search-peminjaman"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Contoh: B 2189 PQH, Siti Rahmawati, ST/DISDIK..."
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0a3649] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="filter-status-peminjaman"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Status Peminjaman
            </label>
            <CustomSelect
              id="filter-status-peminjaman"
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                {
                  value: 'ALL',
                  label: 'Semua Status',
                  dotClassName: 'bg-slate-400',
                },
                ...STATUS_PEMINJAMAN_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                  dotClassName:
                    opt.value === 'DIPINJAM'
                      ? 'bg-blue-500'
                      : opt.value === 'TERJADWAL'
                        ? 'bg-amber-500'
                        : opt.value === 'SELESAI'
                          ? 'bg-emerald-500'
                          : 'bg-slate-400',
                })),
              ]}
            />
          </div>
        </div>
      </section>

      <PeminjamanTable
        totalCount={scopedPeminjamanList.length}
        items={filteredPeminjaman}
        kendaraanMap={kendaraanMap}
        pdMap={pdMap}
        canCreate={canCreate}
        hasEligibleUnits={hasEligibleUnits}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onCreateFirst={() => setFormState({ open: true, editing: null })}
        onResetFilters={() => {
          setSearch('')
          setFilterStatus('ALL')
        }}
        onViewDetail={setDetailItem}
        onReturn={setReturnTarget}
        onEdit={(item) => setFormState({ open: true, editing: item })}
        onDelete={requestDelete}
      />

      {formState.open && (
        <PeminjamanFormModal
          key={
            formState.editing
              ? `edit-${formState.editing.id}`
              : `create-${formState.preselectedKendaraanId ?? 'auto'}`
          }
          isOpen
          editingItem={formState.editing}
          preselectedKendaraanId={formState.preselectedKendaraanId}
          scopedKendaraanList={scopedKendaraanList}
          scopedPegawaiList={scopedPegawaiList}
          servisList={servisList}
          peminjamanList={peminjamanList}
          kendaraanMap={kendaraanMap}
          pdMap={pdMap}
          pegawaiMap={pegawaiMap}
          onClose={() => setFormState({ open: false, editing: null })}
          onSaved={async (msg) => {
            setFeedback(msg)
            await reload()
          }}
        />
      )}

      {returnTarget && (
        <ReturnVehicleModal
          key={`return-${returnTarget.id}`}
          returnTarget={returnTarget}
          kendaraanMap={kendaraanMap}
          onClose={() => setReturnTarget(null)}
          onCompleted={async (msg) => {
            setFeedback(msg)
            await reload()
          }}
        />
      )}

      <PeminjamanDetailModal
        detailItem={detailItem}
        kendaraanMap={kendaraanMap}
        pdMap={pdMap}
        onClose={() => setDetailItem(null)}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Hapus Data Peminjaman?"
        message="Apakah Anda yakin ingin menghapus catatan peminjaman kendaraan ini dari riwayat monitoring?"
        isLoading={deleting}
        errorMessage={deleteError}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  )
}

