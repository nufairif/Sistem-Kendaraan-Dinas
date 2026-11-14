import { Pencil, Trash2 } from 'lucide-react'
import type {
  AppUser,
  CrudPermission,
  PerangkatDaerah,
  RoleDefinition,
} from '../../types/bmd'
import { getUserRoleLabel } from '../../utils/format'
import { UserStatusSwitch } from './UserStatusSwitch'

interface UsersTableProps {
  users: AppUser[]
  roles: RoleDefinition[]
  pdMap: Map<number, PerangkatDaerah>
  currentUserId: number
  togglingId: number | null
  permission: CrudPermission
  onToggleAktif: (user: AppUser) => void
  onEdit: (user: AppUser) => void
  onDelete: (user: AppUser) => void
}

export function UsersTable({
  users,
  roles,
  pdMap,
  currentUserId,
  togglingId,
  permission,
  onToggleAktif,
  onEdit,
  onDelete,
}: UsersTableProps) {
  return (
    <>
      {/* Desktop Table */}
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
              {users.map((u) => {
                const pd = u.perangkatDaerahId
                  ? pdMap.get(u.perangkatDaerahId)
                  : undefined
                const isSelf = u.id === currentUserId
                const toggleTitle = isSelf
                  ? 'Tidak dapat menonaktifkan akun yang sedang login'
                  : !permission.update
                    ? 'Tidak memiliki izin mengubah status user'
                    : u.aktif
                      ? 'Klik untuk menonaktifkan akun'
                      : 'Klik untuk mengaktifkan akun'

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
                        ? (pd?.nama ?? '-')
                        : 'Lintas Perangkat Daerah'}
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <UserStatusSwitch
                        checked={u.aktif}
                        disabled={
                          !permission.update || isSelf || togglingId === u.id
                        }
                        loading={togglingId === u.id}
                        ariaLabel={`Ubah status aktif ${u.username}`}
                        title={toggleTitle}
                        onToggle={() => onToggleAktif(u)}
                      />
                    </td>
                    <td className="px-5 py-3.5 align-top text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {permission.update && (
                          <button
                            type="button"
                            onClick={() => onEdit(u)}
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
                            onClick={() => onDelete(u)}
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
        {users.map((u) => {
          const pd = u.perangkatDaerahId
            ? pdMap.get(u.perangkatDaerahId)
            : undefined
          const isSelf = u.id === currentUserId
          return (
            <article
              key={u.id}
              className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4"
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
                <UserStatusSwitch
                  checked={u.aktif}
                  disabled={!permission.update || isSelf || togglingId === u.id}
                  loading={togglingId === u.id}
                  ariaLabel={`Ubah status aktif ${u.username}`}
                  onToggle={() => onToggleAktif(u)}
                />
              </div>

              <div className="space-y-1 rounded-lg bg-slate-50 p-3 text-xs">
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
                      ? (pd?.nama ?? '-')
                      : 'Lintas Perangkat Daerah'}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {permission.update && (
                  <button
                    type="button"
                    onClick={() => onEdit(u)}
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
                    onClick={() => onDelete(u)}
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
  )
}

