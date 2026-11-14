import { prisma } from '../lib/db'
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../lib/httpError'
import { signAccessToken } from '../lib/jwt'
import { verifyPassword } from '../lib/password'
import {
  normalizePermissionMap,
  type CrudPermission,
  type PagePermissionKey,
} from '../lib/permissions'
import { safeJsonParse } from '../lib/serializers'

export async function loginWithCredentials(identifier: string, password: string) {
  const key = identifier.toLowerCase()

  const user = await prisma.appUser.findFirst({
    where: {
      OR: [{ username: key }, { email: key }],
    },
    include: { roleDef: true },
  })

  if (!user) {
    throw new UnauthorizedError('Username/Email atau kata sandi tidak sesuai.')
  }

  const passwordValid = await verifyPassword(password, user.passwordHash)
  if (!passwordValid) {
    throw new UnauthorizedError('Username/Email atau kata sandi tidak sesuai.')
  }

  if (!user.aktif) {
    throw new ForbiddenError(
      'Akun Anda sedang dinonaktifkan. Hubungi Admin BPAD untuk aktivasi kembali.'
    )
  }

  const sessionPayload = {
    userId: user.id,
    username: user.username,
    nama: user.nama,
    email: user.email,
    role: user.role,
    perangkatDaerahId: user.perangkatDaerahId,
  }

  const token = signAccessToken(sessionPayload)
  const permissions = normalizePermissionMap(
    safeJsonParse<Partial<Record<PagePermissionKey, Partial<CrudPermission>>>>(
      user.roleDef?.permissions,
      {}
    )
  )

  return {
    token,
    tokenType: 'Bearer' as const,
    user: {
      ...sessionPayload,
      roleName: user.roleDef?.name ?? user.role,
      permissions,
      loggedInAt: new Date().toISOString(),
    },
  }
}

export async function getAuthProfile(userId: number) {
  const user = await prisma.appUser.findUnique({
    where: { id: userId },
    include: { perangkatDaerah: true, roleDef: true },
  })

  if (!user) {
    throw new NotFoundError('Akun pengguna tidak ditemukan.')
  }

  const permissions = normalizePermissionMap(
    safeJsonParse<Partial<Record<PagePermissionKey, Partial<CrudPermission>>>>(
      user.roleDef?.permissions,
      {}
    )
  )

  return {
    userId: user.id,
    username: user.username,
    nama: user.nama,
    email: user.email,
    role: user.role,
    roleName: user.roleDef?.name ?? user.role,
    permissions,
    perangkatDaerahId: user.perangkatDaerahId,
    aktif: user.aktif,
    perangkatDaerah: user.perangkatDaerah,
  }
}
