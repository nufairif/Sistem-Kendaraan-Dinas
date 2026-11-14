import type { z } from 'zod'
import { prisma } from '../lib/db'
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../lib/httpError'
import { serializeRole } from '../lib/serializers'
import type { roleInputSchema } from '../schemas/roles.schema'

export type RoleInput = z.infer<typeof roleInputSchema>

export async function listRoles(search?: string) {
  const items = await prisma.roleDefinition.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: { id: 'asc' },
  })

  const filtered = search
    ? items.filter((r) => {
        const q = search.toLowerCase()
        return (
          r.code.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
        )
      })
    : items

  return filtered.map(serializeRole)
}

export async function getRoleById(id: number) {
  const role = await prisma.roleDefinition.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  })
  if (!role) {
    throw new NotFoundError('Data role tidak ditemukan.')
  }
  return serializeRole(role)
}

export async function createRole(input: RoleInput) {
  const existing = await prisma.roleDefinition.findUnique({
    where: { code: input.code },
    select: { id: true },
  })
  if (existing) {
    throw new ConflictError(`Kode role "${input.code}" sudah terdaftar.`)
  }

  const created = await prisma.roleDefinition.create({
    data: {
      code: input.code,
      name: input.name,
      description: input.description,
      isSystem: false,
      permissions: JSON.stringify(input.permissions),
    },
    include: { _count: { select: { users: true } } },
  })

  return serializeRole(created)
}

export async function updateRole(id: number, input: RoleInput) {
  const existing = await prisma.roleDefinition.findUnique({ where: { id } })
  if (!existing) {
    throw new NotFoundError('Data role tidak ditemukan.')
  }

  const nextCode = existing.isSystem ? existing.code : input.code
  const duplicate = await prisma.roleDefinition.findFirst({
    where: { code: nextCode, id: { not: id } },
    select: { id: true },
  })
  if (duplicate) {
    throw new ConflictError(
      `Kode role "${nextCode}" sudah digunakan oleh role lain.`
    )
  }

  if (
    existing.code === 'ADMIN_BPAD' &&
    (!input.permissions.roles.read ||
      !input.permissions.roles.update ||
      !input.permissions.users.read)
  ) {
    throw new BadRequestError(
      'Role ADMIN_BPAD harus tetap memiliki akses Lihat/Ubah pada Manajemen Role dan User agar tidak terkunci.'
    )
  }

  const updated = await prisma.roleDefinition.update({
    where: { id },
    data: {
      code: nextCode,
      name: input.name,
      description: input.description,
      permissions: JSON.stringify(input.permissions),
    },
    include: { _count: { select: { users: true } } },
  })

  return serializeRole(updated)
}

export async function deleteRole(id: number) {
  const target = await prisma.roleDefinition.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  })
  if (!target) {
    throw new NotFoundError('Data role tidak ditemukan.')
  }
  if (target.isSystem) {
    throw new BadRequestError(
      `Role bawaan "${target.name}" tidak dapat dihapus, namun hak akses CRUD per halamannya dapat Anda ubah lewat Edit.`
    )
  }
  if (target._count.users > 0) {
    throw new ConflictError(
      `Role "${target.name}" masih digunakan oleh ${target._count.users} akun pengguna. Ubah role pengguna tersebut terlebih dahulu.`
    )
  }

  await prisma.roleDefinition.delete({ where: { id } })
  return { id }
}

