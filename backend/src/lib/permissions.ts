export const PAGE_PERMISSION_KEYS = [
  'dashboard',
  'kendaraan',
  'peminjaman',
  'servis',
  'pajakDokumen',
  'pegawai',
  'perangkatDaerah',
  'users',
  'roles',
] as const

export type PagePermissionKey = (typeof PAGE_PERMISSION_KEYS)[number]

export interface CrudPermission {
  read: boolean
  create: boolean
  update: boolean
  delete: boolean
}

export type CrudAction = keyof CrudPermission
export type RolePermissionMap = Record<PagePermissionKey, CrudPermission>

export function normalizeRoleCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function makeDefaultPermissionMap(allTrue = false): RolePermissionMap {
  return {
    dashboard: { read: allTrue, create: false, update: false, delete: false },
    kendaraan: {
      read: allTrue,
      create: allTrue,
      update: allTrue,
      delete: allTrue,
    },
    peminjaman: {
      read: allTrue,
      create: allTrue,
      update: allTrue,
      delete: allTrue,
    },
    servis: {
      read: allTrue,
      create: allTrue,
      update: allTrue,
      delete: allTrue,
    },
    pajakDokumen: { read: allTrue, create: false, update: false, delete: false },
    pegawai: {
      read: allTrue,
      create: allTrue,
      update: allTrue,
      delete: allTrue,
    },
    perangkatDaerah: {
      read: allTrue,
      create: allTrue,
      update: allTrue,
      delete: allTrue,
    },
    users: {
      read: allTrue,
      create: allTrue,
      update: allTrue,
      delete: allTrue,
    },
    roles: {
      read: allTrue,
      create: allTrue,
      update: allTrue,
      delete: allTrue,
    },
  }
}

export function normalizePermissionMap(
  raw: Partial<Record<PagePermissionKey, Partial<CrudPermission>>> | null | undefined
): RolePermissionMap {
  const base = makeDefaultPermissionMap(false)
  if (!raw || typeof raw !== 'object') {
    return base
  }

  for (const key of PAGE_PERMISSION_KEYS) {
    const incoming = raw[key]
    if (!incoming || typeof incoming !== 'object') continue
    base[key] = {
      read: Boolean(incoming.read),
      create: Boolean(incoming.create),
      update: Boolean(incoming.update),
      delete: Boolean(incoming.delete),
    }
  }

  return base
}

