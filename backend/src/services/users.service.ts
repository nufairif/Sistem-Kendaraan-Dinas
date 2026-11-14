import type { z } from 'zod'
import { prisma } from '../lib/db'
import { BadRequestError, ConflictError, NotFoundError } from '../lib/httpError'
import { hashPassword } from '../lib/password'
import type {
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
} from '../schemas/user.schema'
import { serializeUser } from '../lib/serializers'

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UserQuery = z.infer<typeof userQuerySchema>

async function validateUserRelations(
  username: string,
  email: string,
  role: string,
  perangkatDaerahId: number | null,
  excludeId?: number
) {
  const idFilter = excludeId ? { id: { not: excludeId } } : undefined

  const [dupUsername, dupEmail, roleExists, pdExists] = await Promise.all([
    prisma.appUser.findFirst({
      where: { username, ...idFilter },
      select: { id: true },
    }),
    prisma.appUser.findFirst({
      where: { email, ...idFilter },
      select: { id: true },
    }),
    prisma.roleDefinition.findUnique({
      where: { code: role },
      select: { code: true },
    }),
    perangkatDaerahId !== null
      ? prisma.perangkatDaerah.findUnique({
          where: { id: perangkatDaerahId },
          select: { id: true },
        })
      : Promise.resolve(true),
  ])

  if (dupUsername) {
    throw new ConflictError(
      excludeId
        ? `Username "${username}" sudah digunakan pengguna lain.`
        : `Username "${username}" sudah digunakan.`
    )
  }
  if (dupEmail) {
    throw new ConflictError(
      excludeId
        ? `Email "${email}" sudah digunakan pengguna lain.`
        : `Email "${email}" sudah terdaftar.`
    )
  }
  if (!roleExists) {
    throw new BadRequestError(`Role "${role}" tidak terdaftar di manajemen role.`)
  }
  if (!pdExists) {
    throw new BadRequestError('Perangkat Daerah yang dipilih tidak ditemukan.')
  }
}

async function ensureOtherActiveAdminExists(excludeId: number, message: string) {
  const otherAdmins = await prisma.appUser.count({
    where: {
      id: { not: excludeId },
      role: 'ADMIN_BPAD',
      aktif: true,
    },
  })
  if (otherAdmins === 0) {
    throw new BadRequestError(message)
  }
}

export async function listUsers(query: UserQuery) {
  const items = await prisma.appUser.findMany({
    where: {
      ...(query.role ? { role: query.role } : {}),
      ...(query.aktif !== undefined ? { aktif: query.aktif === 'true' } : {}),
    },
    include: { perangkatDaerah: true },
    orderBy: { id: 'asc' },
  })

  const filtered = query.search
    ? items.filter((u) => {
        const q = query.search!.toLowerCase()
        return (
          u.username.toLowerCase().includes(q) ||
          u.nama.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
        )
      })
    : items

  return filtered.map(serializeUser)
}

export async function getUserById(id: number) {
  const user = await prisma.appUser.findUnique({
    where: { id },
    include: { perangkatDaerah: true },
  })
  if (!user) {
    throw new NotFoundError('Data pengguna tidak ditemukan.')
  }
  return serializeUser(user)
}

export async function createUser(input: CreateUserInput) {
  await validateUserRelations(
    input.username,
    input.email,
    input.role,
    input.perangkatDaerahId
  )

  const passwordHash = await hashPassword(input.password)

  const created = await prisma.appUser.create({
    data: {
      username: input.username,
      nama: input.nama,
      email: input.email,
      passwordHash,
      role: input.role,
      perangkatDaerahId: input.perangkatDaerahId,
      aktif: input.aktif,
    },
    include: { perangkatDaerah: true },
  })

  return serializeUser(created)
}

export async function updateUser(id: number, input: UpdateUserInput) {
  const existing = await prisma.appUser.findUnique({ where: { id } })
  if (!existing) {
    throw new NotFoundError('Data pengguna tidak ditemukan.')
  }

  await validateUserRelations(
    input.username,
    input.email,
    input.role,
    input.perangkatDaerahId,
    id
  )

  if (
    existing.role === 'ADMIN_BPAD' &&
    (input.role !== 'ADMIN_BPAD' || !input.aktif)
  ) {
    await ensureOtherActiveAdminExists(
      id,
      'Minimal harus ada 1 akun Admin BPAD yang aktif di dalam sistem.'
    )
  }

  const nextHash =
    input.password && input.password.length >= 6
      ? await hashPassword(input.password)
      : existing.passwordHash

  const updated = await prisma.appUser.update({
    where: { id },
    data: {
      username: input.username,
      nama: input.nama,
      email: input.email,
      passwordHash: nextHash,
      role: input.role,
      perangkatDaerahId: input.perangkatDaerahId,
      aktif: input.aktif,
    },
    include: { perangkatDaerah: true },
  })

  return serializeUser(updated)
}

export async function deleteUser(id: number, actorUserId?: number) {
  if (actorUserId === id) {
    throw new BadRequestError(
      'Anda tidak dapat menghapus akun yang sedang digunakan untuk login.'
    )
  }

  const target = await prisma.appUser.findUnique({ where: { id } })
  if (!target) {
    throw new NotFoundError('Data pengguna tidak ditemukan.')
  }

  if (target.role === 'ADMIN_BPAD') {
    await ensureOtherActiveAdminExists(
      id,
      'Tidak dapat menghapus satu-satunya akun Admin BPAD aktif.'
    )
  }

  await prisma.appUser.delete({ where: { id } })
  return { id }
}
