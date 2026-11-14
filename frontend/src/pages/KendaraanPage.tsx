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
  Camera,
  Download,
  Eye,
  FileCheck2,
  Info,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { CustomSelect } from '../components/common/CustomSelect'
import { DocumentViewerModal } from '../components/common/DocumentViewerModal'
import { KondisiBadge } from '../components/common/KondisiBadge'
import { Modal } from '../components/common/Modal'
import { EmptyState, ErrorState, LoadingState } from '../components/common/StateViews'
import {
  createKendaraan,
  deleteKendaraan,
  listKendaraan,
  listPegawai,
  listPerangkatDaerah,
  listRiwayatByKendaraan,
  updateKendaraan,
} from '../services/bmdService'
import type {
  CrudPermission,
  JenisKendaraan,
  KendaraanDinas,
  KendaraanInput,
  KondisiKendaraan,
  Pegawai,
  PerangkatDaerah,
  RiwayatKendaraan,
  VehicleDocument,
  VehiclePhoto,
} from '../types/bmd'
import {
  formatNip,
  formatTanggalIndonesia,
  formatTanggalPendek,
  getJenisLabel,
  getJenisRiwayatLabel,
  getKondisiLabel,
  getTaxStatus,
  JENIS_KENDARAAN_OPTIONS,
  KONDISI_OPTIONS,
  LOKASI_PARKIR_PRESETS,
  MEREK_KENDARAAN_LIST,
} from '../utils/format'
import { compressVehicleImage, readVehicleDocument } from '../utils/imageUpload'

interface KendaraanPageProps {
  selectedPdId?: number | null
  readOnly?: boolean
  permission?: CrudPermission
}

interface FormState {
  nomorPolisi: string
  kodeBarang: string
  merekPilihan: string
  merekLainnya: string
  tipeModel: string
  jenis: JenisKendaraan
  tahunProduksi: string
  warna: string
  nomorRangka: string
  nomorMesin: string
  kondisi: KondisiKendaraan
  lokasiParkir: string
  keterangan: string
  fotos: VehiclePhoto[]
  dokumenStnk: VehicleDocument | null
  dokumenBpkb: VehicleDocument | null
  pajakTahunanJatuhTempo: string
  pajakLimaTahunanJatuhTempo: string
  perangkatDaerahId: string
  pegawaiId: string
  nomorBast: string
  catatanPerubahan: string
}

const MAX_TAHUN_PRODUKSI = new Date().getFullYear() + 1
const MAX_VEHICLE_PHOTOS = 6

function resolveMerekFields(merek: string): {
  merekPilihan: string
  merekLainnya: string
} {
  const matched = MEREK_KENDARAAN_LIST.find(
    (m) => m.toLowerCase() === merek.trim().toLowerCase()
  )
  if (matched) {
    return { merekPilihan: matched, merekLainnya: '' }
  }
  if (!merek.trim()) {
    return { merekPilihan: MEREK_KENDARAAN_LIST[0], merekLainnya: '' }
  }
  return { merekPilihan: 'LAINNYA', merekLainnya: merek }
}

function makeEmptyForm(defaultPdId: number | ''): FormState {
  return {
    nomorPolisi: '',
    kodeBarang: '',
    merekPilihan: MEREK_KENDARAAN_LIST[0],
    merekLainnya: '',
    tipeModel: '',
    jenis: 'RODA_4',
    tahunProduksi: String(new Date().getFullYear()),
    warna: '',
    nomorRangka: '',
    nomorMesin: '',
    kondisi: 'BAIK',
    lokasiParkir: '',
    keterangan: '',
    fotos: [],
    dokumenStnk: null,
    dokumenBpkb: null,
    pajakTahunanJatuhTempo: '',
    pajakLimaTahunanJatuhTempo: '',
    perangkatDaerahId: defaultPdId === '' ? '' : String(defaultPdId),
    pegawaiId: '',
    nomorBast: '',
    catatanPerubahan: '',
  }
}

