import { useMemo, useState } from 'react'
import { Layers, Plus, Search, Shield, ShieldCheck } from 'lucide-react'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { FeedbackBanner } from '../../components/common/FeedbackBanner'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/StateViews'
import { PAGE_PERMISSION_META } from '../../constants/domainOptions'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { deleteRole, listRoles } from '../../services/rbac.service'
import type { CrudPermission, RoleDefinition } from '../../types/bmd'
import { RoleCardList } from './RoleCardList'
import { RoleFormModal } from './RoleFormModal'

interface RolesPageProps {
  permission?: CrudPermission
  onPermissionsChanged?: () => void
}

export function RolesPage({
  permission = { read: true, create: true, update: true, delete: true },
  onPermissionsChanged,
}: RolesPageProps) {
  const { data: roles, loading, error, reload } = useAsyncData<RoleDefinition[]>(
    listRoles,
    [],
    'Gagal memuat daftar role pengguna.',
  )

  const [search, setSearch] = useState('')
  const [formState, setFormState] = useState<{
    open: boolean
    editingItem: RoleDefinition | null
  }>({ open: false, editingItem: null })
  const [feedback, setFeedback] = useState<string | null>(null)

  const deleteHook = useConfirmDelete<RoleDefinition>(async (target) => {
    await deleteRole(target.id)
    setFeedback(`Role "${target.name}" berhasil dihapus.`)
    await reload()
    onPermissionsChanged?.()
  }, 'Gagal menghapus role.')

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return roles
    return roles.filter((r) =>
      [r.name, r.code, r.description].join(' ').toLowerCase().includes(q),
    )
  }, [roles, search])

  if (loading) {
    return <LoadingState label="Memuat daftar role & matriks hak akses..." />
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
            Pengaturan Hak Akses (RBAC)
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0a3649] sm:text-3xl">
            Manajemen Role &amp; Izin Halaman
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Kelola role pengguna beserta izin Lihat, Tambah, Ubah, dan Hapus (CRUD) di setiap halaman aplikasi.
          </p>
        </div>

        {permission.create && (
          <button
            type="button"
            onClick={() => setFormState({ open: true, editingItem: null })}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#1d4ed8]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tambah Role
          </button>
        )}
      </div>

      <FeedbackBanner message={feedback} onDismiss={() => setFeedback(null)} />

      {/* Ringkasan */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Role Terdaftar
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#0a3649]">
              <Shield className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tabular-nums text-[#0a3649]">
              {roles.length}
            </span>
            <span className="text-xs font-medium text-slate-500">Role</span>
          </div>
          <p className="mt-2.5 text-xs text-slate-600">
            Mencakup peran bawaan sistem &amp; kustom
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Role Kustom
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tabular-nums text-slate-900">
              {roles.filter((r) => !r.isSystem).length}
            </span>
            <span className="text-xs font-medium text-slate-500">Role</span>
          </div>
          <p className="mt-2.5 text-xs text-slate-600">
            Role tambahan yang dapat dihapus bebas
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Halaman Dikelola
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb]">
              <Layers className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tabular-nums text-[#2563eb]">
              {PAGE_PERMISSION_META.length}
            </span>
            <span className="text-xs font-medium text-slate-500">Halaman</span>
          </div>
          <p className="mt-2.5 text-xs text-slate-600">
            Matriks Lihat, Tambah, Ubah, dan Hapus
          </p>
        </div>
      </div>

      {/* Pencarian */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4">
        <label
          htmlFor="search-role"
          className="mb-1 block text-xs font-semibold text-slate-700"
        >
          Cari Nama Role, Kode, atau Deskripsi
        </label>
        <div className="relative max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="search-role"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Contoh: Admin BPAD, Kepala Bidang..."
            className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-[#0a3649] focus:outline-none"
          />
        </div>
      </section>

      {/* Daftar Role Cards */}
      {filteredList.length === 0 ? (
        <EmptyState
          title="Tidak ada role yang cocok"
          description="Sesuaikan kata kunci pencarian atau tambah role baru."
          actionLabel={permission.create ? 'Tambah Role' : undefined}
          onAction={
            permission.create
              ? () => setFormState({ open: true, editingItem: null })
              : undefined
          }
        />
      ) : (
        <RoleCardList
          roles={filteredList}
          permission={permission}
          onEdit={(role) => setFormState({ open: true, editingItem: role })}
          onDelete={deleteHook.requestDelete}
        />
      )}

      {formState.open && (
        <RoleFormModal
          key={formState.editingItem?.id ?? 'new'}
          editingItem={formState.editingItem}
          onClose={() => setFormState({ open: false, editingItem: null })}
          onSaved={async (message) => {
            setFormState({ open: false, editingItem: null })
            setFeedback(message)
            await reload()
            onPermissionsChanged?.()
          }}
        />
      )}

      <ConfirmDialog
        isOpen={deleteHook.deleteTarget !== null}
        title="Hapus Role?"
        message={
          deleteHook.deleteTarget
            ? `Apakah Anda yakin ingin menghapus role "${deleteHook.deleteTarget.name}" (${deleteHook.deleteTarget.code})?`
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

