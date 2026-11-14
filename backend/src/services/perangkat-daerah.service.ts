import type { z } from 'zod'
import { prisma } from '../lib/db'
import { ConflictError, NotFoundError } from '../lib/httpError'
import type { perangkatDaerahInputSchema } from '../schemas/perangkat-daerah.schema'
import { serializeKendaraan } from '../lib/serializers'

export type PerangkatDaerahInput = z.infer<typeof perangkatDaerahInputSchema>

async function ensureKodeSkpdAvailable(kodeSkpd: string, excludeId?: number) {
  const existingList = await prisma.perangkatDaerah.findMany({
    select: { id: true, kodeSkpd: true },
  })
  const duplicate = existingList.some(
    (p) =>
      p.id !== excludeId && p.kodeSkpd.toLowerCase() === kodeSkpd.toLowerCase()
  )
  if (duplicate) {
    throw new ConflictError(
      excludeId
        ? `Kode SKPD "${kodeSkpd}" sudah digunakan Perangkat Daerah lain.`
        : `Kode SKPD "${kodeSkpd}" sudah terdaftar.`
    )
  }
}

export async function listPerangkatDaerah(search?: string) {
  const items = await prisma.perangkatDaerah.findMany({
    include: {
      _count: {
        select: {
          pegawai: true,
          kendaraan: true,
        },
      },
    },
    orderBy: { kodeSkpd: 'asc' },
  })

  if (!search) return items
  const q = search.toLowerCase()
  return items.filter(
    (item) =>
      item.kodeSkpd.toLowerCase().includes(q) ||
      item.nama.toLowerCase().includes(q) ||
      item.singkatan.toLowerCase().includes(q) ||
      item.kepalaDinas.toLowerCase().includes(q)
  )
}

export async function getPerangkatDaerahById(id: number) {
  const item = await prisma.perangkatDaerah.findUnique({
    where: { id },
    include: {
      pegawai: { orderBy: { nama: 'asc' } },
      kendaraan: { orderBy: { id: 'desc' } },
      _count: {
        select: {
          pegawai: true,
          kendaraan: true,
        },
      },
    },
  })

  if (!item) {
    throw new NotFoundError('Data Perangkat Daerah tidak ditemukan.')
  }

  return {
    ...item,
    kendaraan: item.kendaraan.map((k) => serializeKendaraan(k)),
  }
}

export async function createPerangkatDaerah(input: PerangkatDaerahInput) {
  await ensureKodeSkpdAvailable(input.kodeSkpd)

  return prisma.perangkatDaerah.create({
    data: {
      kodeSkpd: input.kodeSkpd,
      nama: input.nama,
      singkatan: input.singkatan.toUpperCase(),
      kepalaDinas: input.kepalaDinas,
      alamat: input.alamat,
      telepon: input.telepon,
    },
  })
}

export async function updatePerangkatDaerah(
  id: number,
  input: PerangkatDaerahInput
) {
  const existing = await prisma.perangkatDaerah.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!existing) {
    throw new NotFoundError('Data Perangkat Daerah tidak ditemukan.')
  }

  await ensureKodeSkpdAvailable(input.kodeSkpd, id)

  return prisma.perangkatDaerah.update({
    where: { id },
    data: {
      kodeSkpd: input.kodeSkpd,
      nama: input.nama,
      singkatan: input.singkatan.toUpperCase(),
      kepalaDinas: input.kepalaDinas,
      alamat: input.alamat,
      telepon: input.telepon,
    },
  })
}

export async function deletePerangkatDaerah(id: number) {
  const existing = await prisma.perangkatDaerah.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          pegawai: true,
          kendaraan: true,
        },
      },
    },
  })

  if (!existing) {
    throw new NotFoundError('Data Perangkat Daerah tidak ditemukan.')
  }

  if (existing._count.pegawai > 0 || existing._count.kendaraan > 0) {
    throw new ConflictError(
      `Perangkat Daerah tidak dapat dihapus karena masih menaungi ${existing._count.pegawai} PNS dan ${existing._count.kendaraan} unit kendaraan dinas. Pindahkan atau hapus data terkait terlebih dahulu.`
    )
  }

  await prisma.perangkatDaerah.delete({ where: { id } })
  return { id }
}
