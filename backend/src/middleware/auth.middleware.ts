import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../lib/db'
import { ForbiddenError, UnauthorizedError } from '../lib/httpError'
import { verifyAccessToken, type JwtUserPayload, type UserRole } from '../lib/jwt'
import {
  normalizePermissionMap,
  type CrudAction,
  type CrudPermission,
  type PagePermissionKey,
  type RolePermissionMap,
} from '../lib/permissions'
import { safeJsonParse } from '../lib/serializers'

export interface AuthenticatedRequestUser extends JwtUserPayload {
  roleName: string
  permissions: RolePermissionMap
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedRequestUser
    }
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new UnauthorizedError('Header Authorization Bearer token wajib disertakan.'))
    return
  }

  const token = authHeader.slice('Bearer '.length).trim()
  if (!token) {
    next(new UnauthorizedError('Token autentikasi kosong.'))
    return
  }

  let payload: JwtUserPayload
  try {
    payload = verifyAccessToken(token)
  } catch {
    next(new UnauthorizedError('Token autentikasi tidak valid atau sudah kedaluwarsa.'))
    return
  }

  try {
    const user = await prisma.appUser.findUnique({
      where: { id: payload.userId },
      include: { roleDef: true },
    })

    if (!user) {
      next(new UnauthorizedError('Akun pengguna tidak ditemukan atau telah dihapus.'))
      return
    }
    if (!user.aktif) {
      next(
        new ForbiddenError(
          'Akun Anda sedang dinonaktifkan. Hubungi Admin BPAD untuk aktivasi kembali.'
        )
      )
      return
    }

    const parsedPerms = safeJsonParse<
      Partial<Record<PagePermissionKey, Partial<CrudPermission>>>
    >(user.roleDef?.permissions, {})

    req.user = {
      userId: user.id,
      username: user.username,
      nama: user.nama,
      email: user.email,
      role: user.role,
      perangkatDaerahId: user.perangkatDaerahId,
      roleName: user.roleDef?.name ?? user.role,
      permissions: normalizePermissionMap(parsedPerms),
    }
    next()
  } catch (err) {
    next(err)
  }
}

export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError())
      return
    }
    if (!allowedRoles.includes(req.user.role)) {
      next(
        new ForbiddenError(
          `Akses ditolak. Peran "${req.user.role}" tidak diizinkan untuk operasi ini.`
        )
      )
      return
    }
    next()
  }
}

export function requirePermission(
  resource: PagePermissionKey,
  action: CrudAction
) {
  return requireAnyPermission([resource, action])
}

export function requireAnyPermission(
  ...checks: Array<[PagePermissionKey, CrudAction]>
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError())
      return
    }

    const hasAccess = checks.some(
      ([resource, action]) => Boolean(req.user!.permissions[resource]?.[action])
    )
    if (!hasAccess) {
      next(
        new ForbiddenError(
          `Akses ditolak. Peran "${req.user.role}" tidak memiliki izin untuk operasi ini.`
        )
      )
      return
    }

    next()
  }
}
