import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Ban,
  CalendarCheck,
  CalendarClock,
  Car,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Info,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Wrench,
} from 'lucide-react'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { CustomSelect } from '../components/common/CustomSelect'
import { KondisiBadge } from '../components/common/KondisiBadge'
import { Modal } from '../components/common/Modal'
import { EmptyState, ErrorState, LoadingState } from '../components/common/StateViews'
import {
  completePeminjaman,
  createPeminjaman,
  deletePeminjaman,
  listKendaraan,
  listPegawai,
  listPeminjaman,
  listPerangkatDaerah,
  listServis,
  updatePeminjaman,
} from '../services/bmdService'
import type {
  CrudPermission,
  KendaraanDinas,
  KondisiKendaraan,
  Pegawai,
  PeminjamanInput,
  PeminjamanKendaraan,
  PerangkatDaerah,
  ServisKendaraan,
  StatusPeminjaman,
} from '../types/bmd'
import {
  evaluateVehicleBorrowStatus,
  formatTanggalPendek,
  getStatusPeminjamanLabel,
  KONDISI_OPTIONS,
  STATUS_PEMINJAMAN_OPTIONS,
} from '../utils/format'

interface MonitoringPageProps {
  selectedPdId?: number | null
  readOnly?: boolean
  permission?: CrudPermission
}

interface PeminjamanFormState {
  kendaraanId: string
  peminjamPegawaiId: string
  peminjamNama: string
  peminjamInstansi: string
  tujuanKeperluan: string
  lokasiTujuan: string
  tanggalPinjam: string
  tanggalKembaliRencana: string
  status: StatusPeminjaman
  nomorSuratTugas: string
  kilometerAwal: string
  catatan: string
}

interface ReturnFormState {
  tanggalKembaliAktual: string
  kilometerAkhir: string
  kondisiSaatKembali: KondisiKendaraan
  catatan: string
}

type FleetFilter = 'ALL' | 'READY' | 'BORROWED' | 'BLOCKED'

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10)
}

function makeEmptyForm(defaultKendaraanId = ''): PeminjamanFormState {
  const today = todayYmd()
  return {
    kendaraanId: defaultKendaraanId,
    peminjamPegawaiId: '',
    peminjamNama: '',
    peminjamInstansi: '',
    tujuanKeperluan: '',
    lokasiTujuan: '',
    tanggalPinjam: today,
    tanggalKembaliRencana: today,
    status: 'DIPINJAM',
    nomorSuratTugas: '',
    kilometerAwal: '',
    catatan: '',
  }
}

function StatusPeminjamanBadge({ status }: { status: StatusPeminjaman }) {
  if (status === 'DIPINJAM') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#1d4ed8]">
        <Car className="h-3 w-3" aria-hidden="true" />
        Sedang Dipinjam
      </span>
    )
  }
  if (status === 'TERJADWAL') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">
        <CalendarClock className="h-3 w-3" aria-hidden="true" />
        Terjadwal
      </span>
    )
  }
  if (status === 'SELESAI') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
        Dikembalikan
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
      Dibatalkan
    </span>
  )
}