export function KendaraanPage({
  selectedPdId = null,
  readOnly = false,
  permission,
}: KendaraanPageProps) {
  const canCreate = permission ? permission.create : !readOnly
  const canUpdate = permission ? permission.update : !readOnly
  const canDelete = permission ? permission.delete : !readOnly
  const [kendaraanList, setKendaraanList] = useState<KendaraanDinas[]>([])
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([])
  const [pdList, setPdList] = useState<PerangkatDaerah[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [search, setSearch] = useState('')
  const [filterKondisi, setFilterKondisi] = useState<string>('ALL')
  const [filterPdId, setFilterPdId] = useState<string>('ALL')
  const [filterPenugasan, setFilterPenugasan] = useState<string>('ALL')

  // Modal Form state
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<KendaraanDinas | null>(null)
  const [form, setForm] = useState<FormState>(() => makeEmptyForm(''))
  const [formError, setFormError] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [docUploading, setDocUploading] = useState<'STNK' | 'BPKB' | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Detail + Riwayat modal
  const [detailItem, setDetailItem] = useState<KendaraanDinas | null>(null)
  const [detailPhotoIndex, setDetailPhotoIndex] = useState(0)
  const [detailRiwayat, setDetailRiwayat] = useState<RiwayatKendaraan[]>([])
  const [previewDoc, setPreviewDoc] = useState<{
    doc: VehicleDocument
    title: string
  } | null>(null)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<KendaraanDinas | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [feedback, setFeedback] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [kdo, pns, pd] = await Promise.all([
        listKendaraan(),
        listPegawai(),
        listPerangkatDaerah(),
      ])
      setKendaraanList(kdo)
      setPegawaiList(pns)
      setPdList(pd)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data KDO.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([listKendaraan(), listPegawai(), listPerangkatDaerah()])
      .then(([kdo, pns, pd]) => {
        if (active) {
          setKendaraanList(kdo)
          setPegawaiList(pns)
          setPdList(pd)
          setError(null)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Gagal memuat data KDO.')
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
  const pegawaiMap = useMemo(
    () => new Map(pegawaiList.map((p) => [p.id, p])),
    [pegawaiList]
  )

  const effectivePdFilter =
    selectedPdId !== null ? String(selectedPdId) : filterPdId

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase()
    return kendaraanList.filter((item) => {
      if (filterKondisi !== 'ALL' && item.kondisi !== filterKondisi) {
        return false
      }
      if (
        effectivePdFilter !== 'ALL' &&
        item.perangkatDaerahId !== Number(effectivePdFilter)
      ) {
        return false
      }
      if (filterPenugasan === 'ASSIGNED' && item.pegawaiId === null) {
        return false
      }
      if (filterPenugasan === 'POOL' && item.pegawaiId !== null) {
        return false
      }
      if (q) {
        const pd = pdMap.get(item.perangkatDaerahId)
        const pj = item.pegawaiId ? pegawaiMap.get(item.pegawaiId) : undefined
        const haystack = [
          item.nomorPolisi,
          item.merek,
          item.tipeModel,
          item.kodeBarang,
          item.warna,
          item.lokasiParkir,
          pd?.nama ?? '',
          pd?.singkatan ?? '',
          pj?.nama ?? '',
          pj?.nip ?? '',
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [
    kendaraanList,
    filterKondisi,
    effectivePdFilter,
    filterPenugasan,
    search,
    pdMap,
    pegawaiMap,
  ])

  const availablePegawaiForForm = useMemo(() => {
    const pdIdNum = Number(form.perangkatDaerahId)
    if (!pdIdNum) return pegawaiList
    return pegawaiList.filter((p) => p.perangkatDaerahId === pdIdNum)
  }, [pegawaiList, form.perangkatDaerahId])

  const openCreateModal = () => {
    setEditingItem(null)
    setFormError(null)
    const defaultPdId =
      selectedPdId ?? (pdList.length > 0 ? pdList[0].id : '')
    setForm(makeEmptyForm(defaultPdId))
    setFormOpen(true)
  }

  const openEditModal = (item: KendaraanDinas) => {
    setEditingItem(item)
    setFormError(null)
    const merekFields = resolveMerekFields(item.merek)
    setForm({
      nomorPolisi: item.nomorPolisi,
      kodeBarang: item.kodeBarang,
      merekPilihan: merekFields.merekPilihan,
      merekLainnya: merekFields.merekLainnya,
      tipeModel: item.tipeModel,
      jenis: item.jenis,
      tahunProduksi: String(item.tahunProduksi),
      warna: item.warna,
      nomorRangka: item.nomorRangka,
      nomorMesin: item.nomorMesin,
      kondisi: item.kondisi,
      lokasiParkir: item.lokasiParkir ?? '',
      keterangan: item.keterangan,
      fotos: item.fotos ?? [],
      dokumenStnk: item.dokumenStnk ?? null,
      dokumenBpkb: item.dokumenBpkb ?? null,
      pajakTahunanJatuhTempo: item.pajakTahunanJatuhTempo ?? '',
      pajakLimaTahunanJatuhTempo: item.pajakLimaTahunanJatuhTempo ?? '',
      perangkatDaerahId: String(item.perangkatDaerahId),
      pegawaiId: item.pegawaiId ? String(item.pegawaiId) : '',
      nomorBast: '',
      catatanPerubahan: '',
    })
    setFormOpen(true)
  }

  const openDetailModal = async (item: KendaraanDinas) => {
    setDetailItem(item)
    setDetailPhotoIndex(0)
    const history = await listRiwayatByKendaraan(item.id)
    setDetailRiwayat(history)
  }

  const handleMultiplePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    e.target.value = ''
    if (files.length === 0) return

    const remainingSlots = MAX_VEHICLE_PHOTOS - form.fotos.length
    if (remainingSlots <= 0) {
      setFormError(`Maksimal ${MAX_VEHICLE_PHOTOS} foto per unit kendaraan.`)
      return
    }

    const selectedFiles = files.slice(0, remainingSlots)
    setFormError(null)
    setPhotoUploading(true)
    try {
      const processed = await Promise.all(
        selectedFiles.map((file) => compressVehicleImage(file))
      )
      setForm((prev) => ({
        ...prev,
        fotos: [...prev.fotos, ...processed].slice(0, MAX_VEHICLE_PHOTOS),
      }))
      if (files.length > remainingSlots) {
        setFormError(
          `Hanya ${remainingSlots} foto tambahan yang dimuat (batas maksimal ${MAX_VEHICLE_PHOTOS} foto per kendaraan).`
        )
      }
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Gagal memproses foto kendaraan.'
      )
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleRemovePhoto = (photoId: string) => {
    setForm((prev) => ({
      ...prev,
      fotos: prev.fotos.filter((f) => f.id !== photoId),
    }))
  }

  const handleDocumentUpload = async (
    kind: 'STNK' | 'BPKB',
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setFormError(null)
    setDocUploading(kind)
    try {
      const doc = await readVehicleDocument(file, kind)
      setForm((prev) =>
        kind === 'STNK'
          ? { ...prev, dokumenStnk: doc }
          : { ...prev, dokumenBpkb: doc }
      )
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : `Gagal mengunggah dokumen ${kind}.`
      )
    } finally {
      setDocUploading(null)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!form.perangkatDaerahId) {
      setFormError('Silakan pilih Perangkat Daerah pemilik kendaraan.')
      return
    }

    const resolvedMerek =
      form.merekPilihan === 'LAINNYA'
        ? form.merekLainnya.trim()
        : form.merekPilihan.trim()

    if (!resolvedMerek) {
      setFormError('Silakan pilih atau ketik merek kendaraan.')
      return
    }

    const payload: KendaraanInput = {
      nomorPolisi: form.nomorPolisi,
      kodeBarang: form.kodeBarang,
      merek: resolvedMerek,
      tipeModel: form.tipeModel,
      jenis: form.jenis,
      tahunProduksi: Number(form.tahunProduksi),
      warna: form.warna,
      nomorRangka: form.nomorRangka,
      nomorMesin: form.nomorMesin,
      kondisi: form.kondisi,
      lokasiParkir: form.lokasiParkir,
      keterangan: form.keterangan,
      fotos: form.fotos,
      dokumenStnk: form.dokumenStnk,
      dokumenBpkb: form.dokumenBpkb,
      pajakTahunanJatuhTempo: form.pajakTahunanJatuhTempo || null,
      pajakLimaTahunanJatuhTempo: form.pajakLimaTahunanJatuhTempo || null,
      perangkatDaerahId: Number(form.perangkatDaerahId),
      pegawaiId: form.pegawaiId ? Number(form.pegawaiId) : null,
      nomorBast: form.nomorBast,
      catatanPerubahan: form.catatanPerubahan,
    }

    setSubmitting(true)
    try {
      if (editingItem) {
        const updated = await updateKendaraan(editingItem.id, payload)
        setFeedback(`Data kendaraan ${updated.nomorPolisi} berhasil diperbarui.`)
      } else {
        const created = await createKendaraan(payload)
        setFeedback(`Kendaraan baru ${created.nomorPolisi} berhasil ditambahkan.`)
      }
      setFormOpen(false)
      await loadData()
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Gagal menyimpan data kendaraan.'
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
      await deleteKendaraan(deleteTarget.id)
      setFeedback(`Kendaraan ${deleteTarget.nomorPolisi} berhasil dihapus.`)
      setDeleteTarget(null)
      await loadData()
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Gagal menghapus kendaraan.'
      )
    } finally {
      setDeleting(false)
    }
  }

  const handleExportCsv = () => {
    const headers = [
      'Nomor Polisi',
      'Kode Barang',
      'Merek',
      'Tipe/Model',
      'Jenis',
      'Tahun Produksi',
      'Warna',
      'Kondisi',
      'Pajak Tahunan (PKB)',
      'Pajak & Plat 5 Tahunan',
      'Perangkat Daerah',
      'Penanggung Jawab (PNS)',
      'NIP Penanggung Jawab',
      'Keterangan',
    ]

    const escapeCsv = (val: string | number) => {
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }

    const rows = filteredList.map((item) => {
      const pd = pdMap.get(item.perangkatDaerahId)
      const pj = item.pegawaiId ? pegawaiMap.get(item.pegawaiId) : undefined
      return [
        item.nomorPolisi,
        item.kodeBarang || '-',
        item.merek,
        item.tipeModel,
        getJenisLabel(item.jenis),
        item.tahunProduksi,
        item.warna,
        getKondisiLabel(item.kondisi),
        item.pajakTahunanJatuhTempo ?? '-',
        item.pajakLimaTahunanJatuhTempo ?? '-',
        pd?.nama ?? '-',
        pj?.nama ?? 'Pool Perangkat Daerah',
        pj?.nip ?? '-',
        item.keterangan || '-',
      ]
        .map(escapeCsv)
        .join(',')
    })

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `inventaris-kdo-bmd-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const resetFilters = () => {
    setSearch('')
    setFilterKondisi('ALL')
    setFilterPdId('ALL')
    setFilterPenugasan('ALL')
  }

  if (loading) {
    return (
      <LoadingState label="Memuat inventaris Kendaraan Dinas Operasional..." />
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
            Inventaris Barang Milik Daerah
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0a3649] sm:text-3xl">
            Kendaraan Dinas Operasional (KDO)
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Kelola unit KDO, galeri foto kendaraan, dokumen STNK/BPKB, masa berlaku pajak, serta PNS penanggung jawab.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredList.length === 0}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export CSV
          </button>
          {canCreate && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1d4ed8]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Tambah KDO
            </button>
          )}
        </div>
      </div>

      {/* Feedback sukses */}
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

      {/* Filter & Pencarian */}
      <section
        aria-label="Filter dan pencarian kendaraan dinas"
        className="rounded-2xl border border-slate-200/80 bg-white p-4"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <label
              htmlFor="search-kdo"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Cari Nopol, Merek, Model, atau Penanggung Jawab
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="search-kdo"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Contoh: B 1042 PQA, Innova, Agus..."
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0a3649] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="filter-kondisi"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Kondisi Fisik
            </label>
            <CustomSelect
              id="filter-kondisi"
              value={filterKondisi}
              onChange={setFilterKondisi}
              options={[
                {
                  value: 'ALL',
                  label: 'Semua Kondisi',
                  dotClassName: 'bg-slate-400',
                },
                ...KONDISI_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                  dotClassName:
                    opt.value === 'BAIK'
                      ? 'bg-emerald-500'
                      : opt.value === 'RUSAK_RINGAN'
                        ? 'bg-amber-500'
                        : 'bg-rose-500',
                })),
              ]}
            />
          </div>

          <div>
            <label
              htmlFor="filter-pd"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Perangkat Daerah
            </label>
            <CustomSelect
              id="filter-pd"
              disabled={selectedPdId !== null}
              value={effectivePdFilter}
              onChange={setFilterPdId}
              searchPlaceholder="Cari perangkat daerah..."
              options={[
                { value: 'ALL', label: 'Semua Perangkat Daerah' },
                ...pdList.map((pd) => ({
                  value: String(pd.id),
                  label: `${pd.singkatan} - ${pd.nama}`,
                })),
              ]}
            />
          </div>

          <div>
            <label
              htmlFor="filter-penugasan"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Status Pemegang
            </label>
            <CustomSelect
              id="filter-penugasan"
              value={filterPenugasan}
              onChange={setFilterPenugasan}
              options={[
                { value: 'ALL', label: 'Semua Status' },
                {
                  value: 'ASSIGNED',
                  label: 'Dipegang PNS',
                  dotClassName: 'bg-blue-500',
                },
                {
                  value: 'POOL',
                  label: 'Pool Perangkat Daerah',
                  dotClassName: 'bg-slate-400',
                },
              ]}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
          <span>
            Menampilkan <strong className="text-slate-900">{filteredList.length}</strong> dari{' '}
            <strong className="text-slate-900">{kendaraanList.length}</strong> unit KDO
          </span>
          {(search ||
            filterKondisi !== 'ALL' ||
            filterPdId !== 'ALL' ||
            filterPenugasan !== 'ALL') && (
            <button
              type="button"
              onClick={resetFilters}
              className="font-semibold text-[#0a3649] underline hover:no-underline"
            >
              Reset Filter
            </button>
          )}
        </div>
      </section>

      {/* Tabel / Empty State */}
      {kendaraanList.length === 0 ? (
        <EmptyState
          title="Belum ada Kendaraan Dinas Operasional"
          description="Mulai pendataan BMD dengan menambahkan kendaraan dinas operasional pertama beserta perangkat daerah pemiliknya."
          actionLabel={canCreate ? 'Tambah KDO Pertama' : undefined}
          onAction={canCreate ? openCreateModal : undefined}
        />
      ) : filteredList.length === 0 ? (
        <EmptyState
          title="Tidak ada kendaraan yang cocok dengan filter"
          description="Ubah kata kunci pencarian atau setel ulang filter kondisi dan perangkat daerah untuk melihat data lainnya."
          actionLabel="Reset Filter"
          onAction={resetFilters}
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white lg:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="px-5 py-3.5">Nomor Polisi</th>
                    <th className="px-4 py-3.5">Merek &amp; Model</th>
                    <th className="px-4 py-3.5">Kondisi &amp; Pajak PKB</th>
                    <th className="px-4 py-3.5">Dokumen</th>
                    <th className="px-4 py-3.5">SKPD &amp; Penanggung Jawab</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredList.map((item) => {
                    const pd = pdMap.get(item.perangkatDaerahId)
                    const pj = item.pegawaiId
                      ? pegawaiMap.get(item.pegawaiId)
                      : undefined
                    const pkbStatus = getTaxStatus(item.pajakTahunanJatuhTempo)

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3.5 align-top">
                          <button
                            type="button"
                            onClick={() => openDetailModal(item)}
                            title="Klik plat nomor untuk melihat foto, no rangka/mesin, pajak & dokumen"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 font-mono text-xs font-bold text-[#0a3649] transition-colors hover:border-[#0a3649] hover:bg-[#0a3649] hover:text-white"
                          >
                            {item.nomorPolisi}
                          </button>
                          <p className="mt-1 font-mono text-[11px] text-slate-500">
                            {item.tahunProduksi} · {item.warna}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <p className="font-semibold text-slate-900">
                            {item.merek} {item.tipeModel}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {getJenisLabel(item.jenis)}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 align-top space-y-1.5">
                          <div>
                            <KondisiBadge kondisi={item.kondisi} />
                          </div>
                          {item.pajakTahunanJatuhTempo ? (
                            <p
                              className={`text-[11px] font-semibold ${
                                pkbStatus.status === 'OVERDUE'
                                  ? 'text-rose-700'
                                  : pkbStatus.status === 'WARNING'
                                    ? 'text-amber-700'
                                    : 'text-slate-600'
                              }`}
                            >
                              PKB: {formatTanggalPendek(item.pajakTahunanJatuhTempo)}
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400">
                              PKB belum diisi
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <div className="flex flex-col gap-1">
                            {item.dokumenStnk ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewDoc({
                                    doc: item.dokumenStnk!,
                                    title: `STNK - ${item.nomorPolisi}`,
                                  })
                                }
                                className="inline-flex w-fit items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
                              >
                                <Eye className="h-3 w-3" aria-hidden="true" />
                                STNK
                              </button>
                            ) : (
                              <span className="inline-flex w-fit items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                                STNK Kosong
                              </span>
                            )}
                            {item.dokumenBpkb ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewDoc({
                                    doc: item.dokumenBpkb!,
                                    title: `BPKB - ${item.nomorPolisi}`,
                                  })
                                }
                                className="inline-flex w-fit items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
                              >
                                <Eye className="h-3 w-3" aria-hidden="true" />
                                BPKB
                              </button>
                            ) : (
                              <span className="inline-flex w-fit items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                                BPKB Kosong
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <p className="font-semibold text-slate-900">
                            {pd?.singkatan ?? '-'}
                          </p>
                          {pj ? (
                            <p className="mt-0.5 text-xs text-slate-600">
                              {pj.nama}
                            </p>
                          ) : (
                            <span className="mt-0.5 inline-block text-xs text-slate-500">
                              Pool Dinas
                            </span>
                          )}
                          {item.lokasiParkir && (
                            <p className="mt-1 inline-flex items-start gap-1 text-[11px] text-slate-500">
                              <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-[#0a3649]" aria-hidden="true" />
                              <span className="line-clamp-2">{item.lokasiParkir}</span>
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3.5 align-top text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openDetailModal(item)}
                              aria-label={`Lihat detail ${item.nomorPolisi}`}
                              title="Detail & Riwayat"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                            >
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            </button>
                            {canUpdate && (
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                aria-label={`Edit ${item.nomorPolisi}`}
                                title="Edit Data"
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
                                aria-label={`Hapus ${item.nomorPolisi}`}
                                title="Hapus Data"
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

          {/* Mobile / Tablet Cards */}
          <div className="space-y-3 lg:hidden">
            {filteredList.map((item) => {
              const pd = pdMap.get(item.perangkatDaerahId)
              const pj = item.pegawaiId
                ? pegawaiMap.get(item.pegawaiId)
                : undefined
              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <button
                        type="button"
                        onClick={() => openDetailModal(item)}
                        className="inline-block rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 font-mono text-xs font-bold text-[#0a3649] transition-colors hover:border-[#0a3649] hover:bg-[#0a3649] hover:text-white"
                      >
                        {item.nomorPolisi}
                      </button>
                      <h2 className="mt-1.5 text-base font-bold text-slate-900">
                        {item.merek} {item.tipeModel}
                      </h2>
                      <p className="text-xs text-slate-600">
                        {getJenisLabel(item.jenis)} · {item.tahunProduksi} · {item.warna}
                      </p>
                    </div>
                    <KondisiBadge kondisi={item.kondisi} />
                  </div>

                  <div className="grid grid-cols-1 gap-2 rounded-xl bg-slate-50 p-3 text-xs sm:grid-cols-2">
                    <div>
                      <span className="text-slate-500">Perangkat Daerah:</span>
                      <p className="font-semibold text-slate-900">
                        {pd?.nama ?? '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Penanggung Jawab:</span>
                      <p className="font-semibold text-slate-900">
                        {pj ? pj.nama : 'Pool Perangkat Daerah'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Jatuh Tempo PKB:</span>
                      <p className="font-semibold text-slate-900">
                        {formatTanggalPendek(item.pajakTahunanJatuhTempo)}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Dokumen:</span>
                      <p className="font-semibold text-slate-900">
                        STNK {item.dokumenStnk ? 'Ada' : 'Kosong'} · BPKB{' '}
                        {item.dokumenBpkb ? 'Ada' : 'Kosong'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => openDetailModal(item)}
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

      {/* Modal Tambah / Edit KDO */}
      <Modal
        isOpen={formOpen}
        title={
          editingItem
            ? `Edit Kendaraan ${editingItem.nomorPolisi}`
            : 'Tambah Kendaraan Dinas Baru'
        }
        subtitle="Lengkapi identitas unit, masa berlaku pajak Samsat, foto fisik, dan dokumen legalitas STNK/BPKB."
        onClose={() => setFormOpen(false)}
        maxWidthClass="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800"
            >
              {formError}
            </div>
          )}

          {/* Bagian 1: Identitas & Kondisi Kendaraan */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0a3649] text-xs font-bold text-white">
                1
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Identitas, Kondisi &amp; Penanggung Jawab
                </h3>
                <p className="text-xs text-slate-500">
                  Informasi dasar unit KDO dan penugasan ke Perangkat Daerah / PNS.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="kdo-nopol"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Nomor Polisi Kendaraan <span className="text-rose-600">*</span>
                </label>
                <input
                  id="kdo-nopol"
                  type="text"
                  required
                  value={form.nomorPolisi}
                  onChange={(e) =>
                    setForm({ ...form, nomorPolisi: e.target.value.toUpperCase() })
                  }
                  placeholder="Contoh: B 1042 PQA"
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 font-mono text-sm uppercase focus:border-[#0a3649] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="kdo-kode"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Kode Barang BMD (Opsional)
                </label>
                <input
                  id="kdo-kode"
                  type="text"
                  value={form.kodeBarang}
                  onChange={(e) =>
                    setForm({ ...form, kodeBarang: e.target.value })
                  }
                  placeholder="Contoh: 1.3.2.02.01.02.003-0001"
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 font-mono text-sm focus:border-[#0a3649] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="kdo-merek-select"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Merek Kendaraan <span className="text-rose-600">*</span>
                </label>
                <CustomSelect
                  id="kdo-merek-select"
                  value={form.merekPilihan}
                  onChange={(val) =>
                    setForm({ ...form, merekPilihan: val })
                  }
                  searchPlaceholder="Cari merek kendaraan..."
                  options={[
                    ...MEREK_KENDARAAN_LIST.map((m) => ({
                      value: m,
                      label: m,
                    })),
                    { value: 'LAINNYA', label: 'Lainnya (Ketik Manual)' },
                  ]}
                />
                {form.merekPilihan === 'LAINNYA' && (
                  <input
                    id="kdo-merek-custom"
                    type="text"
                    required
                    aria-label="Ketik merek kendaraan lainnya"
                    value={form.merekLainnya}
                    onChange={(e) =>
                      setForm({ ...form, merekLainnya: e.target.value })
                    }
                    placeholder="Ketik nama merek kendaraan..."
                    className="mt-2 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
                  />
                )}
              </div>

              <div>
                <label
                  htmlFor="kdo-model"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Tipe atau Model <span className="text-rose-600">*</span>
                </label>
                <input
                  id="kdo-model"
                  type="text"
                  required
                  value={form.tipeModel}
                  onChange={(e) =>
                    setForm({ ...form, tipeModel: e.target.value })
                  }
                  placeholder="Contoh: Kijang Innova Zenix 2.0 G"
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="kdo-jenis"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Jenis Kendaraan <span className="text-rose-600">*</span>
                </label>
                <CustomSelect
                  id="kdo-jenis"
                  value={form.jenis}
                  onChange={(val) =>
                    setForm({ ...form, jenis: val as JenisKendaraan })
                  }
                  options={JENIS_KENDARAAN_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="kdo-tahun"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Tahun Produksi <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="kdo-tahun"
                    type="number"
                    required
                    min={1980}
                    max={MAX_TAHUN_PRODUKSI}
                    value={form.tahunProduksi}
                    onChange={(e) =>
                      setForm({ ...form, tahunProduksi: e.target.value })
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 font-mono text-sm focus:border-[#0a3649] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="kdo-warna"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Warna <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="kdo-warna"
                    type="text"
                    required
                    value={form.warna}
                    onChange={(e) => setForm({ ...form, warna: e.target.value })}
                    placeholder="Hitam / Putih"
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="kdo-kondisi"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Kondisi / Status Kendaraan <span className="text-rose-600">*</span>
                </label>
                <CustomSelect
                  id="kdo-kondisi"
                  value={form.kondisi}
                  onChange={(val) =>
                    setForm({
                      ...form,
                      kondisi: val as KondisiKendaraan,
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
              </div>

              <div>
                <label
                  htmlFor="kdo-pd"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Perangkat Daerah Pemilik <span className="text-rose-600">*</span>
                </label>
                <CustomSelect
                  id="kdo-pd"
                  required
                  value={form.perangkatDaerahId}
                  onChange={(newPdId) => {
                    const currentPj = pegawaiList.find(
                      (p) => String(p.id) === form.pegawaiId
                    )
                    const keepPj =
                      currentPj && String(currentPj.perangkatDaerahId) === newPdId
                        ? form.pegawaiId
                        : ''
                    setForm({
                      ...form,
                      perangkatDaerahId: newPdId,
                      pegawaiId: keepPj,
                    })
                  }}
                  placeholder="-- Pilih Perangkat Daerah --"
                  searchPlaceholder="Cari perangkat daerah..."
                  options={[
                    { value: '', label: '-- Pilih Perangkat Daerah --' },
                    ...pdList.map((pd) => ({
                      value: String(pd.id),
                      label: `${pd.singkatan} - ${pd.nama}`,
                    })),
                  ]}
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="kdo-pegawai"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Pegawai Negeri Sipil (PNS) Penanggung Jawab
                </label>
                <CustomSelect
                  id="kdo-pegawai"
                  value={form.pegawaiId}
                  onChange={(val) => setForm({ ...form, pegawaiId: val })}
                  searchPlaceholder="Cari nama, NIP, atau golongan PNS..."
                  options={[
                    {
                      value: '',
                      label: 'Pool Perangkat Daerah (Belum Ada Penanggung Jawab)',
                    },
                    ...availablePegawaiForForm.map((p) => ({
                      value: String(p.id),
                      label: `${p.nama} (${p.golongan})`,
                      description: `NIP ${p.nip} · ${p.jabatan}`,
                    })),
                  ]}
                />
              </div>

              <div>
                <label
                  htmlFor="kdo-rangka"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Nomor Rangka (Opsional)
                </label>
                <input
                  id="kdo-rangka"
                  type="text"
                  value={form.nomorRangka}
                  onChange={(e) =>
                    setForm({ ...form, nomorRangka: e.target.value.toUpperCase() })
                  }
                  placeholder="Nomor rangka sesuai STNK/BPKB"
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 font-mono text-sm uppercase focus:border-[#0a3649] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="kdo-mesin"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Nomor Mesin (Opsional)
                </label>
                <input
                  id="kdo-mesin"
                  type="text"
                  value={form.nomorMesin}
                  onChange={(e) =>
                    setForm({ ...form, nomorMesin: e.target.value.toUpperCase() })
                  }
                  placeholder="Nomor mesin sesuai STNK/BPKB"
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 font-mono text-sm uppercase focus:border-[#0a3649] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="kdo-keterangan"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Keterangan Operasional &amp; Catatan Kondisi Fisik
                </label>
                <textarea
                  id="kdo-keterangan"
                  rows={2}
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  placeholder="Catatan penggunaan kendaraan atau rincian kondisi fisik..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#0a3649] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bagian 2: Form Lokasi Parkir & Penempatan Fisik (Terpisah) */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0a3649] text-xs font-bold text-white">
                  2
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Lokasi Parkir &amp; Penempatan Fisik
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lokasi gedung parkir, pool SKPD, atau posisi penyimpanan kendaraan saat ini.
                  </p>
                </div>
              </div>
              <MapPin className="h-4 w-4 text-[#0a3649]" aria-hidden="true" />
            </div>

            <div className="p-5 space-y-3">
              <div>
                <label
                  htmlFor="kdo-lokasi-parkir"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Lokasi Parkir Utama
                </label>
                <input
                  id="kdo-lokasi-parkir"
                  type="text"
                  value={form.lokasiParkir}
                  onChange={(e) =>
                    setForm({ ...form, lokasiParkir: e.target.value })
                  }
                  placeholder="Contoh: Basement Gedung Dinas Pendidikan Lt. B1 / Pool Barat"
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
                />
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-medium text-slate-500">
                  Pilih cepat lokasi umum:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {LOKASI_PARKIR_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setForm({ ...form, lokasiParkir: preset })}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        form.lokasiParkir === preset
                          ? 'border-[#0a3649] bg-[#0a3649] text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bagian 3: Masa Berlaku Pajak & Plat Nomor (sesuai gambar referensi 2) */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#2563eb] text-xs font-bold text-white">
                  3
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Masa Berlaku Pajak &amp; Plat Nomor
                  </h3>
                  <p className="text-xs text-slate-500">
                    Jadwal jatuh tempo pajak tahunan (PKB) &amp; pajak plat 5 tahunan untuk pengingat otomatis
                  </p>
                </div>
              </div>
              <span className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Pengingat Samsat
              </span>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="kdo-pajak-tahunan"
                    className="mb-1.5 block text-xs font-bold text-slate-800"
                  >
                    Jatuh Tempo Pajak Tahunan (PKB)
                  </label>
                  <input
                    id="kdo-pajak-tahunan"
                    type="date"
                    value={form.pajakTahunanJatuhTempo}
                    onChange={(e) =>
                      setForm({ ...form, pajakTahunanJatuhTempo: e.target.value })
                    }
                    className="h-11 w-full rounded-full border border-slate-300 bg-white px-4 font-mono text-sm text-slate-900 focus:border-[#0a3649] focus:outline-none"
                  />
                  <p className="mt-1.5 text-xs text-slate-500">
                    Tanggal perpanjangan STNK tahunan berikutnya
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="kdo-pajak-5tahunan"
                    className="mb-1.5 block text-xs font-bold text-slate-800"
                  >
                    Jatuh Tempo Pajak &amp; Plat 5 Tahunan
                  </label>
                  <input
                    id="kdo-pajak-5tahunan"
                    type="date"
                    value={form.pajakLimaTahunanJatuhTempo}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        pajakLimaTahunanJatuhTempo: e.target.value,
                      })
                    }
                    className="h-11 w-full rounded-full border border-slate-300 bg-white px-4 font-mono text-sm text-slate-900 focus:border-[#0a3649] focus:outline-none"
                  />
                  <p className="mt-1.5 text-xs text-slate-500">
                    Tanggal penggantian plat kaleng / TNKB 5 tahunan
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-sky-200/80 bg-sky-50/50 px-4 py-3 text-xs leading-relaxed text-slate-700">
                <Info
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#0a3649]"
                  aria-hidden="true"
                />
                <p>
                  Tanggal ini akan otomatis membuat entri pengingat pada halaman{' '}
                  <strong className="text-slate-900">Dokumen &amp; Pajak</strong>{' '}
                  dan memicu notifikasi peringatan jika waktu jatuh tempo tersisa &lt; 30 hari.
                </p>
              </div>
            </div>
          </div>

          {/* Bagian 4: Multi-Foto Kendaraan & Upload Dokumen STNK / BPKB */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0a3649] text-xs font-bold text-white">
                4
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Galeri Foto Kendaraan &amp; Dokumen STNK / BPKB
                </h3>
                <p className="text-xs text-slate-500">
                  Unggah hingga {MAX_VEHICLE_PHOTOS} foto fisik (JPG, JPEG, PNG otomatis dikonversi ke WebP) serta dokumen STNK dan BPKB.
                </p>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Multi-foto uploader */}
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    Foto Fisik Kendaraan ({form.fotos.length}/{MAX_VEHICLE_PHOTOS})
                  </span>
                  {form.fotos.length < MAX_VEHICLE_PHOTOS && (
                    <label
                      htmlFor="kdo-multi-foto"
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#0a3649] hover:bg-slate-50"
                    >
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                      {photoUploading ? 'Memproses...' : 'Tambah Foto (Bisa > 1)'}
                    </label>
                  )}
                  <input
                    id="kdo-multi-foto"
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleMultiplePhotoChange}
                    disabled={photoUploading}
                    className="sr-only"
                  />
                </div>

                {form.fotos.length === 0 ? (
                  <label
                    htmlFor="kdo-multi-foto"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-6 text-center hover:bg-slate-100/70"
                  >
                    <Camera className="h-6 w-6 text-slate-400" aria-hidden="true" />
                    <p className="mt-2 text-xs font-semibold text-slate-700">
                      Klik untuk memilih satu atau beberapa foto kendaraan
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      JPG, JPEG, PNG, atau WebP (otomatis dikonversi menjadi .webp)
                    </p>
                  </label>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {form.fotos.map((photo, index) => (
                      <div
                        key={photo.id}
                        className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                      >
                        <img
                          src={photo.dataUrl}
                          alt={`Foto ${index + 1}: ${photo.name}`}
                          width={240}
                          height={160}
                          className="h-28 w-full object-cover"
                        />
                        {index === 0 && (
                          <span className="absolute left-2 top-2 rounded bg-[#0a3649]/90 px-2 py-0.5 text-[10px] font-bold text-white">
                            Utama
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(photo.id)}
                          aria-label={`Hapus foto ${photo.name}`}
                          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-700 text-white shadow hover:bg-rose-800"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dokumen STNK & BPKB */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* STNK */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      Dokumen STNK
                    </span>
                    {form.dokumenStnk && (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        Terunggah
                      </span>
                    )}
                  </div>

                  {form.dokumenStnk ? (
                    <div className="mt-2.5 space-y-2">
                      <p className="truncate font-mono text-xs text-slate-700">
                        {form.dokumenStnk.fileName}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={form.dokumenStnk.dataUrl}
                          download={form.dokumenStnk.fileName}
                          className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Download className="h-3.5 w-3.5" aria-hidden="true" />
                          Unduh
                        </a>
                        <label
                          htmlFor="kdo-doc-stnk"
                          className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-[#0a3649] hover:bg-slate-50"
                        >
                          Ganti
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setForm({ ...form, dokumenStnk: null })
                          }
                          className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2.5">
                      <label
                        htmlFor="kdo-doc-stnk"
                        className="inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-[#0a3649] hover:bg-slate-50"
                      >
                        <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                        {docUploading === 'STNK'
                          ? 'Mengunggah...'
                          : 'Upload STNK (PDF / Gambar)'}
                      </label>
                    </div>
                  )}
                  <input
                    id="kdo-doc-stnk"
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    onChange={(e) => handleDocumentUpload('STNK', e)}
                    disabled={docUploading !== null}
                    className="sr-only"
                  />
                </div>

                {/* BPKB */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      Dokumen BPKB
                    </span>
                    {form.dokumenBpkb && (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        Terunggah
                      </span>
                    )}
                  </div>

                  {form.dokumenBpkb ? (
                    <div className="mt-2.5 space-y-2">
                      <p className="truncate font-mono text-xs text-slate-700">
                        {form.dokumenBpkb.fileName}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={form.dokumenBpkb.dataUrl}
                          download={form.dokumenBpkb.fileName}
                          className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Download className="h-3.5 w-3.5" aria-hidden="true" />
                          Unduh
                        </a>
                        <label
                          htmlFor="kdo-doc-bpkb"
                          className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-[#0a3649] hover:bg-slate-50"
                        >
                          Ganti
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setForm({ ...form, dokumenBpkb: null })
                          }
                          className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2.5">
                      <label
                        htmlFor="kdo-doc-bpkb"
                        className="inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-[#0a3649] hover:bg-slate-50"
                      >
                        <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                        {docUploading === 'BPKB'
                          ? 'Mengunggah...'
                          : 'Upload BPKB (PDF / Gambar)'}
                      </label>
                    </div>
                  )}
                  <input
                    id="kdo-doc-bpkb"
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    onChange={(e) => handleDocumentUpload('BPKB', e)}
                    disabled={docUploading !== null}
                    className="sr-only"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bagian Catatan Riwayat / BAST */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <p className="text-xs font-bold text-[#0a3649]">
              Pencatatan Riwayat / BAST (Otomatis tercatat bila ada perubahan kondisi, SKPD, atau penanggung jawab)
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="kdo-bast"
                  className="mb-1 block text-xs font-medium text-slate-700"
                >
                  Nomor BAST / Surat Tugas (Opsional)
                </label>
                <input
                  id="kdo-bast"
                  type="text"
                  value={form.nomorBast}
                  onChange={(e) =>
                    setForm({ ...form, nomorBast: e.target.value })
                  }
                  placeholder="Contoh: BAST/DISDIK/045/2026"
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 font-mono text-xs focus:border-[#0a3649] focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="kdo-catatan-riwayat"
                  className="mb-1 block text-xs font-medium text-slate-700"
                >
                  Catatan Perubahan (Opsional)
                </label>
                <input
                  id="kdo-catatan-riwayat"
                  type="text"
                  value={form.catatanPerubahan}
                  onChange={(e) =>
                    setForm({ ...form, catatanPerubahan: e.target.value })
                  }
                  placeholder="Alasan serah terima / perubahan kondisi"
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs focus:border-[#0a3649] focus:outline-none"
                />
              </div>
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
              disabled={submitting || photoUploading || docUploading !== null}
              className="min-h-[44px] rounded-xl bg-[#2563eb] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8] disabled:opacity-60"
            >
              {submitting
                ? 'Menyimpan...'
                : editingItem
                  ? 'Simpan Perubahan'
                  : 'Simpan Kendaraan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail & Timeline Riwayat KDO */}
      <Modal
        isOpen={detailItem !== null}
        title={detailItem ? `Detail KDO ${detailItem.nomorPolisi}` : ''}
        subtitle={
          detailItem
            ? `${detailItem.merek} ${detailItem.tipeModel} (${detailItem.tahunProduksi})`
            : undefined
        }
        onClose={() => setDetailItem(null)}
        maxWidthClass="max-w-3xl"
      >
        {detailItem && (() => {
          const pd = pdMap.get(detailItem.perangkatDaerahId)
          const pj = detailItem.pegawaiId
            ? pegawaiMap.get(detailItem.pegawaiId)
            : undefined
          const fotos = detailItem.fotos ?? []
          const activePhoto = fotos[detailPhotoIndex] ?? fotos[0]
          const pkbStatus = getTaxStatus(detailItem.pajakTahunanJatuhTempo)
          const platStatus = getTaxStatus(detailItem.pajakLimaTahunanJatuhTempo)

          return (
            <div className="space-y-6">
              {/* Galeri Foto Kendaraan */}
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
                          onClick={() => setDetailPhotoIndex(idx)}
                          className={`overflow-hidden rounded-lg border-2 transition-all ${
                            idx === detailPhotoIndex
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

              {/* Pajak & Dokumen STNK / BPKB */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4 space-y-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-[#2563eb]" aria-hidden="true" />
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
                        {formatTanggalPendek(
                          detailItem.pajakLimaTahunanJatuhTempo
                        )}{' '}
                        ({platStatus.label})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 space-y-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="h-4 w-4 text-[#0a3649]" aria-hidden="true" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Dokumen STNK &amp; BPKB
                    </h3>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    {detailItem.dokumenStnk ? (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                        <span className="truncate font-mono font-semibold text-emerald-900">
                          STNK: {detailItem.dokumenStnk.fileName}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDoc({
                                doc: detailItem.dokumenStnk!,
                                title: `STNK - ${detailItem.nomorPolisi}`,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-md bg-[#0a3649] px-2.5 py-1 font-semibold text-white hover:bg-[#072836]"
                          >
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                            Lihat
                          </button>
                          <a
                            href={detailItem.dokumenStnk.dataUrl}
                            download={detailItem.dokumenStnk.fileName}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-white px-2.5 py-1 font-semibold text-emerald-800 hover:bg-emerald-100"
                          >
                            <Download className="h-3.5 w-3.5" aria-hidden="true" />
                            Unduh
                          </a>
                        </div>
                      </div>
                    ) : (
                      <span className="inline-block rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-500">
                        STNK belum diunggah
                      </span>
                    )}

                    {detailItem.dokumenBpkb ? (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                        <span className="truncate font-mono font-semibold text-emerald-900">
                          BPKB: {detailItem.dokumenBpkb.fileName}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDoc({
                                doc: detailItem.dokumenBpkb!,
                                title: `BPKB - ${detailItem.nomorPolisi}`,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-md bg-[#0a3649] px-2.5 py-1 font-semibold text-white hover:bg-[#072836]"
                          >
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                            Lihat
                          </button>
                          <a
                            href={detailItem.dokumenBpkb.dataUrl}
                            download={detailItem.dokumenBpkb.fileName}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-white px-2.5 py-1 font-semibold text-emerald-800 hover:bg-emerald-100"
                          >
                            <Download className="h-3.5 w-3.5" aria-hidden="true" />
                            Unduh
                          </a>
                        </div>
                      </div>
                    ) : (
                      <span className="inline-block rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-500">
                        BPKB belum diunggah
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4 space-y-2.5 text-sm">
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

                <div className="rounded-xl border border-slate-200 p-4 space-y-2.5 text-sm">
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

              {/* Riwayat Kendaraan */}
              <div>
                <h3 className="text-sm font-bold text-[#0a3649]">
                  Riwayat Penanggung Jawab &amp; Kondisi Kendaraan
                </h3>
                {detailRiwayat.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">
                    Belum ada catatan riwayat perubahan untuk kendaraan ini.
                  </p>
                ) : (
                  <ol className="mt-3 space-y-2.5">
                    {detailRiwayat.map((log) => (
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
                            <strong>
                              {log.pegawaiNamaSnapshot ?? 'Pool Dinas'}
                            </strong>
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
          )
        })()}
      </Modal>

      <DocumentViewerModal
        doc={previewDoc?.doc ?? null}
        title={previewDoc?.title ?? 'Pratinjau Dokumen'}
        onClose={() => setPreviewDoc(null)}
      />

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Hapus Kendaraan Dinas?"
        message={
          deleteTarget
            ? `Apakah Anda yakin ingin menghapus data kendaraan ${deleteTarget.nomorPolisi} (${deleteTarget.merek} ${deleteTarget.tipeModel}) beserta seluruh log riwayatnya?`
            : ''
        }
        isLoading={deleting}
        errorMessage={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
