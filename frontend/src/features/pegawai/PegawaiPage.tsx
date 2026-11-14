import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { CustomSelect } from '../../components/common/CustomSelect'
import { FeedbackBanner } from '../../components/common/FeedbackBanner'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/StateViews'
import { GOLONGAN_PNS_MAP } from '../../constants/domainOptions'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { listKendaraan } from '../../services/kendaraan.service'
import {
  deletePegawai,
  listPegawai,
  listPerangkatDaerah,
} from '../../services/master.service'
import type {
  CrudPermission,
  KendaraanDinas,
  Pegawai,
  PerangkatDaerah,
} from '../../types/bmd'
import { PegawaiDetailModal } from './PegawaiDetailModal'
import { PegawaiFormModal } from './PegawaiFormModal'
import { PegawaiTable } from './PegawaiTable'

interface PegawaiBundle {
  pegawaiList: Pegawai[]
  pdList: PerangkatDaerah[]
  kendaraanList: KendaraanDinas[]
}

const INITIAL_BUNDLE: PegawaiBundle = {
  pegawaiList: [],
  pdList: [],
  kendaraanList: [],
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

  const { data, loading, error, reload } = useAsyncData<PegawaiBundle>(
    async () => {
      const [pegawaiList, pdList, kendaraanList] = await Promise.all([
        listPegawai(),
        listPerangkatDaerah(),
        listKendaraan(),
      ])
      return { pegawaiList, pdList, kendaraanList }
    },
    INITIAL_BUNDLE,
    'Gagal memuat data Pegawai Negeri Sipil.',
  )

  const [search, setSearch] = useState('')
  const [filterPdId, setFilterPdId] = useState('ALL')
  const [filterGolongan, setFilterGolongan] = useState('ALL')
  const [formState, setFormState] = useState<{
    open: boolean
    editingItem: Pegawai | null
  }>({ open: false, editingItem: null })
  const [detailItem, setDetailItem] = useState<Pegawai | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const deleteHook = useConfirmDelete<Pegawai>(async (target) => {
    await deletePegawai(target.id)
    setFeedback(`Data PNS ${target.nama} berhasil dihapus.`)
    await reload()
  }, 'Gagal menghapus data PNS.')

  const { pegawaiList, pdList, kendaraanList } = data

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

  const activePdFilter =
    selectedPdId !== null ? String(selectedPdId) : filterPdId

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

  const defaultPdId: number | '' =
    selectedPdId !== null
      ? selectedPdId
      : pdList.length > 0
        ? pdList[0].id
        : ''

  const resetFilters = () => {
    setSearch('')
    setFilterPdId('ALL')
    setFilterGolongan('ALL')
  }

  if (loading) {
    return <LoadingState label="Memuat data Pegawai Negeri Sipil (PNS)..." />
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
            onClick={() => setFormState({ open: true, editingItem: null })}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#1d4ed8]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tambah PNS
          </button>
        )}
      </div>

      <FeedbackBanner message={feedback} onDismiss={() => setFeedback(null)} />

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
            Menampilkan{' '}
            <strong className="text-slate-900">{filteredList.length}</strong>{' '}
            dari <strong className="text-slate-900">{pegawaiList.length}</strong>{' '}
            pegawai PNS
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
          onAction={
            canCreate
              ? () => setFormState({ open: true, editingItem: null })
              : undefined
          }
        />
      ) : filteredList.length === 0 ? (
        <EmptyState
          title="Tidak ada PNS yang cocok dengan filter"
          description="Sesuaikan kata kunci pencarian atau filter perangkat daerah dan golongan."
          actionLabel="Reset Filter"
          onAction={resetFilters}
        />
      ) : (
        <PegawaiTable
          items={filteredList}
          pdMap={pdMap}
          kendaraanByPegawai={kendaraanByPegawai}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onDetail={setDetailItem}
          onEdit={(item) => setFormState({ open: true, editingItem: item })}
          onDelete={deleteHook.requestDelete}
        />
      )}

      {formState.open && (
        <PegawaiFormModal
          key={formState.editingItem?.id ?? 'new'}
          editingItem={formState.editingItem}
          defaultPdId={defaultPdId}
          pdList={pdList}
          onClose={() => setFormState({ open: false, editingItem: null })}
          onSaved={async (message) => {
            setFormState({ open: false, editingItem: null })
            setFeedback(message)
            await reload()
          }}
        />
      )}

      <PegawaiDetailModal
        item={detailItem}
        pd={detailItem ? pdMap.get(detailItem.perangkatDaerahId) : undefined}
        heldVehicles={
          detailItem ? (kendaraanByPegawai.get(detailItem.id) ?? []) : []
        }
        onClose={() => setDetailItem(null)}
      />

      <ConfirmDialog
        isOpen={deleteHook.deleteTarget !== null}
        title="Hapus Data Pegawai?"
        message={
          deleteHook.deleteTarget
            ? `Hapus data PNS ${deleteHook.deleteTarget.nama} (NIP ${deleteHook.deleteTarget.nip})? Kendaraan dinas yang sedang dipegang oleh pegawai ini akan otomatis dikembalikan ke status Pool Perangkat Daerah.`
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

