import { useState, type FormEvent } from 'react'
import { Lock } from 'lucide-react'
import { Modal } from '../../components/common/Modal'
import {
  makeDefaultPermissionMap,
  PAGE_PERMISSION_META,
} from '../../constants/domainOptions'
import { createRole, updateRole } from '../../services/rbac.service'
import type {
  CrudPermission,
  PagePermissionKey,
  RoleDefinition,
  RoleInput,
  RolePermissionMap,
} from '../../types/bmd'

interface RoleFormState {
  code: string
  name: string
  description: string
  codeManuallyEdited: boolean
  permissions: RolePermissionMap
}

const CRUD_COLUMNS: Array<{ field: 'create' | 'update' | 'delete'; label: string }> = [
  { field: 'create', label: 'Tambah' },
  { field: 'update', label: 'Ubah' },
  { field: 'delete', label: 'Hapus' },
]

function toRoleCodeSlug(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function buildInitialRoleForm(editingItem: RoleDefinition | null): RoleFormState {
  if (editingItem) {
    return {
      code: editingItem.code,
      name: editingItem.name,
      description: editingItem.description,
      codeManuallyEdited: true,
      permissions: JSON.parse(
        JSON.stringify(editingItem.permissions),
      ) as RolePermissionMap,
    }
  }
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

interface RoleFormModalProps {
  editingItem: RoleDefinition | null
  onClose: () => void
  onSaved: (message: string) => Promise<void>
}

export function RoleFormModal({
  editingItem,
  onClose,
  onSaved,
}: RoleFormModalProps) {
  const isSuperAdminRole = editingItem?.code === 'ADMIN_BPAD'
  const [form, setForm] = useState<RoleFormState>(() =>
    buildInitialRoleForm(editingItem),
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const updatePagePerm = (
    pageKey: PagePermissionKey,
    field: keyof CrudPermission,
    checked: boolean,
  ) => {
    if (isSuperAdminRole) return
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
    mode: 'ALL' | 'READ' | 'NONE',
  ) => {
    if (isSuperAdminRole) return
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
      permissions:
        isSuperAdminRole && editingItem
          ? editingItem.permissions
          : form.permissions,
    }

    setSubmitting(true)
    try {
      const message = editingItem
        ? isSuperAdminRole
          ? `Informasi role "${(await updateRole(editingItem.id, payload)).name}" berhasil diperbarui.`
          : `Role "${(await updateRole(editingItem.id, payload)).name}" dan hak akses halaman berhasil diperbarui.`
        : `Role baru "${(await createRole(payload)).name}" berhasil ditambahkan.`
      await onSaved(message)
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Gagal menyimpan data role.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen
      title={editingItem ? `Edit Role: ${editingItem.name}` : 'Tambah Role Baru'}
      subtitle={
        isSuperAdminRole
          ? 'Hak akses (permission) Super Admin bersifat tetap dan terkunci. Anda masih dapat memperbarui nama dan deskripsi role.'
          : 'Tentukan nama role serta hak akses Lihat, Tambah, Ubah, dan Hapus untuk masing-masing halaman.'
      }
      onClose={onClose}
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
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ringkasan tanggung jawab atau ruang lingkup role..."
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-[#0a3649] focus:outline-none"
            />
          </div>
        </div>

        {/* Matriks Hak Akses Halaman */}
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <h3 className="text-sm font-bold text-[#0a3649]">
                Matriks Hak Akses CRUD per Halaman
              </h3>
              <p className="text-xs text-slate-500">
                {isSuperAdminRole
                  ? 'Hak akses role Super Admin (ADMIN_BPAD) dikunci permanen oleh sistem dan tidak dapat diubah.'
                  : 'Centang izin yang diperbolehkan. Mengaktifkan Tambah/Ubah/Hapus otomatis mengaktifkan izin Lihat.'}
              </p>
            </div>
            {isSuperAdminRole && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                Permission Terkunci
              </span>
            )}
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
                          disabled={isSuperAdminRole}
                          aria-label={`Lihat ${page.label}`}
                          checked={perm.read}
                          onChange={(e) =>
                            updatePagePerm(page.key, 'read', e.target.checked)
                          }
                          className="h-4 w-4 rounded border-slate-300 accent-[#0a3649] disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </td>
                      {CRUD_COLUMNS.map((col) => (
                        <td key={col.field} className="px-3 py-3 text-center">
                          {page.hasCrud ? (
                            <input
                              type="checkbox"
                              disabled={isSuperAdminRole}
                              aria-label={`${col.label} ${page.label}`}
                              checked={perm[col.field]}
                              onChange={(e) =>
                                updatePagePerm(
                                  page.key,
                                  col.field,
                                  e.target.checked,
                                )
                              }
                              className="h-4 w-4 rounded border-slate-300 accent-[#0a3649] disabled:cursor-not-allowed disabled:opacity-60"
                            />
                          ) : (
                            <span className="text-xs text-slate-300">-</span>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        {isSuperAdminRole ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                            <Lock className="h-3 w-3" aria-hidden="true" />
                            Tetap
                          </span>
                        ) : (
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
                        )}
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
            onClick={onClose}
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
                ? isSuperAdminRole
                  ? 'Simpan Info Role'
                  : 'Simpan Role & Izin'
                : 'Simpan Role Baru'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

