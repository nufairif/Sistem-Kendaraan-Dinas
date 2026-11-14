import { useCallback, useMemo, useState } from 'react'
import { Download, Plus, Search } from 'lucide-react'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { CustomSelect } from '../../components/common/CustomSelect'
import { DocumentViewerModal } from '../../components/common/DocumentViewerModal'
import { FeedbackBanner } from '../../components/common/FeedbackBanner'
import { ErrorState, LoadingState } from '../../components/common/StateViews'
import { KONDISI_OPTIONS } from '../../constants/domainOptions'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { deleteKendaraan, listKendaraan } from '../../services/kendaraan.service'
import { listPegawai, listPerangkatDaerah } from '../../services/master.service'
import type {
  CrudPermission,
  KendaraanDinas,
  Pegawai,
  PerangkatDaerah,
  VehicleDocument,
} from '../../types/bmd'
import { KendaraanDetailModal } from './KendaraanDetailModal'
import { KendaraanFormModal } from './KendaraanFormModal'
import { KendaraanTable } from './KendaraanTable'
import { exportKendaraanCsv } from './kendaraanFormUtils'

interface KendaraanPageProps {
  selectedPdId?: number | null
  readOnly?: boolean
  permission?: CrudPermission
}

interface KendaraanBundle {
  kendaraanList: KendaraanDinas[]
  pegawaiList: Pegawai[]
  pdList: PerangkatDaerah[]
}

const INITIAL_BUNDLE: KendaraanBundle = {
  kendaraanList: [],
  pegawaiList: [],
  pdList: [],
}

export function KendaraanPage({
  selectedPdId = null,
  readOnly = false,
  permission,
}: KendaraanPageProps) {
  const canCreate = permission ? permission.create : !readOnly
  const canUpdate = permission ? permission.update : !readOnly
  const canDelete = permission ? permission.delete : !readOnly

  const fetchAll = useCallback(async (): Promise<KendaraanBundle> => {
    const [kendaraanList, pegawaiList, pdList] = await Promise.all([
      listKendaraan(),
      listPegawai(),
      listPerangkatDaerah(),
    ])
    return { kendaraanList, pegawaiList, pdList }
  }, [])

  const {
    data: { kendaraanList, pegawaiList, pdList },
    loading,
    error,
    reload,
  } = useAsyncData(fetchAll, INITIAL_BUNDLE, 'Gagal memuat data KDO.')

  const [search, setSearch] = useState('')
  const [filterKondisi, setFilterKondisi] = useState('ALL')
  const [filterPdId, setFilterPdId] = useState('ALL')
  const [filterPenugasan, setFilterPenugasan] = useState('ALL')

  const [formState, setFormState] = useState<{
    open: boolean
    editing: KendaraanDinas | null
  }>({ open: false, editing: null })
  const [detailItem, setDetailItem] = useState<KendaraanDinas | null>(null)
  const [previewDoc, setPreviewDoc] = useState<{
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
  } = useConfirmDelete<KendaraanDinas>(async (item) => {
    await deleteKendaraan(item.id)
    setFeedback(`Kendaraan ${item.nomorPolisi} berhasil dihapus.`)
    await reload()
  }, 'Gagal menghapus kendaraan.')

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
      if (filterKondisi !== 'ALL' && item.kondisi !== filterKondisi) return false
      if (
        effectivePdFilter !== 'ALL' &&
        item.perangkatDaerahId !== Number(effectivePdFilter)
      ) {
        return false
      }
      if (filterPenugasan === 'ASSIGNED' && item.pegawaiId === null) return false
      if (filterPenugasan === 'POOL' && item.pegawaiId !== null) return false
      if (!q) return true

      const pd = pdMap.get(item.perangkatDaerahId)
      const pj = item.pegawaiId ? pegawaiMap.get(item.pegawaiId) : undefined
      return [
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
        .includes(q)
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
    return <ErrorState message={error} onRetry={reload} />
  }

  return (
    <div className="space-y-6">
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
            onClick={() => exportKendaraanCsv(filteredList, pdMap, pegawaiMap)}
            disabled={filteredList.length === 0}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export CSV
          </button>
          {canCreate && (
            <button
              type="button"
              onClick={() => setFormState({ open: true, editing: null })}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1d4ed8]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Tambah KDO
            </button>
          )}
        </div>
      </div>

      <FeedbackBanner message={feedback} onDismiss={() => setFeedback(null)} />

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

      <KendaraanTable
        totalCount={kendaraanList.length}
        items={filteredList}
        pdMap={pdMap}
        pegawaiMap={pegawaiMap}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onCreate={() => setFormState({ open: true, editing: null })}
        onResetFilters={resetFilters}
        onViewDetail={setDetailItem}
        onEdit={(item) => setFormState({ open: true, editing: item })}
        onDelete={requestDelete}
        onPreviewDoc={(doc, title) => setPreviewDoc({ doc, title })}
      />

      {formState.open && (
        <KendaraanFormModal
          key={formState.editing ? `edit-${formState.editing.id}` : 'create'}
          isOpen
          editingItem={formState.editing}
          selectedPdId={selectedPdId}
          pdList={pdList}
          pegawaiList={pegawaiList}
          onClose={() => setFormState({ open: false, editing: null })}
          onSaved={async (msg) => {
            setFeedback(msg)
            await reload()
          }}
        />
      )}

      <KendaraanDetailModal
        key={detailItem?.id ?? 'closed'}
        detailItem={detailItem}
        pdMap={pdMap}
        pegawaiMap={pegawaiMap}
        onClose={() => setDetailItem(null)}
        onPreviewDoc={(doc, title) => setPreviewDoc({ doc, title })}
      />

      <DocumentViewerModal
        doc={previewDoc?.doc ?? null}
        title={previewDoc?.title ?? 'Pratinjau Dokumen'}
        onClose={() => setPreviewDoc(null)}
      />

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
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  )
}
