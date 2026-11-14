import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { CustomSelect } from '../components/common/CustomSelect'
import { Modal } from '../components/common/Modal'
import { EmptyState, ErrorState, LoadingState } from '../components/common/StateViews'
import {
  createUser,
  deleteUser,
  listPerangkatDaerah,
  listRoles,
  listUsers,
  updateUser,
} from '../services/bmdService'
import type {
  AppUser,
  AppUserInput,
  AuthSession,
  CrudPermission,
  PerangkatDaerah,
  RoleDefinition,
  UserRole,
} from '../types/bmd'
import { getUserRoleLabel } from '../utils/format'

interface UsersPageProps {
  session: AuthSession
  permission?: CrudPermission
  onPermissionsChanged?: () => void
}

interface UserFormState {
  username: string
  nama: string
  email: string
  password: string
  role: UserRole
  perangkatDaerahId: string
  aktif: boolean
}

const EMPTY_FORM: UserFormState = {
  username: '',
  nama: '',
  email: '',
  password: '',
  role: 'OPERATOR_SKPD',
  perangkatDaerahId: '',
  aktif: true,
}

export function UsersPage({
  session,
  permission = { read: true, create: true, update: true, delete: true },
  onPermissionsChanged,
}: UsersPageProps) {
  const [users, setUsers] = useState<AppUser[]>([])
  const [pdList, setPdList] = useState<PerangkatDaerah[]>([])
  const [roles, setRoles] = useState<RoleDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('ALL')

  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AppUser | null>(null)
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const [feedback, setFeedback] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [userList, pds, roleList] = await Promise.all([
        listUsers(),
        listPerangkatDaerah(),
        listRoles(),
      ])
      setUsers(userList)
      setPdList(pds)
      setRoles(roleList)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal memuat daftar pengguna.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([listUsers(), listPerangkatDaerah(), listRoles()])
      .then(([userList, pds, roleList]) => {
        if (active) {
          setUsers(userList)
          setPdList(pds)
          setRoles(roleList)
          setError(null)
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Gagal memuat daftar pengguna.'
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

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      if (filterRole !== 'ALL' && u.role !== filterRole) return false
      if (q) {
        const pd = u.perangkatDaerahId ? pdMap.get(u.perangkatDaerahId) : undefined
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

  const openCreateModal = () => {
    setEditingItem(null)
    setFormError(null)
    setForm({
      ...EMPTY_FORM,
      perangkatDaerahId: pdList.length > 0 ? String(pdList[0].id) : '',
    })
    setFormOpen(true)
  }

  const openEditModal = (item: AppUser) => {
    setEditingItem(item)
    setFormError(null)
    setForm({
      username: item.username,
      nama: item.nama,
      email: item.email,
      password: '',
      role: item.role,
      perangkatDaerahId: item.perangkatDaerahId
        ? String(item.perangkatDaerahId)
        : pdList.length > 0
          ? String(pdList[0].id)
          : '',
      aktif: item.aktif,
    })
    setFormOpen(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const payload: AppUserInput = {
      username: form.username,
      nama: form.nama,
      email: form.email,
      password: form.password || undefined,
      role: form.role,
      perangkatDaerahId:
        form.role === 'OPERATOR_SKPD' && form.perangkatDaerahId
          ? Number(form.perangkatDaerahId)
          : null,
      aktif: form.aktif,
    }

    setSubmitting(true)
    try {
      if (editingItem) {
        const updated = await updateUser(editingItem.id, payload)
        setFeedback(`Akun pengguna "${updated.username}" berhasil diperbarui.`)
      } else {
        const created = await createUser(payload)
        setFeedback(`Akun pengguna "${created.username}" berhasil dibuat.`)
      }
      setFormOpen(false)
      await loadData()
      onPermissionsChanged?.()
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Gagal menyimpan data pengguna.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleAktif = async (user: AppUser) => {
    if (!permission.update || user.id === session.userId || togglingId !== null) {
      return
    }
    const nextAktif = !user.aktif
    setTogglingId(user.id)
    setError(null)
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
        `Status akun @${user.username} berhasil ${nextAktif ? 'diaktifkan' : 'dinonaktifkan'}.`
      )
      await loadData()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal mengubah status aktif pengguna.'
      )
    } finally {
      setTogglingId(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteUser(deleteTarget.id)
      setFeedback(`Akun pengguna "${deleteTarget.username}" berhasil dihapus.`)
      setDeleteTarget(null)
      await loadData()
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Gagal menghapus pengguna.'
      )
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <LoadingState label="Memuat daftar pengguna sistem..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />
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
            onClick={openCreateModal}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#1d4ed8]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tambah User
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
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white lg:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="px-5 py-3.5">Pengguna</th>
                    <th className="px-4 py-3.5">Email</th>
                    <th className="px-4 py-3.5">Peran</th>
                    <th className="px-4 py-3.5">Perangkat Daerah</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredList.map((u) => {
                    const pd = u.perangkatDaerahId
                      ? pdMap.get(u.perangkatDaerahId)
                      : undefined
                    const isSelf = u.id === session.userId
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3.5 align-top">
                          <p className="font-semibold text-slate-900">
                            {u.nama}
                            {isSelf && (
                              <span className="ml-2 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-900">
                                Anda
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 font-mono text-xs text-slate-500">
                            @{u.username}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 align-top text-slate-700">
                          {u.email}
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <span className="inline-block rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-[#0a3649]">
                            {getUserRoleLabel(u.role, roles)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 align-top text-slate-700">
                          {u.role === 'OPERATOR_SKPD'
                            ? pd?.nama ?? '-'
                            : 'Lintas Perangkat Daerah'}
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={u.aktif}
                            aria-label={`Ubah status aktif ${u.username}`}
                            disabled={
                              !permission.update || isSelf || togglingId === u.id
                            }
                            title={
                              isSelf
                                ? 'Tidak dapat menonaktifkan akun yang sedang login'
                                : !permission.update
                                  ? 'Tidak memiliki izin mengubah status user'
                                  : u.aktif
                                    ? 'Klik untuk menonaktifkan akun'
                                    : 'Klik untuk mengaktifkan akun'
                            }
                            onClick={() => handleToggleAktif(u)}
                            className="inline-flex items-center gap-2.5 disabled:cursor-not-allowed disabled:opacity-55"
                          >
                            <span
                              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors ${
                                u.aktif ? 'bg-emerald-600' : 'bg-slate-300'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                                  u.aktif ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </span>
                            <span
                              className={`text-xs font-semibold ${
                                u.aktif ? 'text-emerald-700' : 'text-slate-600'
                              }`}
                            >
                              {togglingId === u.id
                                ? 'Menyimpan...'
                                : u.aktif
                                  ? 'Aktif'
                                  : 'Nonaktif'}
                            </span>
                          </button>
                        </td>
                        <td className="px-5 py-3.5 align-top text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {permission.update && (
                              <button
                                type="button"
                                onClick={() => openEditModal(u)}
                                aria-label={`Edit user ${u.username}`}
                                title="Edit User"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#0a3649] hover:bg-slate-100"
                              >
                                <Pencil className="h-4 w-4" aria-hidden="true" />
                              </button>
                            )}
                            {permission.delete && (
                              <button
                                type="button"
                                disabled={isSelf}
                                onClick={() => {
                                  setDeleteError(null)
                                  setDeleteTarget(u)
                                }}
                                aria-label={`Hapus user ${u.username}`}
                                title={
                                  isSelf
                                    ? 'Tidak dapat menghapus akun yang sedang login'
                                    : 'Hapus User'
                                }
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 disabled:opacity-40"
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
            {filteredList.map((u) => {
              const pd = u.perangkatDaerahId
                ? pdMap.get(u.perangkatDaerahId)
                : undefined
              const isSelf = u.id === session.userId
              return (
                <article
                  key={u.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        {u.nama}
                      </h2>
                      <p className="font-mono text-xs text-slate-500">
                        @{u.username} · {u.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={u.aktif}
                      aria-label={`Ubah status aktif ${u.username}`}
                      disabled={!permission.update || isSelf || togglingId === u.id}
                      onClick={() => handleToggleAktif(u)}
                      className="inline-flex shrink-0 items-center gap-2 disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      <span
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors ${
                          u.aktif ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                            u.aktif ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          u.aktif ? 'text-emerald-700' : 'text-slate-600'
                        }`}
                      >
                        {u.aktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </button>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3 text-xs space-y-1">
                    <p>
                      <span className="text-slate-500">Peran: </span>
                      <strong className="text-[#0a3649]">
                        {getUserRoleLabel(u.role, roles)}
                      </strong>
                    </p>
                    <p>
                      <span className="text-slate-500">Lingkup SKPD: </span>
                      <span className="text-slate-800">
                        {u.role === 'OPERATOR_SKPD'
                          ? pd?.nama ?? '-'
                          : 'Lintas Perangkat Daerah'}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {permission.update && (
                      <button
                        type="button"
                        onClick={() => openEditModal(u)}
                        className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#0a3649]/30 bg-white px-3 text-xs font-semibold text-[#0a3649] hover:bg-slate-50"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </button>
                    )}
                    {permission.delete && (
                      <button
                        type="button"
                        disabled={isSelf}
                        onClick={() => {
                          setDeleteError(null)
                          setDeleteTarget(u)
                        }}
                        className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-40"
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

      {/* Modal Tambah / Edit User */}
      <Modal
        isOpen={formOpen}
        title={
          editingItem
            ? `Edit User @${editingItem.username}`
            : 'Tambah Akun Pengguna Baru'
        }
        subtitle="Atur kredensial masuk dan hak akses pengguna pada sistem SI-KDO BMD."
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
                htmlFor="user-username"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Username <span className="text-rose-600">*</span>
              </label>
              <input
                id="user-username"
                type="text"
                required
                value={form.username}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value.toLowerCase() })
                }
                placeholder="contoh: operator.pupr"
                className="h-11 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="user-email"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Email Kedinasan <span className="text-rose-600">*</span>
              </label>
              <input
                id="user-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="nama@jakarta.go.id"
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="user-nama"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Nama Lengkap <span className="text-rose-600">*</span>
              </label>
              <input
                id="user-nama"
                type="text"
                required
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Nama lengkap pengelola / operator"
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="user-role"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Peran Akses <span className="text-rose-600">*</span>
              </label>
              <CustomSelect
                id="user-role"
                value={form.role}
                onChange={(val) =>
                  setForm({ ...form, role: val as UserRole })
                }
                options={roles.map((r) => ({
                  value: r.code,
                  label: r.name,
                  description: r.code,
                }))}
              />
            </div>

            <div>
              <label
                htmlFor="user-password"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                {editingItem
                  ? 'Kata Sandi Baru (Kosongkan jika tetap)'
                  : 'Kata Sandi *'}
              </label>
              <input
                id="user-password"
                type="password"
                required={!editingItem}
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimal 6 karakter"
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            {form.role === 'OPERATOR_SKPD' && (
              <div className="sm:col-span-2">
                <label
                  htmlFor="user-pd"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Perangkat Daerah Terkait <span className="text-rose-600">*</span>
                </label>
                <CustomSelect
                  id="user-pd"
                  required
                  value={form.perangkatDaerahId}
                  onChange={(val) =>
                    setForm({ ...form, perangkatDaerahId: val })
                  }
                  placeholder="-- Pilih Perangkat Daerah --"
                  searchPlaceholder="Cari singkatan atau nama SKPD..."
                  options={[
                    { value: '', label: '-- Pilih Perangkat Daerah --' },
                    ...pdList.map((pd) => ({
                      value: String(pd.id),
                      label: `${pd.singkatan} - ${pd.nama}`,
                    })),
                  ]}
                />
              </div>
            )}

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Status Akun Pengguna
                  </p>
                  <p className="text-xs text-slate-500">
                    {form.aktif
                      ? 'Akun aktif dan diizinkan masuk ke dalam sistem.'
                      : 'Akun dinonaktifkan dan tidak dapat login.'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.aktif}
                  aria-label="Toggle status aktif akun pengguna"
                  disabled={editingItem?.id === session.userId}
                  onClick={() => setForm({ ...form, aktif: !form.aktif })}
                  className="inline-flex shrink-0 items-center gap-2 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  <span
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors ${
                      form.aktif ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                        form.aktif ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      form.aktif ? 'text-emerald-700' : 'text-slate-600'
                    }`}
                  >
                    {form.aktif ? 'Aktif' : 'Nonaktif'}
                  </span>
                </button>
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
              disabled={submitting}
              className="min-h-[44px] rounded-xl bg-[#0a3649] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#072836] disabled:opacity-60"
            >
              {submitting
                ? 'Menyimpan...'
                : editingItem
                  ? 'Simpan Perubahan'
                  : 'Simpan User'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Hapus Akun Pengguna?"
        message={
          deleteTarget
            ? `Apakah Anda yakin ingin menghapus akun @${deleteTarget.username} (${deleteTarget.nama})? Pengguna tidak akan bisa masuk lagi ke aplikasi.`
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

