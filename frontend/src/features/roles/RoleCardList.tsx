import { Lock, Pencil, Shield, Trash2 } from 'lucide-react'
import { PAGE_PERMISSION_META } from '../../constants/domainOptions'
import type { CrudPermission, RoleDefinition } from '../../types/bmd'

function summarizeRolePerm(perm: CrudPermission, hasCrud: boolean): string {
  if (!perm.read) return 'Tidak Ada Akses'
  if (!hasCrud) return 'Lihat'
  const parts = ['Lihat']
  if (perm.create) parts.push('Tambah')
  if (perm.update) parts.push('Ubah')
  if (perm.delete) parts.push('Hapus')
  return parts.join(' · ')
}

interface RoleCardListProps {
  roles: RoleDefinition[]
  permission: CrudPermission
  onEdit: (role: RoleDefinition) => void
  onDelete: (role: RoleDefinition) => void
}

export function RoleCardList({
  roles,
  permission,
  onEdit,
  onDelete,
}: RoleCardListProps) {
  return (
    <div className="space-y-4">
      {roles.map((role) => {
        const countUsers = role.userCount ?? 0
        const isSuperAdmin = role.code === 'ADMIN_BPAD'
        return (
          <article
            key={role.id}
            className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5"
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
                    {isSuperAdmin && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                        <Lock className="h-3 w-3" aria-hidden="true" />
                        Izin Terkunci
                      </span>
                    )}
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                      {countUsers} User
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {role.description || 'Tidak ada deskripsi role.'}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {permission.update && (
                  <button
                    type="button"
                    onClick={() => onEdit(role)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-semibold text-[#0a3649] hover:bg-slate-50"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    {isSuperAdmin ? 'Edit Info' : 'Atur Izin / Edit'}
                  </button>
                )}
                {permission.delete && !role.isSystem && (
                  <button
                    type="button"
                    onClick={() => onDelete(role)}
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
                    <p className="font-semibold text-slate-800">{page.label}</p>
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
  )
}

