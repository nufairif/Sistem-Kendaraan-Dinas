import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Building2, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { KondisiBadge } from '../components/common/KondisiBadge'
import { Modal } from '../components/common/Modal'
import { EmptyState, ErrorState, LoadingState } from '../components/common/StateViews'
import {
  createPerangkatDaerah,
  deletePerangkatDaerah,
  listKendaraan,
  listPegawai,
  listPerangkatDaerah,
  updatePerangkatDaerah,
} from '../services/bmdService'
import type {
  CrudPermission,
  KendaraanDinas,
  Pegawai,
  PerangkatDaerah,
  PerangkatDaerahInput,
} from '../types/bmd'

const EMPTY_FORM: PerangkatDaerahInput = {
  kodeSkpd: '',
  nama: '',
  singkatan: '',
  kepalaDinas: '',
  alamat: '',
  telepon: '',
}

export function PerangkatDaerahPage({
  readOnly = false,
  permission,
}: {
  readOnly?: boolean
  permission?: CrudPermission
}) {
  const canCreate = permission ? permission.create : !readOnly
  const canUpdate = permission ? permission.update : !readOnly
  const canDelete = permission ? permission.delete : !readOnly
  const [pdList, setPdList] = useState<PerangkatDaerah[]>([])
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([])
  const [kendaraanList, setKendaraanList] = useState<KendaraanDinas[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')

  // Form Modal
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PerangkatDaerah | null>(null)
  const [form, setForm] = useState<PerangkatDaerahInput>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Detail Modal
  const [detailItem, setDetailItem] = useState<PerangkatDaerah | null>(null)

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState<PerangkatDaerah | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [feedback, setFeedback] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [pd, pns, kdo] = await Promise.all([
        listPerangkatDaerah(),
        listPegawai(),
        listKendaraan(),
      ])
      setPdList(pd)
      setPegawaiList(pns)
      setKendaraanList(kdo)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal memuat data Perangkat Daerah.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([listPerangkatDaerah(), listPegawai(), listKendaraan()])
      .then(([pd, pns, kdo]) => {
        if (active) {
          setPdList(pd)
          setPegawaiList(pns)
          setKendaraanList(kdo)
          setError(null)
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Gagal memuat data Perangkat Daerah.'
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

  const statsByPd = useMemo(() => {
    const map = new Map<
      number,
      {
        pegawai: Pegawai[]
        kendaraan: KendaraanDinas[]
        baik: number
        rusakRingan: number
        rusakBerat: number
      }
    >()
    for (const pd of pdList) {
      const pns = pegawaiList.filter((p) => p.perangkatDaerahId === pd.id)
      const kdo = kendaraanList.filter((k) => k.perangkatDaerahId === pd.id)
      map.set(pd.id, {
        pegawai: pns,
        kendaraan: kdo,
        baik: kdo.filter((k) => k.kondisi === 'BAIK').length,
        rusakRingan: kdo.filter((k) => k.kondisi === 'RUSAK_RINGAN').length,
        rusakBerat: kdo.filter((k) => k.kondisi === 'RUSAK_BERAT').length,
      })
    }
    return map
  }, [pdList, pegawaiList, kendaraanList])

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return pdList
    return pdList.filter((pd) =>
      [pd.kodeSkpd, pd.nama, pd.singkatan, pd.kepalaDinas, pd.alamat]
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }, [pdList, search])

  const openCreateModal = () => {
    setEditingItem(null)
    setFormError(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEditModal = (item: PerangkatDaerah) => {
    setEditingItem(item)
    setFormError(null)
    setForm({
      kodeSkpd: item.kodeSkpd,
      nama: item.nama,
      singkatan: item.singkatan,
      kepalaDinas: item.kepalaDinas,
      alamat: item.alamat,
      telepon: item.telepon,
    })
    setFormOpen(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      if (editingItem) {
        const updated = await updatePerangkatDaerah(editingItem.id, form)
        setFeedback(`Data ${updated.nama} berhasil diperbarui.`)
      } else {
        const created = await createPerangkatDaerah(form)
        setFeedback(`Perangkat Daerah ${created.nama} berhasil ditambahkan.`)
      }
      setFormOpen(false)
      await loadData()
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan data Perangkat Daerah.'
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
      await deletePerangkatDaerah(deleteTarget.id)
      setFeedback(`Perangkat Daerah ${deleteTarget.nama} berhasil dihapus.`)
      setDeleteTarget(null)
      await loadData()
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : 'Gagal menghapus data Perangkat Daerah.'
      )
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <LoadingState label="Memuat daftar Perangkat Daerah..." />
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
            Entitas Utama 3
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0a3649] sm:text-3xl">
            Perangkat Daerah (SKPD)
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Kelola daftar dinas/badan pengguna barang milik daerah (Dinas Pendidikan, Dinas Kesehatan, Dinas PUPR, dan instansi lainnya).
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#1d4ed8]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tambah Perangkat Daerah
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

      {/* Pencarian */}
      <section
        aria-label="Pencarian perangkat daerah"
        className="rounded-2xl border border-slate-200/80 bg-white p-4"
      >
        <label
          htmlFor="search-pd"
          className="mb-1 block text-xs font-semibold text-slate-700"
        >
          Cari Kode SKPD, Nama Dinas, Singkatan, atau Kepala Dinas
        </label>
        <div className="relative max-w-xl">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="search-pd"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Contoh: Dinas Pendidikan, PUPR, 1.02..."
            className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0a3649] focus:outline-none"
          />
        </div>
      </section>

      {/* Grid Kartu Perangkat Daerah */}
      {pdList.length === 0 ? (
        <EmptyState
          title="Belum ada Perangkat Daerah"
          description="Tambahkan Perangkat Daerah terlebih dahulu agar PNS dan Kendaraan Dinas Operasional dapat didaftarkan."
          actionLabel={canCreate ? 'Tambah Perangkat Daerah' : undefined}
          onAction={canCreate ? openCreateModal : undefined}
        />
      ) : filteredList.length === 0 ? (
        <EmptyState
          title="Perangkat Daerah tidak ditemukan"
          description="Tidak ada instansi yang sesuai dengan kata kunci pencarian Anda."
          actionLabel="Tampilkan Semua"
          onAction={() => setSearch('')}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredList.map((pd) => {
            const stats = statsByPd.get(pd.id) ?? {
              pegawai: [],
              kendaraan: [],
              baik: 0,
              rusakRingan: 0,
              rusakBerat: 0,
            }

            return (
              <article
                key={pd.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[#0a3649]">
                        <Building2 className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <span className="font-mono text-xs font-semibold text-[#2563eb]">
                          {pd.kodeSkpd} · {pd.singkatan}
                        </span>
                        <h2 className="text-base font-bold leading-snug text-slate-900">
                          {pd.nama}
                        </h2>
                      </div>
                    </div>
                  </div>

                  <dl className="mt-4 space-y-1.5 text-xs text-slate-600">
                    <div>
                      <dt className="inline text-slate-500">Kepala Dinas: </dt>
                      <dd className="inline font-medium text-slate-800">
                        {pd.kepalaDinas || '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline text-slate-500">Telepon: </dt>
                      <dd className="inline font-mono text-slate-800">
                        {pd.telepon || '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline text-slate-500">Alamat: </dt>
                      <dd className="inline text-slate-700">
                        {pd.alamat || '-'}
                      </dd>
                    </div>
                  </dl>

                  {/* Ringkasan aset SKPD */}
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">
                        Total KDO
                      </p>
                      <p className="font-mono text-lg font-bold tabular-nums text-[#0a3649]">
                        {stats.kendaraan.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">
                        Total PNS
                      </p>
                      <p className="font-mono text-lg font-bold tabular-nums text-slate-800">
                        {stats.pegawai.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">
                        KDO Baik
                      </p>
                      <p className="font-mono text-lg font-bold tabular-nums text-emerald-700">
                        {stats.baik}
                      </p>
                    </div>
                  </div>

                  {(stats.rusakRingan > 0 || stats.rusakBerat > 0) && (
                    <p className="mt-2 text-xs text-slate-600">
                      Perhatian kondisi:{' '}
                      {stats.rusakRingan > 0 && (
                        <span className="font-semibold text-amber-800">
                          {stats.rusakRingan} rusak ringan
                        </span>
                      )}
                      {stats.rusakRingan > 0 && stats.rusakBerat > 0 && ', '}
                      {stats.rusakBerat > 0 && (
                        <span className="font-semibold text-rose-700">
                          {stats.rusakBerat} rusak berat
                        </span>
                      )}
                    </p>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setDetailItem(pd)}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    Detail Aset
                  </button>
                  {canUpdate && (
                    <button
                      type="button"
                      onClick={() => openEditModal(pd)}
                      className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-[#0a3649]/30 bg-white px-3 text-xs font-semibold text-[#0a3649] hover:bg-slate-50"
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
                        setDeleteTarget(pd)
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
      )}

      {/* Modal Form Tambah / Edit Perangkat Daerah */}
      <Modal
        isOpen={formOpen}
        title={
          editingItem
            ? `Edit ${editingItem.nama}`
            : 'Tambah Perangkat Daerah Baru'
        }
        subtitle="Isi kode SKPD dan identitas instansi pengguna barang milik daerah."
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
                htmlFor="pd-kode"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Kode SKPD <span className="text-rose-600">*</span>
              </label>
              <input
                id="pd-kode"
                type="text"
                required
                value={form.kodeSkpd}
                onChange={(e) => setForm({ ...form, kodeSkpd: e.target.value })}
                placeholder="Contoh: 1.04.01.01"
                className="h-11 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="pd-singkatan"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Singkatan <span className="text-rose-600">*</span>
              </label>
              <input
                id="pd-singkatan"
                type="text"
                required
                value={form.singkatan}
                onChange={(e) =>
                  setForm({ ...form, singkatan: e.target.value.toUpperCase() })
                }
                placeholder="Contoh: DISHUB"
                className="h-11 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm uppercase focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="pd-nama"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Nama Perangkat Daerah <span className="text-rose-600">*</span>
              </label>
              <input
                id="pd-nama"
                type="text"
                required
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Contoh: Dinas Perhubungan"
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="pd-kepala"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Kepala Dinas / Kepala Badan
              </label>
              <input
                id="pd-kepala"
                type="text"
                value={form.kepalaDinas}
                onChange={(e) =>
                  setForm({ ...form, kepalaDinas: e.target.value })
                }
                placeholder="Nama Kepala SKPD"
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="pd-telp"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Telepon Kantor
              </label>
              <input
                id="pd-telp"
                type="text"
                value={form.telepon}
                onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                placeholder="(021) xxxxxxx"
                className="h-11 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="pd-alamat"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Alamat Kantor
              </label>
              <textarea
                id="pd-alamat"
                rows={2}
                value={form.alamat}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                placeholder="Alamat lengkap kantor perangkat daerah..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0a3649] focus:outline-none"
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
                  : 'Simpan Perangkat Daerah'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail Perangkat Daerah */}
      <Modal
        isOpen={detailItem !== null}
        title={detailItem ? detailItem.nama : ''}
        subtitle={
          detailItem
            ? `Kode SKPD ${detailItem.kodeSkpd} (${detailItem.singkatan})`
            : undefined
        }
        onClose={() => setDetailItem(null)}
        maxWidthClass="max-w-3xl"
      >
        {detailItem && (() => {
          const stats = statsByPd.get(detailItem.id) ?? {
            pegawai: [],
            kendaraan: [],
            baik: 0,
            rusakRingan: 0,
            rusakBerat: 0,
          }
          const pegawaiMap = new Map(pegawaiList.map((p) => [p.id, p]))
          return (
            <div className="space-y-6">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm space-y-1.5">
                <p>
                  <span className="text-slate-500">Kepala Dinas: </span>
                  <strong className="text-slate-900">
                    {detailItem.kepalaDinas || '-'}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500">Telepon: </span>
                  <span className="font-mono text-slate-800">
                    {detailItem.telepon || '-'}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">Alamat: </span>
                  <span className="text-slate-800">
                    {detailItem.alamat || '-'}
                  </span>
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#0a3649]">
                  Daftar Kendaraan Dinas Operasional ({stats.kendaraan.length})
                </h3>
                {stats.kendaraan.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">
                    Belum ada unit KDO yang tercatat di perangkat daerah ini.
                  </p>
                ) : (
                  <ul className="mt-2.5 space-y-2">
                    {stats.kendaraan.map((k) => {
                      const pj = k.pegawaiId
                        ? pegawaiMap.get(k.pegawaiId)
                        : undefined
                      return (
                        <li
                          key={k.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3 text-sm"
                        >
                          <div>
                            <span className="font-mono text-xs font-bold text-[#0a3649]">
                              {k.nomorPolisi}
                            </span>
                            <p className="font-semibold text-slate-900">
                              {k.merek} {k.tipeModel} ({k.tahunProduksi})
                            </p>
                            <p className="text-xs text-slate-500">
                              Penanggung jawab:{' '}
                              {pj ? pj.nama : 'Pool Perangkat Daerah'}
                            </p>
                          </div>
                          <KondisiBadge kondisi={k.kondisi} />
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#0a3649]">
                  Daftar PNS Terdaftar ({stats.pegawai.length})
                </h3>
                {stats.pegawai.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">
                    Belum ada PNS yang terdaftar pada perangkat daerah ini.
                  </p>
                ) : (
                  <ul className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {stats.pegawai.map((p) => (
                      <li
                        key={p.id}
                        className="rounded-lg border border-slate-200 p-3 text-xs"
                      >
                        <p className="font-bold text-slate-900">{p.nama}</p>
                        <p className="mt-0.5 font-mono text-slate-500">
                          NIP {p.nip}
                        </p>
                        <p className="mt-1 text-slate-700">
                          {p.jabatan} ({p.golongan})
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Hapus Perangkat Daerah?"
        message={
          deleteTarget
            ? `Apakah Anda yakin ingin menghapus ${deleteTarget.nama} (${deleteTarget.kodeSkpd})? Penghapusan hanya diizinkan jika sudah tidak ada PNS maupun KDO di bawah instansi ini.`
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
