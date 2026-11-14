import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Car, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { CustomSelect } from '../components/common/CustomSelect'
import { KondisiBadge } from '../components/common/KondisiBadge'
import { Modal } from '../components/common/Modal'
import { EmptyState, ErrorState, LoadingState } from '../components/common/StateViews'
import {
  createPegawai,
  deletePegawai,
  listKendaraan,
  listPegawai,
  listPerangkatDaerah,
  updatePegawai,
} from '../services/bmdService'
import type {
  CrudPermission,
  KendaraanDinas,
  Pegawai,
  PegawaiInput,
  PerangkatDaerah,
} from '../types/bmd'
import { formatNip, GOLONGAN_PNS_MAP } from '../utils/format'

interface PegawaiFormState {
  nip: string
  nama: string
  jabatan: string
  golongan: string
  pangkat: string
  noHp: string
  email: string
  perangkatDaerahId: string
}

function makeEmptyForm(defaultPdId: number | ''): PegawaiFormState {
  return {
    nip: '',
    nama: '',
    jabatan: '',
    golongan: 'III/a',
    pangkat: 'Penata Muda',
    noHp: '',
    email: '',
    perangkatDaerahId: defaultPdId === '' ? '' : String(defaultPdId),
  }
}

export function PegawaiPage({
  selectedPdId = null,
  readOnly = false,
  permission,
}: {
  selectedPdId?: number | null
  readOnly?: boolean
  permission?: CrudPermission
}) {
  const canCreate = permission ? permission.create : !readOnly
  const canUpdate = permission ? permission.update : !readOnly
  const canDelete = permission ? permission.delete : !readOnly
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([])
  const [pdList, setPdList] = useState<PerangkatDaerah[]>([])
  const [kendaraanList, setKendaraanList] = useState<KendaraanDinas[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [filterPdId, setFilterPdId] = useState('ALL')
  const [filterGolongan, setFilterGolongan] = useState('ALL')

  // Form Modal
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Pegawai | null>(null)
  const [form, setForm] = useState<PegawaiFormState>(() => makeEmptyForm(''))
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Detail Modal
  const [detailItem, setDetailItem] = useState<Pegawai | null>(null)

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState<Pegawai | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [feedback, setFeedback] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [pns, pd, kdo] = await Promise.all([
        listPegawai(),
        listPerangkatDaerah(),
        listKendaraan(),
      ])
      setPegawaiList(pns)
      setPdList(pd)
      setKendaraanList(kdo)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal memuat data Pegawai Negeri Sipil.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([listPegawai(), listPerangkatDaerah(), listKendaraan()])
      .then(([pns, pd, kdo]) => {
        if (active) {
          setPegawaiList(pns)
          setPdList(pd)
          setKendaraanList(kdo)
          setError(null)
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Gagal memuat data Pegawai Negeri Sipil.'
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

  const kendaraanByPegawai = useMemo(() => {
    const map = new Map<number, KendaraanDinas[]>()
    for (const k of kendaraanList) {
      if (k.pegawaiId !== null) {
        const list = map.get(k.pegawaiId) ?? []
        list.push(k)
        map.set(k.pegawaiId, list)
      }
    }
    return map
  }, [kendaraanList])

  const activePdFilter = selectedPdId !== null ? String(selectedPdId) : filterPdId

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase()
    return pegawaiList.filter((item) => {
      if (
        activePdFilter !== 'ALL' &&
        item.perangkatDaerahId !== Number(activePdFilter)
      ) {
        return false
      }
      if (filterGolongan !== 'ALL' && item.golongan !== filterGolongan) {
        return false
      }
      if (q) {
        const pd = pdMap.get(item.perangkatDaerahId)
        const haystack = [
          item.nama,
          item.nip,
          item.jabatan,
          item.golongan,
          item.pangkat,
          pd?.nama ?? '',
          pd?.singkatan ?? '',
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [pegawaiList, activePdFilter, filterGolongan, search, pdMap])

  const openCreateModal = () => {
    setEditingItem(null)
    setFormError(null)
    const defaultPdId =
      selectedPdId !== null
        ? selectedPdId
        : pdList.length > 0
          ? pdList[0].id
          : ''
    setForm(makeEmptyForm(defaultPdId))
    setFormOpen(true)
  }

  const openEditModal = (item: Pegawai) => {
    setEditingItem(item)
    setFormError(null)
    setForm({
      nip: item.nip,
      nama: item.nama,
      jabatan: item.jabatan,
      golongan: item.golongan,
      pangkat: item.pangkat,
      noHp: item.noHp,
      email: item.email,
      perangkatDaerahId: String(item.perangkatDaerahId),
    })
    setFormOpen(true)
  }

  const handleGolonganChange = (newGolongan: string) => {
    const match = GOLONGAN_PNS_MAP.find((g) => g.golongan === newGolongan)
    setForm((prev) => ({
      ...prev,
      golongan: newGolongan,
      pangkat: match ? match.pangkat : prev.pangkat,
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!form.perangkatDaerahId) {
      setFormError('Silakan pilih Perangkat Daerah tempat pegawai bertugas.')
      return
    }

    const payload: PegawaiInput = {
      nip: form.nip,
      nama: form.nama,
      jabatan: form.jabatan,
      golongan: form.golongan,
      pangkat: form.pangkat,
      noHp: form.noHp,
      email: form.email,
      perangkatDaerahId: Number(form.perangkatDaerahId),
    }

    setSubmitting(true)
    try {
      if (editingItem) {
        const updated = await updatePegawai(editingItem.id, payload)
        setFeedback(`Data PNS ${updated.nama} berhasil diperbarui.`)
      } else {
        const created = await createPegawai(payload)
        setFeedback(`PNS baru ${created.nama} berhasil didaftarkan.`)
      }
      setFormOpen(false)
      await loadData()
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Gagal menyimpan data PNS.'
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
      await deletePegawai(deleteTarget.id)
      setFeedback(`Data PNS ${deleteTarget.nama} berhasil dihapus.`)
      setDeleteTarget(null)
      await loadData()
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Gagal menghapus data PNS.'
      )
    } finally {
      setDeleting(false)
    }
  }

  const resetFilters = () => {
    setSearch('')
    setFilterPdId('ALL')
    setFilterGolongan('ALL')
  }

  if (loading) {
    return <LoadingState label="Memuat data Pegawai Negeri Sipil (PNS)..." />
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
            Entitas Utama 2
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0a3649] sm:text-3xl">
            Pegawai Negeri Sipil (PNS)
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Kelola data pegawai penanggung jawab kendaraan dinas operasional beserta NIP, jabatan, golongan, dan perangkat daerah asalnya.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#1d4ed8]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tambah PNS
          </button>
        )}
      </div>

      {feedback && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
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
        aria-label="Filter dan pencarian pegawai negeri sipil"
        className="rounded-2xl border border-slate-200/80 bg-white p-4"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label
              htmlFor="search-pns"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Cari Nama, NIP, atau Jabatan
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="search-pns"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Contoh: Agus, 19780412..., Kepala Bidang..."
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0a3649] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="filter-pns-pd"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Perangkat Daerah
            </label>
            <CustomSelect
              id="filter-pns-pd"
              value={activePdFilter}
              disabled={selectedPdId !== null}
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
              htmlFor="filter-pns-gol"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Golongan
            </label>
            <CustomSelect
              id="filter-pns-gol"
              value={filterGolongan}
              onChange={setFilterGolongan}
              searchPlaceholder="Cari golongan atau pangkat..."
              options={[
                { value: 'ALL', label: 'Semua Golongan' },
                ...GOLONGAN_PNS_MAP.map((g) => ({
                  value: g.golongan,
                  label: `${g.golongan} (${g.pangkat})`,
                })),
              ]}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
          <span>
            Menampilkan <strong className="text-slate-900">{filteredList.length}</strong> dari{' '}
            <strong className="text-slate-900">{pegawaiList.length}</strong> pegawai PNS
          </span>
          {(search || filterPdId !== 'ALL' || filterGolongan !== 'ALL') && (
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

      {/* Tabel / Cards */}
      {pegawaiList.length === 0 ? (
        <EmptyState
          title="Belum ada Pegawai Negeri Sipil"
          description="Tambahkan data PNS agar kendaraan dinas operasional dapat ditetapkan penanggung jawabnya."
          actionLabel={canCreate ? 'Tambah PNS Pertama' : undefined}
          onAction={canCreate ? openCreateModal : undefined}
        />
      ) : filteredList.length === 0 ? (
        <EmptyState
          title="Tidak ada PNS yang cocok dengan filter"
          description="Sesuaikan kata kunci pencarian atau filter perangkat daerah dan golongan."
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
                    <th className="px-5 py-3.5">Nama &amp; NIP</th>
                    <th className="px-4 py-3.5">Jabatan</th>
                    <th className="px-4 py-3.5">Golongan / Pangkat</th>
                    <th className="px-4 py-3.5">Perangkat Daerah</th>
                    <th className="px-4 py-3.5">KDO Dipegang</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredList.map((item) => {
                    const pd = pdMap.get(item.perangkatDaerahId)
                    const heldVehicles = kendaraanByPegawai.get(item.id) ?? []
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3.5 align-top">
                          <p className="font-semibold text-slate-900">
                            {item.nama}
                          </p>
                          <p className="mt-0.5 font-mono text-xs text-slate-500">
                            {formatNip(item.nip)}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 align-top text-slate-700">
                          {item.jabatan}
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <span className="inline-block rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs font-semibold text-[#0a3649]">
                            {item.golongan}
                          </span>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.pangkat || '-'}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <p className="font-medium text-slate-900">
                            {pd?.nama ?? '-'}
                          </p>
                          {pd && (
                            <p className="mt-0.5 font-mono text-xs text-slate-500">
                              {pd.singkatan}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          {heldVehicles.length === 0 ? (
                            <span className="text-xs text-slate-500">
                              Tidak memegang unit
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {heldVehicles.map((k) => (
                                <span
                                  key={k.id}
                                  className="inline-flex items-center gap-1 rounded border border-[#0a3649]/20 bg-[#0a3649]/5 px-2 py-0.5 font-mono text-xs font-semibold text-[#0a3649]"
                                >
                                  <Car className="h-3 w-3" aria-hidden="true" />
                                  {k.nomorPolisi}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 align-top text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDetailItem(item)}
                              aria-label={`Lihat detail ${item.nama}`}
                              title="Detail Pegawai"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                            >
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            </button>
                            {canUpdate && (
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                aria-label={`Edit ${item.nama}`}
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
                                aria-label={`Hapus ${item.nama}`}
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

          {/* Mobile Cards */}
          <div className="space-y-3 lg:hidden">
            {filteredList.map((item) => {
              const pd = pdMap.get(item.perangkatDaerahId)
              const heldVehicles = kendaraanByPegawai.get(item.id) ?? []
              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        {item.nama}
                      </h2>
                      <p className="font-mono text-xs text-slate-500">
                        NIP {formatNip(item.nip)}
                      </p>
                    </div>
                    <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs font-semibold text-[#0a3649]">
                      {item.golongan}
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3 text-xs space-y-1.5">
                    <p>
                      <span className="text-slate-500">Jabatan: </span>
                      <span className="font-medium text-slate-900">
                        {item.jabatan}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-500">Perangkat Daerah: </span>
                      <span className="font-medium text-slate-900">
                        {pd?.nama ?? '-'}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-500">KDO Dipegang: </span>
                      <span className="font-mono font-semibold text-[#0a3649]">
                        {heldVehicles.length > 0
                          ? heldVehicles.map((k) => k.nomorPolisi).join(', ')
                          : 'Tidak ada'}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setDetailItem(item)}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      Detail
                    </button>
                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#0a3649]/30 bg-white px-3 text-xs font-semibold text-[#0a3649] hover:bg-slate-50"
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
                        className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50"
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

      {/* Modal Form Tambah / Edit PNS */}
      <Modal
        isOpen={formOpen}
        title={editingItem ? `Edit Data PNS: ${editingItem.nama}` : 'Tambah Pegawai Negeri Sipil Baru'}
        subtitle="Isi data kepegawaian PNS sesuai SK pangkat/jabatan terbaru."
        onClose={() => setFormOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800"
            >
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="pns-nip"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                NIP (18 Digit) <span className="text-rose-600">*</span>
              </label>
              <input
                id="pns-nip"
                type="text"
                required
                maxLength={22}
                value={form.nip}
                onChange={(e) => setForm({ ...form, nip: e.target.value })}
                placeholder="198509232010012011"
                className="h-11 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="pns-nama"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Nama Lengkap &amp; Gelar <span className="text-rose-600">*</span>
              </label>
              <input
                id="pns-nama"
                type="text"
                required
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Nama lengkap pegawai"
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="pns-jabatan"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Jabatan <span className="text-rose-600">*</span>
              </label>
              <input
                id="pns-jabatan"
                type="text"
                required
                value={form.jabatan}
                onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
                placeholder="Contoh: Kepala Seksi Pengawasan Infrastruktur"
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="pns-golongan"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Golongan Ruang <span className="text-rose-600">*</span>
              </label>
              <CustomSelect
                id="pns-golongan"
                value={form.golongan}
                onChange={handleGolonganChange}
                searchPlaceholder="Cari golongan atau pangkat..."
                options={GOLONGAN_PNS_MAP.map((g) => ({
                  value: g.golongan,
                  label: `${g.golongan} (${g.pangkat})`,
                }))}
              />
            </div>

            <div>
              <label
                htmlFor="pns-pangkat"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Pangkat
              </label>
              <input
                id="pns-pangkat"
                type="text"
                value={form.pangkat}
                onChange={(e) => setForm({ ...form, pangkat: e.target.value })}
                placeholder="Contoh: Penata Tingkat I"
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="pns-pd"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Perangkat Daerah Asal <span className="text-rose-600">*</span>
              </label>
              <CustomSelect
                id="pns-pd"
                required
                value={form.perangkatDaerahId}
                onChange={(val) =>
                  setForm({ ...form, perangkatDaerahId: val })
                }
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

            <div>
              <label
                htmlFor="pns-hp"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Nomor HP (Opsional)
              </label>
              <input
                id="pns-hp"
                type="tel"
                value={form.noHp}
                onChange={(e) => setForm({ ...form, noHp: e.target.value })}
                placeholder="0812xxxxxxxx"
                className="h-11 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="pns-email"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Email Kedinasan (Opsional)
              </label>
              <input
                id="pns-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="nama@jakarta.go.id"
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2.5 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] rounded-lg bg-[#0a3649] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#072836] disabled:opacity-60"
            >
              {submitting
                ? 'Menyimpan...'
                : editingItem
                  ? 'Simpan Perubahan'
                  : 'Simpan PNS'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail PNS */}
      <Modal
        isOpen={detailItem !== null}
        title={detailItem ? detailItem.nama : ''}
        subtitle={
          detailItem ? `NIP ${formatNip(detailItem.nip)}` : undefined
        }
        onClose={() => setDetailItem(null)}
      >
        {detailItem && (() => {
          const pd = pdMap.get(detailItem.perangkatDaerahId)
          const heldVehicles = kendaraanByPegawai.get(detailItem.id) ?? []
          return (
            <div className="space-y-5">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm space-y-2">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="text-slate-500">Jabatan</span>
                  <span className="font-semibold text-slate-900">
                    {detailItem.jabatan}
                  </span>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="text-slate-500">Golongan / Pangkat</span>
                  <span className="font-semibold text-slate-900">
                    {detailItem.golongan} ({detailItem.pangkat || '-'})
                  </span>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="text-slate-500">Perangkat Daerah</span>
                  <span className="font-semibold text-[#0a3649]">
                    {pd?.nama ?? '-'}
                  </span>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="text-slate-500">Kontak</span>
                  <span className="text-slate-800">
                    {detailItem.noHp || '-'} / {detailItem.email || '-'}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#0a3649]">
                  Kendaraan Dinas dalam Tanggung Jawab ({heldVehicles.length})
                </h3>
                {heldVehicles.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">
                    Pegawai ini saat ini tidak tercatat memegang kendaraan dinas operasional.
                  </p>
                ) : (
                  <ul className="mt-2.5 space-y-2">
                    {heldVehicles.map((k) => (
                      <li
                        key={k.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
                      >
                        <div>
                          <span className="font-mono text-xs font-bold text-[#0a3649]">
                            {k.nomorPolisi}
                          </span>
                          <p className="text-sm font-semibold text-slate-900">
                            {k.merek} {k.tipeModel} ({k.tahunProduksi})
                          </p>
                          <p className="text-xs text-slate-500">
                            Warna: {k.warna}
                          </p>
                        </div>
                        <KondisiBadge kondisi={k.kondisi} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* Dialog Konfirmasi Hapus PNS */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Hapus Data Pegawai?"
        message={
          deleteTarget
            ? `Hapus data PNS ${deleteTarget.nama} (NIP ${deleteTarget.nip})? Kendaraan dinas yang sedang dipegang oleh pegawai ini akan otomatis dikembalikan ke status Pool Perangkat Daerah.`
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
