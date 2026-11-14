import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { CustomSelect } from '../../components/common/CustomSelect'
import { FeedbackBanner } from '../../components/common/FeedbackBanner'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/StateViews'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { listPerangkatDaerah } from '../../services/master.service'
import {
  deleteUser,
  listRoles,
  listUsers,
  updateUser,
} from '../../services/rbac.service'
import type {
  AppUser,
  AuthSession,
  CrudPermission,
  PerangkatDaerah,
  RoleDefinition,
} from '../../types/bmd'
import { getUserRoleLabel } from '../../utils/format'
import { UserFormModal } from './UserFormModal'
import { UsersTable } from './UsersTable'

interface UsersPageProps {
  session: AuthSession
  permission?: CrudPermission
  onPermissionsChanged?: () => void
}

interface UsersBundle {
  users: AppUser[]
  pdList: PerangkatDaerah[]
  roles: RoleDefinition[]
}

const INITIAL_BUNDLE: UsersBundle = {
  users: [],
  pdList: [],
  roles: [],
}

export function UsersPage({
  session,
  permission = { read: true, create: true, update: true, delete: true },
  onPermissionsChanged,
}: UsersPageProps) {
  const { data, loading, error, reload } = useAsyncData<UsersBundle>(
    async () => {
      const [users, pdList, roles] = await Promise.all([
        listUsers(),
        listPerangkatDaerah(),
        listRoles(),
      ])
      return { users, pdList, roles }
    },
    INITIAL_BUNDLE,
    'Gagal memuat daftar pengguna.',
  )

  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('ALL')
  const [formState, setFormState] = useState<{
    open: boolean
    editingItem: AppUser | null
  }>({ open: false, editingItem: null })
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const deleteHook = useConfirmDelete<AppUser>(async (target) => {
    await deleteUser(target.id)
    setFeedback(`Akun pengguna "${target.username}" berhasil dihapus.`)
    await reload()
  }, 'Gagal menghapus pengguna.')

  const { users, pdList, roles } = data

  const pdMap = useMemo(() => new Map(pdList.map((p) => [p.id, p])), [pdList])

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      if (filterRole !== 'ALL' && u.role !== filterRole) return false
      if (q) {
        const pd = u.perangkatDaerahId
          ? pdMap.get(u.perangkatDaerahId)
          : undefined
        const hay = [
          u.username,
          u.nama,
          u.email,
          getUserRoleLabel(u.role, roles),
          pd?.nama ?? '',
          pd?.singkatan ?? '',
        ]
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [users, filterRole, search, pdMap, roles])

  const handleToggleAktif = async (user: AppUser) => {
    if (!permission.update || user.id === session.userId || togglingId !== null) {
      return
    }
    const nextAktif = !user.aktif
    setTogglingId(user.id)
    setActionError(null)
    try {
      await updateUser(user.id, {
        username: user.username,
        nama: user.nama,
        email: user.email,
        role: user.role,
        perangkatDaerahId: user.perangkatDaerahId,
        aktif: nextAktif,
      })
      setFeedback(
        `Status akun @${user.username} berhasil ${nextAktif ? 'diaktifkan' : 'dinonaktifkan'}.`,
      )
      await reload()
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Gagal mengubah status aktif pengguna.',
      )
    } finally {
      setTogglingId(null)
    }
  }

  if (loading) {
    return <LoadingState label="Memuat daftar pengguna sistem..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={reload} />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2563eb]">
            Administrasi Akses
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0a3649] sm:text-3xl">
            Manajemen User
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Kelola akun pengguna, peran akses (Admin BPAD, Operator SKPD, Pemantau), dan status aktif akun.
          </p>
        </div>

        {permission.create && (
          <button
            type="button"
            onClick={() => setFormState({ open: true, editingItem: null })}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#1d4ed8]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tambah User
          </button>
        )}
      </div>

      <FeedbackBanner
        message={actionError}
        variant="error"
        onDismiss={() => setActionError(null)}
      />
      <FeedbackBanner message={feedback} onDismiss={() => setFeedback(null)} />

      {/* Filter */}
      <section
        aria-label="Filter dan pencarian user"
        className="rounded-2xl border border-slate-200/80 bg-white p-4"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <label
              htmlFor="search-user"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Cari Username, Nama, Email, atau Perangkat Daerah
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="search-user"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Contoh: admin.bpad, operator.disdik..."
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0a3649] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="filter-user-role"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Peran (Role)
            </label>
            <CustomSelect
              id="filter-user-role"
              value={filterRole}
              onChange={setFilterRole}
              options={[
                { value: 'ALL', label: 'Semua Peran' },
                ...roles.map((r) => ({
                  value: r.code,
                  label: r.name,
                  description: r.code,
                })),
              ]}
            />
          </div>
        </div>
      </section>

      {filteredList.length === 0 ? (
        <EmptyState
          title="Pengguna tidak ditemukan"
          description="Tidak ada akun pengguna yang sesuai dengan filter atau pencarian."
          actionLabel="Tampilkan Semua"
          onAction={() => {
            setSearch('')
            setFilterRole('ALL')
          }}
        />
      ) : (
        <UsersTable
          users={filteredList}
          roles={roles}
          pdMap={pdMap}
          currentUserId={session.userId}
          togglingId={togglingId}
          permission={permission}
          onToggleAktif={handleToggleAktif}
          onEdit={(item) => setFormState({ open: true, editingItem: item })}
          onDelete={deleteHook.requestDelete}
        />
      )}

      {formState.open && (
        <UserFormModal
          key={formState.editingItem?.id ?? 'new'}
          editingItem={formState.editingItem}
          currentUserId={session.userId}
          pdList={pdList}
          roles={roles}
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
        title="Hapus Akun Pengguna?"
        message={
          deleteHook.deleteTarget
            ? `Apakah Anda yakin ingin menghapus akun @${deleteHook.deleteTarget.username} (${deleteHook.deleteTarget.nama})? Pengguna tidak akan bisa masuk lagi ke aplikasi.`
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

