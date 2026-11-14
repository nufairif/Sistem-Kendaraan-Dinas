import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { FeedbackBanner } from '../../components/common/FeedbackBanner'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/StateViews'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { listKendaraan } from '../../services/kendaraan.service'
import {
  deletePerangkatDaerah,
  listPegawai,
  listPerangkatDaerah,
} from '../../services/master.service'
import type {
  CrudPermission,
  KendaraanDinas,
  Pegawai,
  PerangkatDaerah,
} from '../../types/bmd'
import { PerangkatDaerahDetailModal } from './PerangkatDaerahDetailModal'
import { PerangkatDaerahFormModal } from './PerangkatDaerahFormModal'
import {
  PerangkatDaerahGrid,
  type PdStatsSummary,
} from './PerangkatDaerahGrid'

const EMPTY_PD_STATS: PdStatsSummary = {
  pegawai: [],
  kendaraan: [],
  baik: 0,
  rusakRingan: 0,
  rusakBerat: 0,
}

interface PerangkatDaerahBundle {
  pdList: PerangkatDaerah[]
  pegawaiList: Pegawai[]
  kendaraanList: KendaraanDinas[]
}

const INITIAL_BUNDLE: PerangkatDaerahBundle = {
  pdList: [],
  pegawaiList: [],
  kendaraanList: [],
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

  const { data, loading, error, reload } = useAsyncData<PerangkatDaerahBundle>(
    async () => {
      const [pdList, pegawaiList, kendaraanList] = await Promise.all([
        listPerangkatDaerah(),
        listPegawai(),
        listKendaraan(),
      ])
      return { pdList, pegawaiList, kendaraanList }
    },
    INITIAL_BUNDLE,
    'Gagal memuat data Perangkat Daerah.',
  )

  const [search, setSearch] = useState('')
  const [formState, setFormState] = useState<{
    open: boolean
    editingItem: PerangkatDaerah | null
  }>({ open: false, editingItem: null })
  const [detailItem, setDetailItem] = useState<PerangkatDaerah | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const deleteHook = useConfirmDelete<PerangkatDaerah>(async (target) => {
    await deletePerangkatDaerah(target.id)
    setFeedback(`Perangkat Daerah ${target.nama} berhasil dihapus.`)
    await reload()
  }, 'Gagal menghapus data Perangkat Daerah.')

  const { pdList, pegawaiList, kendaraanList } = data

  const pegawaiMap = useMemo(
    () => new Map(pegawaiList.map((p) => [p.id, p])),
    [pegawaiList],
  )

  const statsByPd = useMemo(() => {
    const map = new Map<number, PdStatsSummary>()
    for (const pd of pdList) {
      map.set(pd.id, {
        pegawai: [],
        kendaraan: [],
        baik: 0,
        rusakRingan: 0,
        rusakBerat: 0,
      })
    }
    for (const p of pegawaiList) {
      map.get(p.perangkatDaerahId)?.pegawai.push(p)
    }
    for (const k of kendaraanList) {
      const bucket = map.get(k.perangkatDaerahId)
      if (!bucket) continue
      bucket.kendaraan.push(k)
      if (k.kondisi === 'BAIK') bucket.baik += 1
      else if (k.kondisi === 'RUSAK_RINGAN') bucket.rusakRingan += 1
      else if (k.kondisi === 'RUSAK_BERAT') bucket.rusakBerat += 1
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
        .includes(q),
    )
  }, [pdList, search])

  if (loading) {
    return <LoadingState label="Memuat daftar Perangkat Daerah..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={reload} />
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
            onClick={() => setFormState({ open: true, editingItem: null })}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#1d4ed8]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tambah Perangkat Daerah
          </button>
        )}
      </div>

      <FeedbackBanner message={feedback} onDismiss={() => setFeedback(null)} />

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
          onAction={
            canCreate
              ? () => setFormState({ open: true, editingItem: null })
              : undefined
          }
        />
      ) : filteredList.length === 0 ? (
        <EmptyState
          title="Perangkat Daerah tidak ditemukan"
          description="Tidak ada instansi yang sesuai dengan kata kunci pencarian Anda."
          actionLabel="Tampilkan Semua"
          onAction={() => setSearch('')}
        />
      ) : (
        <PerangkatDaerahGrid
          items={filteredList}
          statsByPd={statsByPd}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onDetail={setDetailItem}
          onEdit={(item) => setFormState({ open: true, editingItem: item })}
          onDelete={deleteHook.requestDelete}
        />
      )}

      {formState.open && (
        <PerangkatDaerahFormModal
          key={formState.editingItem?.id ?? 'new'}
          editingItem={formState.editingItem}
          onClose={() => setFormState({ open: false, editingItem: null })}
          onSaved={async (message) => {
            setFormState({ open: false, editingItem: null })
            setFeedback(message)
            await reload()
          }}
        />
      )}

      <PerangkatDaerahDetailModal
        item={detailItem}
        stats={
          detailItem
            ? (statsByPd.get(detailItem.id) ?? EMPTY_PD_STATS)
            : EMPTY_PD_STATS
        }
        pegawaiMap={pegawaiMap}
        onClose={() => setDetailItem(null)}
      />

      <ConfirmDialog
        isOpen={deleteHook.deleteTarget !== null}
        title="Hapus Perangkat Daerah?"
        message={
          deleteHook.deleteTarget
            ? `Apakah Anda yakin ingin menghapus ${deleteHook.deleteTarget.nama} (${deleteHook.deleteTarget.kodeSkpd})? Penghapusan hanya diizinkan jika sudah tidak ada PNS maupun KDO di bawah instansi ini.`
            : ''
        }
        isLoading={deleteHook.deleting}
        errorMessage={deleteHook.deleteError}
        onConfirm={deleteHook.confirmDelete}
        onCancel={deleteHook.cancelDelete}
      />
    </div>
  )
}
