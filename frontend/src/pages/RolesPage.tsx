import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Layers, Pencil, Plus, Search, Shield, ShieldCheck, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { Modal } from '../components/common/Modal'
import { EmptyState, ErrorState, LoadingState } from '../components/common/StateViews'
import {
  createRole,
  deleteRole,
  listRoles,
  listUsers,
  updateRole,
} from '../services/bmdService'
import type {
  AppUser,
  CrudPermission,
  PagePermissionKey,
  RoleDefinition,
  RoleInput,
  RolePermissionMap,
} from '../types/bmd'
import {
  makeDefaultPermissionMap,
  PAGE_PERMISSION_META,
} from '../utils/format'

interface RolesPageProps {
  permission?: CrudPermission
  onPermissionsChanged?: () => void
}

interface RoleFormState {
  code: string
  name: string
  description: string
  codeManuallyEdited: boolean
  permissions: RolePermissionMap
}

function toRoleCodeSlug(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function makeEmptyRoleForm(): RoleFormState {
  const base = makeDefaultPermissionMap(false)
  base.dashboard.read = true
  return {
    code: '',
    name: '',
    description: '',
    codeManuallyEdited: false,
    permissions: base,
  }
}

function summarizeRolePerm(perm: CrudPermission, hasCrud: boolean): string {
  if (!perm.read) return 'Tidak Ada Akses'
  if (!hasCrud) return 'Lihat'
  const parts = ['Lihat']
  if (perm.create) parts.push('Tambah')
  if (perm.update) parts.push('Ubah')
  if (perm.delete) parts.push('Hapus')
  return parts.join(' · ')
}

export function RolesPage({
  permission = { read: true, create: true, update: true, delete: true },
  onPermissionsChanged,
}: RolesPageProps) {
  const [roles, setRoles] = useState<RoleDefinition[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')

  // Modal Form
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<RoleDefinition | null>(null)
  const [form, setForm] = useState<RoleFormState>(() => makeEmptyRoleForm())
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState<RoleDefinition | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [feedback, setFeedback] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [roleList, userList] = await Promise.all([listRoles(), listUsers()])
      setRoles(roleList)
      setUsers(userList)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal memuat daftar role pengguna.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([listRoles(), listUsers()])
      .then(([roleList, userList]) => {
        if (active) {
          setRoles(roleList)
          setUsers(userList)
          setError(null)
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Gagal memuat daftar role pengguna.'
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

  const userCountByRole = useMemo(() => {
    const map = new Map<string, number>()
    for (const u of users) {
      map.set(u.role, (map.get(u.role) ?? 0) + 1)
    }
    return map
  }, [users])

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return roles
    return roles.filter((r) =>
      [r.name, r.code, r.description].join(' ').toLowerCase().includes(q)
    )
  }, [roles, search])

  const openCreateModal = () => {
    setEditingItem(null)
    setFormError(null)
    setForm(makeEmptyRoleForm())
    setFormOpen(true)
  }

  const openEditModal = (item: RoleDefinition) => {
    setEditingItem(item)
    setFormError(null)
    setForm({
      code: item.code,
      name: item.name,
      description: item.description,
      codeManuallyEdited: true,
      permissions: JSON.parse(
        JSON.stringify(item.permissions)
      ) as RolePermissionMap,
    })
    setFormOpen(true)
  }

  const updatePagePerm = (
    pageKey: PagePermissionKey,
    field: keyof CrudPermission,
    checked: boolean
  ) => {
    setForm((prev) => {
      const current = prev.permissions[pageKey]
      const next: CrudPermission = { ...current, [field]: checked }
      if (field === 'read' && !checked) {
        next.create = false
        next.update = false
        next.delete = false
      }
      if (field !== 'read' && checked) {
        next.read = true
      }
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [pageKey]: next,
        },
      }
    })
  }

  const applyRowPreset = (
    pageKey: PagePermissionKey,
    hasCrud: boolean,
    mode: 'ALL' | 'READ' | 'NONE'
  ) => {
    setForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [pageKey]:
          mode === 'NONE'
            ? { read: false, create: false, update: false, delete: false }
            : mode === 'READ'
              ? { read: true, create: false, update: false, delete: false }
              : {
                  read: true,
                  create: hasCrud,
                  update: hasCrud,
                  delete: hasCrud,
                },
      },
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const payload: RoleInput = {
      code: form.code,
      name: form.name,
      description: form.description,
      permissions: form.permissions,
    }

    setSubmitting(true)
    try {
      if (editingItem) {
        const updated = await updateRole(editingItem.id, payload)
        setFeedback(`Role "${updated.name}" dan hak akses halaman berhasil diperbarui.`)
      } else {
        const created = await createRole(payload)
        setFeedback(`Role baru "${created.name}" berhasil ditambahkan.`)
      }
      setFormOpen(false)
      await loadData()
      onPermissionsChanged?.()
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Gagal menyimpan data role.'
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
      await deleteRole(deleteTarget.id)
      setFeedback(`Role "${deleteTarget.name}" berhasil dihapus.`)
      setDeleteTarget(null)
      await loadData()
      onPermissionsChanged?.()
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Gagal menghapus role.'
      )
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <LoadingState label="Memuat daftar role & matriks hak akses..." />
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
            onClick={openCreateModal}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#1d4ed8]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tambah Role
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
          onAction={permission.create ? openCreateModal : undefined}
        />
      ) : (
        <div className="space-y-4">
          {filteredList.map((role) => {
            const countUsers = userCountByRole.get(role.code) ?? 0
            return (
              <article
                key={role.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#0a3649]">
                      <Shield className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900">
                          {role.name}
                        </h2>
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs font-semibold text-[#0a3649]">
                          {role.code}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            role.isSystem
                              ? 'bg-sky-50 text-[#0a3649]'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {role.isSystem ? 'Role Bawaan' : 'Role Kustom'}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                          {countUsers} User
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {role.description || 'Tidak ada deskripsi role.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {permission.update && (
                      <button
                        type="button"
                        onClick={() => openEditModal(role)}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-semibold text-[#0a3649] hover:bg-slate-50"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Atur Izin / Edit
                      </button>
                    )}
                    {permission.delete && !role.isSystem && (
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null)
                          setDeleteTarget(role)
                        }}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Hapus
                      </button>
                    )}
                  </div>
                </div>

                {/* Ringkasan Matriks Per Halaman */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {PAGE_PERMISSION_META.map((page) => {
                    const p = role.permissions[page.key] ?? {
                      read: false,
                      create: false,
                      update: false,
                      delete: false,
                    }
                    return (
                      <div
                        key={page.key}
                        className={`rounded-xl border px-3 py-2.5 text-xs ${
                          p.read
                            ? 'border-slate-200 bg-slate-50/70'
                            : 'border-slate-100 bg-slate-50/30 opacity-65'
                        }`}
                      >
                        <p className="font-semibold text-slate-800">
                          {page.label}
                        </p>
                        <p
                          className={`mt-1 font-mono text-[11px] font-medium ${
                            p.read ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {summarizeRolePerm(p, page.hasCrud)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Modal Tambah / Edit Role & Matriks CRUD */}
      <Modal
        isOpen={formOpen}
        title={editingItem ? `Edit Role: ${editingItem.name}` : 'Tambah Role Baru'}
        subtitle="Tentukan nama role serta hak akses Lihat, Tambah, Ubah, dan Hapus untuk masing-masing halaman."
        onClose={() => setFormOpen(false)}
        maxWidthClass="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            >
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="role-name"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Nama Role <span className="text-rose-600">*</span>
              </label>
              <input
                id="role-name"
                type="text"
                required
                value={form.name}
                onChange={(e) => {
                  const nextName = e.target.value
                  setForm((prev) => ({
                    ...prev,
                    name: nextName,
                    code:
                      !editingItem?.isSystem && !prev.codeManuallyEdited
                        ? toRoleCodeSlug(nextName)
                        : prev.code,
                  }))
                }}
                placeholder="Contoh: Kepala Bidang Aset"
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="role-code"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Kode Role <span className="text-rose-600">*</span>
              </label>
              <input
                id="role-code"
                type="text"
                required
                disabled={Boolean(editingItem?.isSystem)}
                value={form.code}
                onChange={(e) =>
                  setForm({
                    ...form,
                    code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
                    codeManuallyEdited: true,
                  })
                }
                placeholder="Contoh: KEPALA_BIDANG"
                className="h-11 w-full rounded-xl border border-slate-300 px-3 font-mono text-sm uppercase focus:border-[#0a3649] focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="role-desc"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Deskripsi Role
              </label>
              <input
                id="role-desc"
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Ringkasan tanggung jawab atau ruang lingkup role..."
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
              />
            </div>
          </div>

          {/* Matriks Hak Akses Halaman */}
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h3 className="text-sm font-bold text-[#0a3649]">
                Matriks Hak Akses CRUD per Halaman
              </h3>
              <p className="text-xs text-slate-500">
                Centang izin yang diperbolehkan. Mengaktifkan Tambah/Ubah/Hapus otomatis mengaktifkan izin Lihat.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60 text-xs font-semibold text-slate-600">
                    <th className="px-4 py-3">Halaman / Modul</th>
                    <th className="px-3 py-3 text-center">Lihat</th>
                    <th className="px-3 py-3 text-center">Tambah</th>
                    <th className="px-3 py-3 text-center">Ubah</th>
                    <th className="px-3 py-3 text-center">Hapus</th>
                    <th className="px-4 py-3 text-right">Pintasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {PAGE_PERMISSION_META.map((page) => {
                    const perm = form.permissions[page.key]
                    return (
                      <tr key={page.key} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">
                            {page.label}
                          </p>
                          <p className="text-xs text-slate-500">
                            {page.description}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            aria-label={`Lihat ${page.label}`}
                            checked={perm.read}
                            onChange={(e) =>
                              updatePagePerm(page.key, 'read', e.target.checked)
                            }
                            className="h-4 w-4 rounded border-slate-300 accent-[#0a3649]"
                          />
                        </td>
                        <td className="px-3 py-3 text-center">
                          {page.hasCrud ? (
                            <input
                              type="checkbox"
                              aria-label={`Tambah ${page.label}`}
                              checked={perm.create}
                              onChange={(e) =>
                                updatePagePerm(page.key, 'create', e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 accent-[#0a3649]"
                            />
                          ) : (
                            <span className="text-xs text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {page.hasCrud ? (
                            <input
                              type="checkbox"
                              aria-label={`Ubah ${page.label}`}
                              checked={perm.update}
                              onChange={(e) =>
                                updatePagePerm(page.key, 'update', e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 accent-[#0a3649]"
                            />
                          ) : (
                            <span className="text-xs text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {page.hasCrud ? (
                            <input
                              type="checkbox"
                              aria-label={`Hapus ${page.label}`}
                              checked={perm.delete}
                              onChange={(e) =>
                                updatePagePerm(page.key, 'delete', e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 accent-[#0a3649]"
                            />
                          ) : (
                            <span className="text-xs text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                applyRowPreset(page.key, page.hasCrud, 'ALL')
                              }
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-[#0a3649] hover:bg-slate-50"
                            >
                              Penuh
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                applyRowPreset(page.key, page.hasCrud, 'READ')
                              }
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Lihat
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                applyRowPreset(page.key, page.hasCrud, 'NONE')
                              }
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-50"
                            >
                              Off
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
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
              className="min-h-[44px] rounded-xl bg-[#2563eb] px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#1d4ed8] disabled:opacity-60"
            >
              {submitting
                ? 'Menyimpan...'
                : editingItem
                  ? 'Simpan Role & Izin'
                  : 'Simpan Role Baru'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Hapus Role?"
        message={
          deleteTarget
            ? `Apakah Anda yakin ingin menghapus role "${deleteTarget.name}" (${deleteTarget.code})?`
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