export function MonitoringPage({
  selectedPdId = null,
  readOnly = false,
  permission,
}: MonitoringPageProps) {
  const canCreate = permission ? permission.create : !readOnly
  const canUpdate = permission ? permission.update : !readOnly
  const canDelete = permission ? permission.delete : !readOnly

  const [peminjamanList, setPeminjamanList] = useState<PeminjamanKendaraan[]>([])
  const [kendaraanList, setKendaraanList] = useState<KendaraanDinas[]>([])
  const [servisList, setServisList] = useState<ServisKendaraan[]>([])
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([])
  const [pdList, setPdList] = useState<PerangkatDaerah[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [fleetFilter, setFleetFilter] = useState<FleetFilter>('ALL')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')

  // Booking create/edit modal
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PeminjamanKendaraan | null>(null)
  const [form, setForm] = useState<PeminjamanFormState>(() => makeEmptyForm(''))
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Return vehicle modal
  const [returnTarget, setReturnTarget] = useState<PeminjamanKendaraan | null>(null)
  const [returnForm, setReturnForm] = useState<ReturnFormState>({
    tanggalKembaliAktual: todayYmd(),
    kilometerAkhir: '',
    kondisiSaatKembali: 'BAIK',
    catatan: '',
  })
  const [returnError, setReturnError] = useState<string | null>(null)
  const [returning, setReturning] = useState(false)

  // Detail & Delete
  const [detailItem, setDetailItem] = useState<PeminjamanKendaraan | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PeminjamanKendaraan | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [feedback, setFeedback] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [pmj, kdo, srv, peg, pds] = await Promise.all([
        listPeminjaman(),
        listKendaraan(),
        listServis(),
        listPegawai(),
        listPerangkatDaerah(),
      ])
      setPeminjamanList(pmj)
      setKendaraanList(kdo)
      setServisList(srv)
      setPegawaiList(peg)
      setPdList(pds)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal memuat data monitoring & peminjaman kendaraan.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([
      listPeminjaman(),
      listKendaraan(),
      listServis(),
      listPegawai(),
      listPerangkatDaerah(),
    ])
      .then(([pmj, kdo, srv, peg, pds]) => {
        if (active) {
          setPeminjamanList(pmj)
          setKendaraanList(kdo)
          setServisList(srv)
          setPegawaiList(peg)
          setPdList(pds)
          setError(null)
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Gagal memuat data monitoring & peminjaman kendaraan.'
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
  const pegawaiMap = useMemo(
    () => new Map(pegawaiList.map((p) => [p.id, p])),
    [pegawaiList]
  )

  const scopedKendaraanList = useMemo(() => {
    if (!selectedPdId) return kendaraanList
    return kendaraanList.filter((k) => k.perangkatDaerahId === selectedPdId)
  }, [kendaraanList, selectedPdId])

  const scopedPegawaiList = useMemo(() => {
    if (!selectedPdId) return pegawaiList
    return pegawaiList.filter((p) => p.perangkatDaerahId === selectedPdId)
  }, [pegawaiList, selectedPdId])

  const scopedPeminjamanList = useMemo(() => {
    if (!selectedPdId) return peminjamanList
    return peminjamanList.filter((p) => {
      const k = kendaraanMap.get(p.kendaraanId)
      return k?.perangkatDaerahId === selectedPdId
    })
  }, [peminjamanList, selectedPdId, kendaraanMap])

  const fleetStatusList = useMemo(() => {
    return scopedKendaraanList.map((k) => ({
      kendaraan: k,
      pd: pdMap.get(k.perangkatDaerahId),
      holder: k.pegawaiId ? pegawaiMap.get(k.pegawaiId) : undefined,
      eval: evaluateVehicleBorrowStatus(k, servisList, peminjamanList),
    }))
  }, [scopedKendaraanList, pdMap, pegawaiMap, servisList, peminjamanList])

  const eligibleForFormList = useMemo(() => {
    return scopedKendaraanList.filter(
      (k) =>
        evaluateVehicleBorrowStatus(
          k,
          servisList,
          peminjamanList,
          editingItem?.id
        ).eligible
    )
  }, [scopedKendaraanList, servisList, peminjamanList, editingItem])

  const blockedForFormList = useMemo(() => {
    return scopedKendaraanList
      .map((k) => ({
        kendaraan: k,
        eval: evaluateVehicleBorrowStatus(
          k,
          servisList,
          peminjamanList,
          editingItem?.id
        ),
      }))
      .filter((row) => !row.eval.eligible)
  }, [scopedKendaraanList, servisList, peminjamanList, editingItem])

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

    const terjadwalCount = scopedPeminjamanList.filter(
      (p) => p.status === 'TERJADWAL'
    ).length

    return {
      siapDipinjam,
      sedangDipinjam,
      dalamServis,
      diblokir,
      terjadwalCount,
    }
  }, [fleetStatusList, scopedPeminjamanList])

  const filteredFleet = useMemo(() => {
    return fleetStatusList.filter((row) => {
      if (fleetFilter === 'READY') {
        return row.eval.eligible && !row.eval.activeLoan
      }
      if (fleetFilter === 'BORROWED') {
        return row.eval.activeLoan !== null
      }
      if (fleetFilter === 'BLOCKED') {
        return !row.eval.eligible
      }
      return true
    })
  }, [fleetStatusList, fleetFilter])

  const filteredPeminjaman = useMemo(() => {
    const q = search.trim().toLowerCase()
    return scopedPeminjamanList.filter((item) => {
      if (filterStatus !== 'ALL' && item.status !== filterStatus) return false
      if (q) {
        const k = kendaraanMap.get(item.kendaraanId)
        const pd = k ? pdMap.get(k.perangkatDaerahId) : undefined
        const hay = [
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
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [scopedPeminjamanList, filterStatus, search, kendaraanMap, pdMap])

  const openCreateModal = (preselectedKendaraanId?: number) => {
    setEditingItem(null)
    setFormError(null)
    const fallbackEligible = eligibleForFormList.find((k) => {
      const ev = evaluateVehicleBorrowStatus(k, servisList, peminjamanList)
      return ev.eligible && !ev.activeLoan
    })
    const chosenId =
      preselectedKendaraanId ??
      fallbackEligible?.id ??
      eligibleForFormList[0]?.id
    setForm(makeEmptyForm(chosenId ? String(chosenId) : ''))
    setFormOpen(true)
  }

  const openEditModal = (item: PeminjamanKendaraan) => {
    setEditingItem(item)
    setFormError(null)
    setForm({
      kendaraanId: String(item.kendaraanId),
      peminjamPegawaiId: item.peminjamPegawaiId
        ? String(item.peminjamPegawaiId)
        : '',
      peminjamNama: item.peminjamNama,
      peminjamInstansi: item.peminjamInstansi,
      tujuanKeperluan: item.tujuanKeperluan,
      lokasiTujuan: item.lokasiTujuan,
      tanggalPinjam: item.tanggalPinjam,
      tanggalKembaliRencana: item.tanggalKembaliRencana,
      status: item.status,
      nomorSuratTugas: item.nomorSuratTugas,
      kilometerAwal:
        item.kilometerAwal !== null ? String(item.kilometerAwal) : '',
      catatan: item.catatan,
    })
    setFormOpen(true)
  }

  const handleSelectPegawai = (pegawaiIdStr: string) => {
    if (!pegawaiIdStr) {
      setForm((prev) => ({ ...prev, peminjamPegawaiId: '' }))
      return
    }
    const peg = pegawaiMap.get(Number(pegawaiIdStr))
    const pd = peg ? pdMap.get(peg.perangkatDaerahId) : undefined
    setForm((prev) => ({
      ...prev,
      peminjamPegawaiId: pegawaiIdStr,
      peminjamNama: peg ? peg.nama : prev.peminjamNama,
      peminjamInstansi: peg
        ? `${pd?.nama ?? ''}${peg.jabatan ? ` (${peg.jabatan})` : ''}`.trim()
        : prev.peminjamInstansi,
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!form.kendaraanId) {
      setFormError('Silakan pilih unit kendaraan berkondisi Baik terlebih dahulu.')
      return
    }

    const payload: PeminjamanInput = {
      kendaraanId: Number(form.kendaraanId),
      peminjamPegawaiId: form.peminjamPegawaiId
        ? Number(form.peminjamPegawaiId)
        : null,
      peminjamNama: form.peminjamNama,
      peminjamInstansi: form.peminjamInstansi,
      tujuanKeperluan: form.tujuanKeperluan,
      lokasiTujuan: form.lokasiTujuan,
      tanggalPinjam: form.tanggalPinjam,
      tanggalKembaliRencana: form.tanggalKembaliRencana,
      tanggalKembaliAktual: editingItem?.tanggalKembaliAktual ?? null,
      status: form.status,
      nomorSuratTugas: form.nomorSuratTugas,
      kilometerAwal: form.kilometerAwal.trim()
        ? Number(form.kilometerAwal)
        : null,
      kilometerAkhir: editingItem?.kilometerAkhir ?? null,
      kondisiSaatKembali: editingItem?.kondisiSaatKembali ?? null,
      catatan: form.catatan,
    }

    setSubmitting(true)
    try {
      const k = kendaraanMap.get(payload.kendaraanId)
      if (editingItem) {
        await updatePeminjaman(editingItem.id, payload)
        setFeedback(
          `Data peminjaman kendaraan ${k?.nomorPolisi ?? ''} berhasil diperbarui.`
        )
      } else {
        await createPeminjaman(payload)
        setFeedback(
          `Peminjaman kendaraan ${k?.nomorPolisi ?? ''} berhasil dicatat.`
        )
      }
      setFormOpen(false)
      await loadData()
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan data peminjaman kendaraan.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const openReturnModal = (item: PeminjamanKendaraan) => {
    setReturnTarget(item)
    setReturnError(null)
    setReturnForm({
      tanggalKembaliAktual: todayYmd(),
      kilometerAkhir:
        item.kilometerAwal !== null ? String(item.kilometerAwal) : '',
      kondisiSaatKembali: 'BAIK',
      catatan: '',
    })
  }

  const handleReturnSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!returnTarget) return
    setReturnError(null)
    setReturning(true)
    try {
      await completePeminjaman(returnTarget.id, {
        tanggalKembaliAktual: returnForm.tanggalKembaliAktual,
        kilometerAkhir: returnForm.kilometerAkhir.trim()
          ? Number(returnForm.kilometerAkhir)
          : null,
        kondisiSaatKembali: returnForm.kondisiSaatKembali,
        catatan: returnForm.catatan,
      })
      const k = kendaraanMap.get(returnTarget.kendaraanId)
      setReturnTarget(null)
      setFeedback(
        `Pengembalian unit ${k?.nomorPolisi ?? ''} berhasil dicatat dengan kondisi ${returnForm.kondisiSaatKembali.replace('_', ' ')}.`
      )
      await loadData()
    } catch (err) {
      setReturnError(
        err instanceof Error ? err.message : 'Gagal mencatat pengembalian unit.'
      )
    } finally {
      setReturning(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deletePeminjaman(deleteTarget.id)
      setDeleteTarget(null)
      setFeedback('Data peminjaman kendaraan berhasil dihapus.')
      await loadData()
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Gagal menghapus data peminjaman.'
      )
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <LoadingState label="Memuat status armada dan jadwal peminjaman KDO..." />
    )
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
            onClick={() => openCreateModal()}
            disabled={eligibleForFormList.length === 0}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1d4ed8] disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Catat Peminjaman
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
            <strong className="text-slate-800">{summary.terjadwalCount} jadwal</strong> pinjam berikutnya
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

      {/* Info Aturan Kelayakan Peminjaman */}
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

      {/* Bagian 1: Live Monitoring Armada */}
      <section className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0a3649]">
              Status Ketersediaan Armada Saat Ini
            </h2>
            <p className="text-xs text-slate-500">
              Pemantauan kesiapan seluruh unit KDO pada lingkup Perangkat Daerah aktif.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ['ALL', 'Semua Unit'],
                ['READY', 'Siap Dipinjam'],
                ['BORROWED', 'Sedang Dipinjam'],
                ['BLOCKED', 'Diblokir / Servis'],
              ] as Array<[FleetFilter, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFleetFilter(key)}
                className={`min-h-[34px] rounded-xl px-3 text-xs font-semibold transition-colors ${
                  fleetFilter === key
                    ? 'bg-[#0a3649] text-white'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filteredFleet.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Tidak ada unit pada kategori ini"
              description="Pilih kategori filter lain untuk melihat status armada KDO."
              actionLabel="Tampilkan Semua Unit"
              onAction={() => setFleetFilter('ALL')}
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="px-5 py-3.5">Plat &amp; Unit</th>
                    <th className="px-4 py-3.5">SKPD &amp; Parkir / Pengampu</th>
                    <th className="px-4 py-3.5">Kondisi Fisik</th>
                    <th className="px-4 py-3.5">Status Ketersediaan</th>
                    <th className="px-5 py-3.5 text-right">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredFleet.map(({ kendaraan: k, pd, holder, eval: ev }) => (
                    <tr key={k.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5 align-top">
                        <span className="inline-block rounded-md border border-slate-300 bg-slate-50 px-2.5 py-0.5 font-mono text-xs font-bold text-[#0a3649]">
                          {k.nomorPolisi}
                        </span>
                        <p className="mt-1 font-semibold text-slate-900">
                          {k.merek} {k.tipeModel}
                        </p>
                        <p className="text-xs text-slate-500">
                          Tahun {k.tahunProduksi} · {k.warna}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <p className="font-medium text-slate-900">
                          {pd?.singkatan ?? '-'} - {pd?.nama ?? '-'}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-600">
                          {k.lokasiParkir || 'Lokasi parkir belum diisi'}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {holder ? `Pengampu: ${holder.nama}` : 'Unit Pool SKPD'}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <KondisiBadge kondisi={k.kondisi} />
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        {!ev.eligible ? (
                          <div>
                            <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                              <Ban className="h-3 w-3" aria-hidden="true" />
                              Diblokir Pinjam
                            </span>
                            <p className="mt-1 text-xs text-rose-700">
                              {ev.blockReasons.join(' · ')}
                            </p>
                          </div>
                        ) : ev.activeLoan ? (
                          <div>
                            <StatusPeminjamanBadge status="DIPINJAM" />
                            <p className="mt-1 text-xs font-medium text-slate-800">
                              {ev.activeLoan.peminjamNama}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Rencana kembali:{' '}
                              {formatTanggalPendek(
                                ev.activeLoan.tanggalKembaliRencana
                              )}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                              Siap Dipinjam
                            </span>
                            {ev.scheduledCount > 0 && (
                              <p className="mt-1 text-[11px] text-amber-700">
                                {ev.scheduledCount} jadwal booking mendatang
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 align-top text-right">
                        {ev.eligible && !ev.activeLoan && canCreate ? (
                          <button
                            type="button"
                            onClick={() => openCreateModal(k.id)}
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#2563eb] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
                          >
                            <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
                            Pinjamkan
                          </button>
                        ) : ev.activeLoan && canUpdate ? (
                          <button
                            type="button"
                            onClick={() =>
                              ev.activeLoan && openReturnModal(ev.activeLoan)
                            }
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                          >
                            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                            Kembalikan
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {!ev.eligible ? 'Tidak Layak' : '-'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-200 lg:hidden">
              {filteredFleet.map(({ kendaraan: k, pd, eval: ev }) => (
                <div key={k.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block rounded border border-slate-300 bg-slate-50 px-2 py-0.5 font-mono text-xs font-bold text-[#0a3649]">
                        {k.nomorPolisi}
                      </span>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {k.merek} {k.tipeModel}
                      </p>
                      <p className="text-xs text-slate-500">
                        {pd?.singkatan ?? '-'} · {k.lokasiParkir || 'Pool SKPD'}
                      </p>
                    </div>
                    <KondisiBadge kondisi={k.kondisi} />
                  </div>

                  {!ev.eligible ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs text-rose-800">
                      <strong>Diblokir:</strong> {ev.blockReasons.join(' · ')}
                    </div>
                  ) : ev.activeLoan ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50/60 px-3 py-2 text-xs">
                      <div>
                        <p className="font-semibold text-[#1d4ed8]">
                          Dipinjam: {ev.activeLoan.peminjamNama}
                        </p>
                        <p className="text-slate-600">
                          Kembali:{' '}
                          {formatTanggalPendek(ev.activeLoan.tanggalKembaliRencana)}
                        </p>
                      </div>
                      {canUpdate && (
                        <button
                          type="button"
                          onClick={() =>
                            ev.activeLoan && openReturnModal(ev.activeLoan)
                          }
                          className="min-h-[34px] rounded-xl border border-emerald-300 bg-white px-3 font-semibold text-emerald-800"
                        >
                          Kembalikan
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Siap Dipinjam
                      </span>
                      {canCreate && (
                        <button
                          type="button"
                          onClick={() => openCreateModal(k.id)}
                          className="min-h-[36px] rounded-xl bg-[#2563eb] px-3 text-xs font-semibold text-white"
                        >
                          Pinjamkan
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Bagian 2: Pencarian & Tabel Transaksi Peminjaman */}
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

      {scopedPeminjamanList.length === 0 ? (
        <EmptyState
          title="Belum ada transaksi peminjaman"
          description="Catat peminjaman kendaraan berkondisi Baik agar histori penggunaan unit pool dan perjalanan dinas tercatat rapi."
          actionLabel={
            canCreate && eligibleForFormList.length > 0
              ? 'Catat Peminjaman Pertama'
              : undefined
          }
          onAction={
            canCreate && eligibleForFormList.length > 0
              ? () => openCreateModal()
              : undefined
          }
        />
      ) : filteredPeminjaman.length === 0 ? (
        <EmptyState
          title="Data peminjaman tidak ditemukan"
          description="Sesuaikan kata kunci pencarian atau pilih Semua Status."
          actionLabel="Reset Filter"
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
                    <th className="px-5 py-3.5">Periode &amp; Surat Tugas</th>
                    <th className="px-4 py-3.5">Kendaraan</th>
                    <th className="px-4 py-3.5">Peminjam &amp; Keperluan</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPeminjaman.map((item) => {
                    const k = kendaraanMap.get(item.kendaraanId)
                    const pd = k ? pdMap.get(k.perangkatDaerahId) : undefined
                    const isActiveBooking =
                      item.status === 'DIPINJAM' || item.status === 'TERJADWAL'
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3.5 align-top">
                          <p className="font-mono text-xs font-bold text-slate-900">
                            {formatTanggalPendek(item.tanggalPinjam)} s/d{' '}
                            {formatTanggalPendek(item.tanggalKembaliRencana)}
                          </p>
                          {item.tanggalKembaliAktual && (
                            <p className="mt-0.5 text-[11px] text-emerald-700">
                              Kembali aktual:{' '}
                              {formatTanggalPendek(item.tanggalKembaliAktual)}
                            </p>
                          )}
                          {item.nomorSuratTugas && (
                            <p className="mt-1 font-mono text-[11px] text-slate-500">
                              No: {item.nomorSuratTugas}
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
                          <p className="font-semibold text-slate-900">
                            {item.peminjamNama}
                          </p>
                          {item.peminjamInstansi && (
                            <p className="text-xs text-slate-500">
                              {item.peminjamInstansi}
                            </p>
                          )}
                          <p className="mt-1 line-clamp-1 text-xs text-slate-700">
                            {item.tujuanKeperluan}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <StatusPeminjamanBadge status={item.status} />
                          {item.kondisiSaatKembali && (
                            <p className="mt-1 text-[11px] text-slate-500">
                              Kembali: {item.kondisiSaatKembali.replace('_', ' ')}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3.5 align-top text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDetailItem(item)}
                              aria-label={`Detail peminjaman ${k?.nomorPolisi ?? ''}`}
                              title="Detail Peminjaman"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                            >
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            </button>
                            {isActiveBooking && canUpdate && (
                              <button
                                type="button"
                                onClick={() => openReturnModal(item)}
                                aria-label={`Selesaikan peminjaman ${k?.nomorPolisi ?? ''}`}
                                title="Catat Pengembalian Unit"
                                className="inline-flex h-9 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                              >
                                <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
                                Kembali
                              </button>
                            )}
                            {canUpdate && (
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                aria-label={`Edit peminjaman ${k?.nomorPolisi ?? ''}`}
                                title="Edit Peminjaman"
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
                                aria-label={`Hapus peminjaman ${k?.nomorPolisi ?? ''}`}
                                title="Hapus Peminjaman"
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
            {filteredPeminjaman.map((item) => {
              const k = kendaraanMap.get(item.kendaraanId)
              const pd = k ? pdMap.get(k.perangkatDaerahId) : undefined
              const isActiveBooking =
                item.status === 'DIPINJAM' || item.status === 'TERJADWAL'
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
                      <h3 className="mt-1.5 text-sm font-bold text-slate-900">
                        {item.peminjamNama}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {formatTanggalPendek(item.tanggalPinjam)} s/d{' '}
                        {formatTanggalPendek(item.tanggalKembaliRencana)} ·{' '}
                        {pd?.singkatan ?? '-'}
                      </p>
                    </div>
                    <StatusPeminjamanBadge status={item.status} />
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1">
                    <p className="font-medium text-slate-900">
                      {item.tujuanKeperluan}
                    </p>
                    {item.lokasiTujuan && (
                      <p className="text-slate-600">Lokasi: {item.lokasiTujuan}</p>
                    )}
                    {item.nomorSuratTugas && (
                      <p className="font-mono text-[11px] text-slate-500">
                        Surat Tugas: {item.nomorSuratTugas}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setDetailItem(item)}
                      className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      Detail
                    </button>
                    {isActiveBooking && canUpdate && (
                      <button
                        type="button"
                        onClick={() => openReturnModal(item)}
                        className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                      >
                        <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                        Kembali
                      </button>
                    )}
                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-[#0a3649]/30 bg-white px-3 text-xs font-semibold text-[#0a3649] hover:bg-slate-50"
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
                        className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50"
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

      {/* Modal Tambah / Edit Peminjaman */}
      <Modal
        isOpen={formOpen}
        title={
          editingItem
            ? 'Edit Data Peminjaman KDO'
            : 'Catat Peminjaman Kendaraan Dinas'
        }
        subtitle="Hanya unit berkondisi Baik, tidak sedang servis, dan pajak aktif yang tersedia di pilihan armada."
        maxWidthClass="max-w-2xl"
        onClose={() => setFormOpen(false)}
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
                htmlFor="pinjam-kendaraan"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Pilih Kendaraan Laik Jalan (Kondisi Baik){' '}
                <span className="text-rose-600">*</span>
              </label>
              <CustomSelect
                id="pinjam-kendaraan"
                required
                value={form.kendaraanId}
                onChange={(val) =>
                  setForm({ ...form, kendaraanId: val })
                }
                placeholder="-- Pilih KDO Berkondisi Baik --"
                searchPlaceholder="Cari plat nomor, merek, atau SKPD..."
                options={[
                  { value: '', label: '-- Pilih KDO Berkondisi Baik --' },
                  ...eligibleForFormList.map((k) => {
                    const pd = pdMap.get(k.perangkatDaerahId)
                    const ev = evaluateVehicleBorrowStatus(
                      k,
                      servisList,
                      peminjamanList,
                      editingItem?.id
                    )
                    return {
                      value: String(k.id),
                      label: `${k.nomorPolisi} - ${k.merek} ${k.tipeModel}`,
                      description: pd ? `${pd.singkatan} · ${pd.nama}` : '-',
                      badge: ev.activeLoan ? 'Sedang Dipinjam' : 'Siap',
                      dotClassName: ev.activeLoan
                        ? 'bg-blue-500'
                        : 'bg-emerald-500',
                    }
                  }),
                ]}
              />
              {blockedForFormList.length > 0 && (
                <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                  <p className="font-semibold text-slate-700">
                    Unit tidak dapat dipilih ({blockedForFormList.length} diblokir):
                  </p>
                  <p className="mt-0.5 leading-relaxed">
                    {blockedForFormList
                      .map(
                        (b) =>
                          `${b.kendaraan.nomorPolisi} (${b.eval.blockReasons.join(', ')})`
                      )
                      .join(' · ')}
                  </p>
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="pinjam-pegawai"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Pilih dari Daftar PNS (Opsional - Mengisi Otomatis Nama &amp; Instansi)
              </label>
              <CustomSelect
                id="pinjam-pegawai"
                value={form.peminjamPegawaiId}
                onChange={handleSelectPegawai}
                searchPlaceholder="Cari nama PNS, jabatan, atau SKPD..."
                options={[
                  {
                    value: '',
                    label: '-- Isi Manual atau Pilih PNS Terdaftar --',
                  },
                  ...scopedPegawaiList.map((p) => {
                    const pd = pdMap.get(p.perangkatDaerahId)
                    return {
                      value: String(p.id),
                      label: p.nama,
                      description: `${pd?.singkatan ?? '-'} · ${p.jabatan}`,
                    }
                  }),
                ]}
              />
            </div>

            <div>
              <label
                htmlFor="pinjam-nama"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Nama Peminjam <span className="text-rose-600">*</span>
              </label>
              <input
                id="pinjam-nama"
                type="text"
                required
                value={form.peminjamNama}
                onChange={(e) =>
                  setForm({ ...form, peminjamNama: e.target.value })
                }
                placeholder="Nama lengkap peminjam"
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="pinjam-instansi"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Bidang / Unit Kerja Peminjam
              </label>
              <input
                id="pinjam-instansi"
                type="text"
                value={form.peminjamInstansi}
                onChange={(e) =>
                  setForm({ ...form, peminjamInstansi: e.target.value })
                }
                placeholder="Contoh: Bidang Sarpras Disdik"
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="pinjam-tgl-mulai"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Tanggal Pinjam <span className="text-rose-600">*</span>
              </label>
              <input
                id="pinjam-tgl-mulai"
                type="date"
                required
                value={form.tanggalPinjam}
                onChange={(e) =>
                  setForm({ ...form, tanggalPinjam: e.target.value })
                }
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="pinjam-tgl-kembali"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Rencana Tanggal Kembali <span className="text-rose-600">*</span>
              </label>
              <input
                id="pinjam-tgl-kembali"
                type="date"
                required
                value={form.tanggalKembaliRencana}
                onChange={(e) =>
                  setForm({ ...form, tanggalKembaliRencana: e.target.value })
                }
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="pinjam-status"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Status Peminjaman
              </label>
              <CustomSelect
                id="pinjam-status"
                value={form.status}
                onChange={(val) =>
                  setForm({
                    ...form,
                    status: val as StatusPeminjaman,
                  })
                }
                options={STATUS_PEMINJAMAN_OPTIONS.map((opt) => ({
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
                }))}
              />
            </div>

            <div>
              <label
                htmlFor="pinjam-surat"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                No. Surat Tugas / SPPD (Opsional)
              </label>
              <input
                id="pinjam-surat"
                type="text"
                value={form.nomorSuratTugas}
                onChange={(e) =>
                  setForm({ ...form, nomorSuratTugas: e.target.value })
                }
                placeholder="Contoh: ST/DISDIK/214/XI/2026"
                className="h-11 w-full rounded-xl border border-slate-300 px-3 font-mono text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="pinjam-lokasi"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Lokasi Tujuan
              </label>
              <input
                id="pinjam-lokasi"
                type="text"
                value={form.lokasiTujuan}
                onChange={(e) =>
                  setForm({ ...form, lokasiTujuan: e.target.value })
                }
                placeholder="Contoh: Kantor Walikota Jakarta Selatan"
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="pinjam-km-awal"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Odometer Awal (km)
              </label>
              <input
                id="pinjam-km-awal"
                type="number"
                min={0}
                value={form.kilometerAwal}
                onChange={(e) =>
                  setForm({ ...form, kilometerAwal: e.target.value })
                }
                placeholder="Contoh: 31420"
                className="h-11 w-full rounded-xl border border-slate-300 px-3 font-mono text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="pinjam-tujuan"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Keperluan / Tugas Dinas <span className="text-rose-600">*</span>
              </label>
              <textarea
                id="pinjam-tujuan"
                rows={2}
                required
                value={form.tujuanKeperluan}
                onChange={(e) =>
                  setForm({ ...form, tujuanKeperluan: e.target.value })
                }
                placeholder="Contoh: Monitoring lapangan dan pengiriman dokumen dinas..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="pinjam-catatan"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Catatan Kondisi Awal / BBM (Opsional)
              </label>
              <input
                id="pinjam-catatan"
                type="text"
                value={form.catatan}
                onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                placeholder="Contoh: STNK & kunci cadangan diserahkan, BBM penuh"
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
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
              disabled={submitting}
              className="min-h-[44px] rounded-xl bg-[#2563eb] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8] disabled:opacity-60"
            >
              {submitting
                ? 'Menyimpan...'
                : editingItem
                  ? 'Simpan Perubahan'
                  : 'Simpan Peminjaman'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Pengembalian Unit */}
      <Modal
        isOpen={returnTarget !== null}
        title={
          returnTarget
            ? `Catat Pengembalian Unit - ${kendaraanMap.get(returnTarget.kendaraanId)?.nomorPolisi ?? 'KDO'}`
            : ''
        }
        subtitle="Verifikasi tanggal kembali aktual, odometer akhir, dan kondisi fisik kendaraan pasca pakai."
        onClose={() => setReturnTarget(null)}
      >
        {returnTarget && (
          <form onSubmit={handleReturnSubmit} className="space-y-4">
            {returnError && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
              >
                {returnError}
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700">
              <p>
                <strong>Peminjam:</strong> {returnTarget.peminjamNama}
              </p>
              <p className="mt-0.5">
                <strong>Pinjam:</strong>{' '}
                {formatTanggalPendek(returnTarget.tanggalPinjam)} s/d Rencana{' '}
                {formatTanggalPendek(returnTarget.tanggalKembaliRencana)}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="return-tgl"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Tanggal Kembali Aktual <span className="text-rose-600">*</span>
                </label>
                <input
                  id="return-tgl"
                  type="date"
                  required
                  value={returnForm.tanggalKembaliAktual}
                  onChange={(e) =>
                    setReturnForm({
                      ...returnForm,
                      tanggalKembaliAktual: e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="return-km"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Odometer Akhir (km)
                </label>
                <input
                  id="return-km"
                  type="number"
                  min={0}
                  value={returnForm.kilometerAkhir}
                  onChange={(e) =>
                    setReturnForm({
                      ...returnForm,
                      kilometerAkhir: e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 font-mono text-sm focus:border-[#0a3649] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="return-kondisi"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Kondisi Fisik Saat Kembali
                </label>
                <CustomSelect
                  id="return-kondisi"
                  value={returnForm.kondisiSaatKembali}
                  onChange={(val) =>
                    setReturnForm({
                      ...returnForm,
                      kondisiSaatKembali: val as KondisiKendaraan,
                    })
                  }
                  options={KONDISI_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                    dotClassName:
                      opt.value === 'BAIK'
                        ? 'bg-emerald-500'
                        : opt.value === 'RUSAK_RINGAN'
                          ? 'bg-amber-500'
                          : 'bg-rose-500',
                  }))}
                />
                {returnForm.kondisiSaatKembali !== 'BAIK' && (
                  <p className="mt-1.5 text-xs text-amber-800">
                    Catatan: Status kondisi pada master KDO akan otomatis diperbarui sesuai kondisi pengembalian dan unit akan diblokir dari peminjaman berikutnya.
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="return-catatan"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Catatan Pemeriksaan Pengembalian
                </label>
                <textarea
                  id="return-catatan"
                  rows={2}
                  value={returnForm.catatan}
                  onChange={(e) =>
                    setReturnForm({ ...returnForm, catatan: e.target.value })
                  }
                  placeholder="Contoh: Bodi aman, kunci dan STNK kembali lengkap..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#0a3649] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2.5 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setReturnTarget(null)}
                className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={returning}
                className="min-h-[44px] rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {returning ? 'Memproses...' : 'Konfirmasi Pengembalian'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Detail Peminjaman */}
      <Modal
        isOpen={detailItem !== null}
        title={
          detailItem
            ? `Detail Peminjaman - ${kendaraanMap.get(detailItem.kendaraanId)?.nomorPolisi ?? 'KDO'}`
            : ''
        }
        subtitle={
          detailItem ? getStatusPeminjamanLabel(detailItem.status) : undefined
        }
        onClose={() => setDetailItem(null)}
      >
        {detailItem &&
          (() => {
            const k = kendaraanMap.get(detailItem.kendaraanId)
            const pd = k ? pdMap.get(k.perangkatDaerahId) : undefined
            return (
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
                    <dd className="font-semibold text-slate-900">
                      {pd?.nama ?? '-'}
                    </dd>
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
                    <dd className="text-slate-900">
                      {detailItem.lokasiTujuan || '-'}
                    </dd>
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
                  <p className="mt-1 text-slate-800">
                    {detailItem.tujuanKeperluan}
                  </p>
                  {detailItem.catatan && (
                    <p className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-600">
                      Catatan: {detailItem.catatan}
                    </p>
                  )}
                </div>
              </div>
            )
          })()}
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Hapus Data Peminjaman?"
        message="Apakah Anda yakin ingin menghapus catatan peminjaman kendaraan ini dari riwayat monitoring?"
        isLoading={deleting}
        errorMessage={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
