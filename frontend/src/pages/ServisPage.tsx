import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Wallet,
  Wrench,
} from 'lucide-react'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { CustomSelect } from '../components/common/CustomSelect'
import { DocumentViewerModal } from '../components/common/DocumentViewerModal'
import { Modal } from '../components/common/Modal'
import { EmptyState, ErrorState, LoadingState } from '../components/common/StateViews'
import {
  createServis,
  deleteServis,
  listKendaraan,
  listPerangkatDaerah,
  listServis,
  updateServis,
} from '../services/bmdService'
import type {
  CrudPermission,
  JenisServis,
  KendaraanDinas,
  PerangkatDaerah,
  ServisInput,
  ServisKendaraan,
  StatusServis,
  VehicleDocument,
} from '../types/bmd'
import {
  formatRupiah,
  formatTanggalPendek,
  getJenisServisLabel,
  JENIS_SERVIS_OPTIONS,
  STATUS_SERVIS_OPTIONS,
} from '../utils/format'
import { readVehicleDocument } from '../utils/imageUpload'

interface ServisPageProps {
  selectedPdId?: number | null
  readOnly?: boolean
  permission?: CrudPermission
}

interface ServisFormState {
  kendaraanId: string
  tanggalServis: string
  jenisServis: JenisServis
  status: StatusServis
  bengkel: string
  kilometer: string
  biaya: string
  servisBerikutnyaTanggal: string
  deskripsi: string
  buktiNota: VehicleDocument | null
}

function getTodayIsoDate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function makeEmptyForm(defaultKendaraanId: number | ''): ServisFormState {
  return {
    kendaraanId: defaultKendaraanId === '' ? '' : String(defaultKendaraanId),
    tanggalServis: getTodayIsoDate(),
    jenisServis: 'SERVIS_RUTIN',
    status: 'TERJADWAL',
    bengkel: '',
    kilometer: '',
    biaya: '0',
    servisBerikutnyaTanggal: '',
    deskripsi: '',
    buktiNota: null,
  }
}

function StatusServisBadge({ status }: { status: StatusServis }) {
  if (status === 'SELESAI') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        Selesai
      </span>
    )
  }
  if (status === 'DALAM_PERBAIKAN') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">
        <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
        Dalam Perbaikan
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-[#0a3649]">
      <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
      Terjadwal
    </span>
  )
}

