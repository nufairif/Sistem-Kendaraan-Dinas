import { useState, type FormEvent } from 'react'
import { CustomSelect } from '../../components/common/CustomSelect'
import { Modal } from '../../components/common/Modal'
import { createUser, updateUser } from '../../services/rbac.service'
import type {
  AppUser,
  AppUserInput,
  PerangkatDaerah,
  RoleDefinition,
  UserRole,
} from '../../types/bmd'
import { UserStatusSwitch } from './UserStatusSwitch'

interface UserFormState {
  username: string
  nama: string
  email: string
  password: string
  role: UserRole
  perangkatDaerahId: string
  aktif: boolean
}

function buildInitialUserForm(
  editingItem: AppUser | null,
  pdList: PerangkatDaerah[],
): UserFormState {
  const defaultPdId = pdList.length > 0 ? String(pdList[0].id) : ''
  if (editingItem) {
    return {
      username: editingItem.username,
      nama: editingItem.nama,
      email: editingItem.email,
      password: '',
      role: editingItem.role,
      perangkatDaerahId: editingItem.perangkatDaerahId
        ? String(editingItem.perangkatDaerahId)
        : defaultPdId,
      aktif: editingItem.aktif,
    }
  }
  return {
    username: '',
    nama: '',
    email: '',
    password: '',
    role: 'OPERATOR_SKPD',
    perangkatDaerahId: defaultPdId,
    aktif: true,
  }
}

interface UserFormModalProps {
  editingItem: AppUser | null
  currentUserId: number
  pdList: PerangkatDaerah[]
  roles: RoleDefinition[]
  onClose: () => void
  onSaved: (message: string) => Promise<void>
}

export function UserFormModal({
  editingItem,
  currentUserId,
  pdList,
  roles,
  onClose,
  onSaved,
}: UserFormModalProps) {
  const [form, setForm] = useState<UserFormState>(() =>
    buildInitialUserForm(editingItem, pdList),
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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
      const message = editingItem
        ? `Akun pengguna "${(await updateUser(editingItem.id, payload)).username}" berhasil diperbarui.`
        : `Akun pengguna "${(await createUser(payload)).username}" berhasil dibuat.`
      await onSaved(message)
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Gagal menyimpan data pengguna.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen
      title={
        editingItem
          ? `Edit User @${editingItem.username}`
          : 'Tambah Akun Pengguna Baru'
      }
      subtitle="Atur kredensial masuk dan hak akses pengguna pada sistem SI-KDO BMD."
      onClose={onClose}
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
              onChange={(val) => setForm({ ...form, role: val as UserRole })}
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
                onChange={(val) => setForm({ ...form, perangkatDaerahId: val })}
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
              <UserStatusSwitch
                checked={form.aktif}
                disabled={editingItem?.id === currentUserId}
                ariaLabel="Toggle status aktif akun pengguna"
                onToggle={() => setForm({ ...form, aktif: !form.aktif })}
              />
            </div>
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
  )
}

