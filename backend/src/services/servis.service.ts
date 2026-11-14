import type { z } from 'zod'
import { prisma } from '../lib/db'
import { BadRequestError, NotFoundError } from '../lib/httpError'
import type {
  servisInputSchema,
  servisQuerySchema,
} from '../schemas/servis.schema'
import { serializeServis } from '../lib/serializers'

export type ServisInput = z.infer<typeof servisInputSchema>
export type ServisQuery = z.infer<typeof servisQuerySchema>

function toServisMutationData(input: ServisInput) {
  return {
    kendaraanId: input.kendaraanId,
    tanggalServis: input.tanggalServis,
    jenisServis: input.jenisServis,
    status: input.status,
    bengkel: input.bengkel,
    kilometer: input.kilometer,
    biaya: input.biaya,
    servisBerikutnyaTanggal: input.servisBerikutnyaTanggal,
    deskripsi: input.deskripsi,
    buktiNota: input.buktiNota ? JSON.stringify(input.buktiNota) : null,
  }
}

async function ensureKendaraanExists(kendaraanId: number) {
  const kendaraan = await prisma.kendaraanDinas.findUnique({
    where: { id: kendaraanId },
    select: { id: true },
  })
  if (!kendaraan) {
    throw new BadRequestError('Kendaraan dinas yang dipilih tidak ditemukan.')
  }
}

export async function listServis(query: ServisQuery) {
  const items = await prisma.servisKendaraan.findMany({
    where: {
      ...(query.kendaraanId ? { kendaraanId: query.kendaraanId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.jenisServis ? { jenisServis: query.jenisServis } : {}),
      ...(query.perangkatDaerahId
        ? { kendaraan: { perangkatDaerahId: query.perangkatDaerahId } }
        : {}),
    },
    include: {
      kendaraan: true,
    },
    orderBy: [{ tanggalServis: 'desc' }, { id: 'desc' }],
  })

  const filtered = query.search
    ? items.filter((item) => {
        const q = query.search!.toLowerCase()
        return (
          item.bengkel.toLowerCase().includes(q) ||
          item.deskripsi.toLowerCase().includes(q) ||
          item.kendaraan.nomorPolisi.toLowerCase().includes(q) ||
          item.kendaraan.merek.toLowerCase().includes(q) ||
          item.kendaraan.tipeModel.toLowerCase().includes(q)
        )
      })
    : items

  return filtered.map((item) => serializeServis(item))
}

export async function getServisById(id: number) {
  const item = await prisma.servisKendaraan.findUnique({
    where: { id },
    include: { kendaraan: true },
  })

  if (!item) {
    throw new NotFoundError('Data catatan servis tidak ditemukan.')
  }

  return serializeServis(item)
}

export async function createServis(input: ServisInput) {
  await ensureKendaraanExists(input.kendaraanId)

  const created = await prisma.servisKendaraan.create({
    data: toServisMutationData(input),
    include: { kendaraan: true },
  })

  return serializeServis(created)
}

export async function updateServis(id: number, input: ServisInput) {
  const existing = await prisma.servisKendaraan.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!existing) {
    throw new NotFoundError('Data catatan servis tidak ditemukan.')
  }

  await ensureKendaraanExists(input.kendaraanId)

  const updated = await prisma.servisKendaraan.update({
    where: { id },
    data: toServisMutationData(input),
    include: { kendaraan: true },
  })

  return serializeServis(updated)
}

export async function deleteServis(id: number) {
  const existing = await prisma.servisKendaraan.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!existing) {
    throw new NotFoundError('Data catatan servis tidak ditemukan.')
  }

  await prisma.servisKendaraan.delete({ where: { id } })
  return { id }
}