export function ServisPage({
  selectedPdId = null,
  readOnly = false,
  permission,
}: ServisPageProps) {
  const canCreate = permission ? permission.create : !readOnly
  const canUpdate = permission ? permission.update : !readOnly
  const canDelete = permission ? permission.delete : !readOnly
  const [servisList, setServisList] = useState<ServisKendaraan[]>([])
  const [kendaraanList, setKendaraanList] = useState<KendaraanDinas[]>([])
  const [pdList, setPdList] = useState<PerangkatDaerah[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterJenis, setFilterJenis] = useState('ALL')

  // Form modal
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ServisKendaraan | null>(null)
  const [form, setForm] = useState<ServisFormState>(() => makeEmptyForm(''))
  const [formError, setFormError] = useState<string | null>(null)
  const [notaUploading, setNotaUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Detail, Preview & Delete
  const [detailItem, setDetailItem] = useState<ServisKendaraan | null>(null)
  const [previewNota, setPreviewNota] = useState<{
    doc: VehicleDocument
    title: string
  } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ServisKendaraan | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [feedback, setFeedback] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [srv, kdo, pds] = await Promise.all([
        listServis(),
        listKendaraan(),
        listPerangkatDaerah(),
      ])
      setServisList(srv)
      setKendaraanList(kdo)
      setPdList(pds)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal memuat data servis & pemeliharaan kendaraan.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([listServis(), listKendaraan(), listPerangkatDaerah()])
      .then(([srv, kdo, pds]) => {
        if (active) {
          setServisList(srv)
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
              : 'Gagal memuat data servis & pemeliharaan kendaraan.'
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

  const kendaraanMap = useMemo(
    () => new Map(kendaraanList.map((k) => [k.id, k])),
    [kendaraanList]
  )
  const pdMap = useMemo(() => new Map(pdList.map((p) => [p.id, p])), [pdList])

  const scopedKendaraanOptions = useMemo(() => {
    if (!selectedPdId) return kendaraanList
    return kendaraanList.filter((k) => k.perangkatDaerahId === selectedPdId)
  }, [kendaraanList, selectedPdId])

  const scopedServisList = useMemo(() => {
    if (!selectedPdId) return servisList
    return servisList.filter((s) => {
      const k = kendaraanMap.get(s.kendaraanId)
      return k?.perangkatDaerahId === selectedPdId
    })
  }, [servisList, selectedPdId, kendaraanMap])

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
      if (q) {
        const k = kendaraanMap.get(item.kendaraanId)
        const pd = k ? pdMap.get(k.perangkatDaerahId) : undefined
        const hay = [
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
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [scopedServisList, filterStatus, filterJenis, search, kendaraanMap, pdMap])

  const openCreateModal = () => {
    setEditingItem(null)
    setFormError(null)
    const defaultId =
      scopedKendaraanOptions.length > 0 ? scopedKendaraanOptions[0].id : ''
    setForm(makeEmptyForm(defaultId))
    setFormOpen(true)
  }

  const openEditModal = (item: ServisKendaraan) => {
    setEditingItem(item)
    setFormError(null)
    setForm({
      kendaraanId: String(item.kendaraanId),
      tanggalServis: item.tanggalServis,
      jenisServis: item.jenisServis,
      status: item.status,
      bengkel: item.bengkel,
      kilometer: item.kilometer !== null ? String(item.kilometer) : '',
      biaya: String(item.biaya),
      servisBerikutnyaTanggal: item.servisBerikutnyaTanggal ?? '',
      deskripsi: item.deskripsi,
      buktiNota: item.buktiNota ?? null,
    })
    setFormOpen(true)
  }

  const handleNotaUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setFormError(null)
    setNotaUploading(true)
    try {
      const doc = await readVehicleDocument(file, 'Bukti Nota Servis')
      setForm((prev) => ({ ...prev, buktiNota: doc }))
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Gagal mengunggah dokumen bukti nota servis.'
      )
    } finally {
      setNotaUploading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!form.kendaraanId) {
      setFormError('Silakan pilih kendaraan dinas terlebih dahulu.')
      return
    }

    const payload: ServisInput = {
      kendaraanId: Number(form.kendaraanId),
      tanggalServis: form.tanggalServis,
      jenisServis: form.jenisServis,
      status: form.status,
      bengkel: form.bengkel,
      kilometer: form.kilometer.trim() ? Number(form.kilometer) : null,
      biaya: form.biaya.trim() ? Number(form.biaya) : 0,
      servisBerikutnyaTanggal: form.servisBerikutnyaTanggal || null,
      deskripsi: form.deskripsi,
      buktiNota: form.buktiNota,
    }

    setSubmitting(true)
    try {
      const targetKendaraan = kendaraanMap.get(payload.kendaraanId)
      if (editingItem) {
        await updateServis(editingItem.id, payload)
        setFeedback(
          `Catatan servis kendaraan ${targetKendaraan?.nomorPolisi ?? ''} berhasil diperbarui.`
        )
      } else {
        await createServis(payload)
        setFeedback(
          `Catatan servis kendaraan ${targetKendaraan?.nomorPolisi ?? ''} berhasil ditambahkan.`
        )
      }
      setFormOpen(false)
      await loadData()
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Gagal menyimpan data servis.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteServis(deleteTarget.id)
      setDeleteTarget(null)
      setFeedback('Catatan servis kendaraan berhasil dihapus.')
      await loadData()
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Gagal menghapus catatan servis.'
      )
    } finally {
      setDeleting(false)
    }
  }

  const resetFilters = () => {
    setSearch('')
    setFilterStatus('ALL')
    setFilterJenis('ALL')
  }

  if (loading) {
    return <LoadingState label="Memuat data servis & pemeliharaan KDO..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
            onClick={openCreateModal}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1d4ed8]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Catat Servis
          </button>
        )}
      </div>

      {feedback && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold underline hover:no-underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 4 Kartu Ringkasan */}
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
            <strong className="text-emerald-700">{summary.selesai} selesai</strong> dikerjakan
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

      {/* Filter */}
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

      {/* Tabel / Cards */}
      {scopedServisList.length === 0 ? (
        <EmptyState
          title="Belum ada catatan servis kendaraan"
          description="Catat jadwal servis rutin, penggantian suku cadang, atau perbaikan bengkel agar riwayat pemeliharaan KDO terdokumentasi."
          actionLabel={canCreate ? 'Catat Servis Pertama' : undefined}
          onAction={canCreate ? openCreateModal : undefined}
        />
      ) : filteredList.length === 0 ? (
        <EmptyState
          title="Tidak ada catatan servis yang sesuai filter"
          description="Ubah kata kunci pencarian atau pilih filter status dan jenis servis lainnya."
          actionLabel="Reset Filter"
          onAction={resetFilters}
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white lg:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="px-5 py-3.5">Tanggal &amp; Jenis</th>
                    <th className="px-4 py-3.5">Kendaraan &amp; SKPD</th>
                    <th className="px-4 py-3.5">Bengkel &amp; Odometer</th>
                    <th className="px-4 py-3.5">Biaya</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Nota</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredList.map((item) => {
                    const k = kendaraanMap.get(item.kendaraanId)
                    const pd = k ? pdMap.get(k.perangkatDaerahId) : undefined
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3.5 align-top">
                          <p className="font-mono text-xs font-bold text-slate-900">
                            {formatTanggalPendek(item.tanggalServis)}
                          </p>
                          <p className="mt-0.5 text-xs font-medium text-[#0a3649]">
                            {getJenisServisLabel(item.jenisServis)}
                          </p>
                          {item.servisBerikutnyaTanggal && (
                            <p className="mt-1 text-[11px] text-slate-500">
                              Berikutnya: {formatTanggalPendek(item.servisBerikutnyaTanggal)}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <span className="inline-block rounded-md border border-slate-300 bg-slate-50 px-2.5 py-0.5 font-mono text-xs font-bold text-[#0a3649]">
                            {k?.nomorPolisi ?? 'Unit Dihapus'}
                          </span>
                          <p className="mt-1 text-xs font-semibold text-slate-900">
                            {k ? `${k.merek} ${k.tipeModel}` : '-'}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {pd?.singkatan ?? '-'}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <p className="font-medium text-slate-900">{item.bengkel}</p>
                          <p className="mt-0.5 line-clamp-1 text-xs text-slate-600">
                            {item.deskripsi}
                          </p>
                          {item.kilometer !== null && (
                            <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                              KM: {item.kilometer.toLocaleString('id-ID')} km
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 align-top font-mono text-xs font-bold text-slate-900">
                          {formatRupiah(item.biaya)}
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <StatusServisBadge status={item.status} />
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          {item.buktiNota ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  item.buktiNota &&
                                  setPreviewNota({
                                    doc: item.buktiNota,
                                    title: `Nota Servis - ${k?.nomorPolisi ?? 'KDO'}`,
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
                              >
                                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                                Lihat
                              </button>
                              <a
                                href={item.buktiNota.dataUrl}
                                download={item.buktiNota.fileName}
                                title="Unduh Nota"
                                className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50"
                              >
                                <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 align-top text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDetailItem(item)}
                              aria-label={`Detail servis ${k?.nomorPolisi ?? ''}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                            >
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            </button>
                            {canUpdate && (
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                aria-label={`Edit servis ${k?.nomorPolisi ?? ''}`}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#0a3649] hover:bg-slate-100"
                              >
                                <Pencil className="h-4 w-4" aria-hidden="true" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteError(null)
                                  setDeleteTarget(item)
                                }}
                                aria-label={`Hapus servis ${k?.nomorPolisi ?? ''}`}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </button>
                            )}
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
            {filteredList.map((item) => {
              const k = kendaraanMap.get(item.kendaraanId)
              const pd = k ? pdMap.get(k.perangkatDaerahId) : undefined
              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block rounded border border-slate-300 bg-slate-50 px-2.5 py-0.5 font-mono text-xs font-bold text-[#0a3649]">
                        {k?.nomorPolisi ?? 'Unit Dihapus'}
                      </span>
                      <h2 className="mt-1.5 text-sm font-bold text-slate-900">
                        {getJenisServisLabel(item.jenisServis)}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {formatTanggalPendek(item.tanggalServis)} · {pd?.singkatan ?? '-'}
                      </p>
                    </div>
                    <StatusServisBadge status={item.status} />
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1">
                    <p>
                      <span className="text-slate-500">Bengkel: </span>
                      <strong className="text-slate-900">{item.bengkel}</strong>
                    </p>
                    <p className="text-slate-700">{item.deskripsi}</p>
                    <p>
                      <span className="text-slate-500">Biaya: </span>
                      <strong className="font-mono text-slate-900">
                        {formatRupiah(item.biaya)}
                      </strong>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setDetailItem(item)}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      Detail
                    </button>
                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#0a3649]/30 bg-white px-3 text-xs font-semibold text-[#0a3649] hover:bg-slate-50"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null)
                          setDeleteTarget(item)
                        }}
                        className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Hapus
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}

      {/* Modal Form Tambah / Edit Servis */}
      <Modal
        isOpen={formOpen}
        title={
          editingItem
            ? 'Edit Catatan Servis KDO'
            : 'Catat Servis & Pemeliharaan KDO'
        }
        subtitle="Catat jadwal servis rutin, perbaikan bengkel, penggantian ban/aki, atau uji KIR kendaraan dinas."
        onClose={() => setFormOpen(false)}
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            >
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="servis-kendaraan"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Kendaraan Dinas (KDO) <span className="text-rose-600">*</span>
              </label>
              <CustomSelect
                id="servis-kendaraan"
                required
                value={form.kendaraanId}
                onChange={(val) =>
                  setForm({ ...form, kendaraanId: val })
                }
                placeholder="-- Pilih Kendaraan Dinas --"
                searchPlaceholder="Cari plat nomor, merek, atau SKPD..."
                options={[
                  { value: '', label: '-- Pilih Kendaraan Dinas --' },
                  ...scopedKendaraanOptions.map((k) => {
                    const pd = pdMap.get(k.perangkatDaerahId)
                    return {
                      value: String(k.id),
                      label: `${k.nomorPolisi} - ${k.merek} ${k.tipeModel}`,
                      description: pd ? `${pd.singkatan} · ${pd.nama}` : '-',
                    }
                  }),
                ]}
              />
            </div>

            <div>
              <label
                htmlFor="servis-tanggal"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Tanggal Masuk / Jadwal Servis{' '}
                <span className="text-rose-600">*</span>
              </label>
              <input
                id="servis-tanggal"
                type="date"
                required
                value={form.tanggalServis}
                onChange={(e) =>
                  setForm({ ...form, tanggalServis: e.target.value })
                }
                className="h-11 w-full rounded-xl border border-slate-300 px-3 font-mono text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="servis-jenis"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Jenis Pemeliharaan <span className="text-rose-600">*</span>
              </label>
              <CustomSelect
                id="servis-jenis"
                value={form.jenisServis}
                onChange={(val) =>
                  setForm({
                    ...form,
                    jenisServis: val as JenisServis,
                  })
                }
                options={JENIS_SERVIS_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
              />
            </div>

            <div>
              <label
                htmlFor="servis-status"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Status Pengerjaan <span className="text-rose-600">*</span>
              </label>
              <CustomSelect
                id="servis-status"
                value={form.status}
                onChange={(val) =>
                  setForm({ ...form, status: val as StatusServis })
                }
                options={STATUS_SERVIS_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                  dotClassName:
                    opt.value === 'SELESAI'
                      ? 'bg-emerald-500'
                      : opt.value === 'DALAM_PERBAIKAN'
                        ? 'bg-blue-500'
                        : 'bg-amber-500',
                }))}
              />
            </div>

            <div>
              <label
                htmlFor="servis-bengkel"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Bengkel / Rekanan Pelaksana{' '}
                <span className="text-rose-600">*</span>
              </label>
              <input
                id="servis-bengkel"
                type="text"
                required
                value={form.bengkel}
                onChange={(e) => setForm({ ...form, bengkel: e.target.value })}
                placeholder="Contoh: Auto2000 Gatot Subroto / UP PKB"
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="servis-km"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Odometer / Kilometer Saat Ini (Opsional)
              </label>
              <input
                id="servis-km"
                type="number"
                min={0}
                value={form.kilometer}
                onChange={(e) =>
                  setForm({ ...form, kilometer: e.target.value })
                }
                placeholder="Contoh: 24500"
                className="h-11 w-full rounded-xl border border-slate-300 px-3 font-mono text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="servis-biaya"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Estimasi / Realisasi Biaya (Rp)
              </label>
              <input
                id="servis-biaya"
                type="number"
                min={0}
                value={form.biaya}
                onChange={(e) => setForm({ ...form, biaya: e.target.value })}
                className="h-11 w-full rounded-xl border border-slate-300 px-3 font-mono text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="servis-berikutnya"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Jadwal Servis Berkala Berikutnya (Opsional)
              </label>
              <input
                id="servis-berikutnya"
                type="date"
                value={form.servisBerikutnyaTanggal}
                onChange={(e) =>
                  setForm({ ...form, servisBerikutnyaTanggal: e.target.value })
                }
                className="h-11 w-full rounded-xl border border-slate-300 px-3 font-mono text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="servis-deskripsi"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Uraian Pekerjaan &amp; Penggantian Suku Cadang{' '}
                <span className="text-rose-600">*</span>
              </label>
              <textarea
                id="servis-deskripsi"
                rows={3}
                required
                value={form.deskripsi}
                onChange={(e) =>
                  setForm({ ...form, deskripsi: e.target.value })
                }
                placeholder="Contoh: Ganti oli mesin 5W-30, filter oli, kampas rem depan, dan spooring..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Bukti Nota / Kwitansi Bengkel (Opsional)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Format PDF atau foto JPG/JPEG/PNG (gambar otomatis dikonversi ke .webp).
                  </p>
                </div>
                {form.buktiNota && (
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Terunggah
                  </span>
                )}
              </div>

              {form.buktiNota ? (
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <span className="truncate font-mono text-xs text-slate-700">
                    {form.buktiNota.fileName}
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href={form.buktiNota.dataUrl}
                      download={form.buktiNota.fileName}
                      className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-slate-300 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      Unduh
                    </a>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, buktiNota: null })}
                      className="inline-flex min-h-[34px] items-center rounded-lg border border-rose-200 px-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="servis-nota-upload"
                  className="mt-2.5 inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-semibold text-[#0a3649] hover:bg-slate-50"
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  {notaUploading
                    ? 'Memproses...'
                    : 'Upload Nota / Kwitansi (PDF atau Gambar)'}
                </label>
              )}
              <input
                id="servis-nota-upload"
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={handleNotaUpload}
                disabled={notaUploading}
                className="sr-only"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2.5 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || notaUploading}
              className="min-h-[44px] rounded-xl bg-[#2563eb] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8] disabled:opacity-60"
            >
              {submitting
                ? 'Menyimpan...'
                : editingItem
                  ? 'Simpan Perubahan'
                  : 'Simpan Catatan Servis'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail Servis */}
      <Modal
        isOpen={detailItem !== null}
        title={
          detailItem
            ? `Detail Servis - ${kendaraanMap.get(detailItem.kendaraanId)?.nomorPolisi ?? 'KDO'}`
            : ''
        }
        subtitle={
          detailItem ? getJenisServisLabel(detailItem.jenisServis) : undefined
        }
        onClose={() => setDetailItem(null)}
      >
        {detailItem && (() => {
          const k = kendaraanMap.get(detailItem.kendaraanId)
          const pd = k ? pdMap.get(k.perangkatDaerahId) : undefined
          return (
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
                  <dd className="font-semibold text-slate-900">
                    {pd?.nama ?? '-'}
                  </dd>
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
                        setPreviewNota({
                          doc: detailItem.buktiNota,
                          title: `Nota Servis - ${k?.nomorPolisi ?? 'KDO'}`,
                        })
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
          )
        })()}
      </Modal>

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
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
