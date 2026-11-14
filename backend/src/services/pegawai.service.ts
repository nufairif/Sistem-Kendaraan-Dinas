import type { z } from 'zod'
import { prisma } from '../lib/db'
import { BadRequestError, ConflictError, NotFoundError } from '../lib/httpError'
import type {
  pegawaiInputSchema,
  pegawaiQuerySchema,
} from '../schemas/pegawai.schema'
import { serializeKendaraan } from '../lib/serializers'

export type PegawaiInput = z.infer<typeof pegawaiInputSchema>
export type PegawaiQuery = z.infer<typeof pegawaiQuerySchema>

async function validatePegawaiRelations(
  nip: string,
  perangkatDaerahId: number,
  excludeId?: number
) {
  const [pdExists, duplicateNip] = await Promise.all([
    prisma.perangkatDaerah.findUnique({
      where: { id: perangkatDaerahId },
      select: { id: true },
    }),
    prisma.pegawai.findFirst({
      where: {
        nip,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    }),
  ])

  if (!pdExists) {
    throw new BadRequestError('Perangkat Daerah asal pegawai tidak valid.')
  }
  if (duplicateNip) {
    throw new ConflictError(
      excludeId
        ? `NIP ${nip} sudah digunakan pegawai lain.`
        : `NIP ${nip} sudah terdaftar pada pegawai lain.`
    )
  }
}

export async function listPegawai(query: PegawaiQuery) {
  const items = await prisma.pegawai.findMany({
    where: {
      ...(query.perangkatDaerahId
        ? { perangkatDaerahId: query.perangkatDaerahId }
        : {}),
      ...(query.golongan ? { golongan: query.golongan } : {}),
    },
    include: {
      perangkatDaerah: true,
      _count: {
        select: { kendaraan: true },
      },
    },
    orderBy: { nama: 'asc' },
  })

  if (!query.search) return items
  const q = query.search.toLowerCase()
  return items.filter(
    (item) =>
      item.nip.toLowerCase().includes(q) ||
      item.nama.toLowerCase().includes(q) ||
      item.jabatan.toLowerCase().includes(q)
  )
}

export async function getPegawaiById(id: number) {
  const item = await prisma.pegawai.findUnique({
    where: { id },
    include: {
      perangkatDaerah: true,
      kendaraan: {
        include: { perangkatDaerah: true },
        orderBy: { id: 'desc' },
      },
    },
  })

  if (!item) {
    throw new NotFoundError('Data PNS tidak ditemukan.')
  }

  return {
    ...item,
    kendaraan: item.kendaraan.map((k) => serializeKendaraan(k)),
  }
}

export async function createPegawai(input: PegawaiInput) {
  await validatePegawaiRelations(input.nip, input.perangkatDaerahId)

  return prisma.pegawai.create({
    data: {
      nip: input.nip,
      nama: input.nama,
      jabatan: input.jabatan,
      golongan: input.golongan,
      pangkat: input.pangkat,
      noHp: input.noHp,
      email: input.email,
      perangkatDaerahId: input.perangkatDaerahId,
    },
    include: { perangkatDaerah: true },
  })
}

export async function updatePegawai(id: number, input: PegawaiInput) {
  const existing = await prisma.pegawai.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!existing) {
    throw new NotFoundError('Data PNS tidak ditemukan.')
  }

  await validatePegawaiRelations(input.nip, input.perangkatDaerahId, id)

  return prisma.pegawai.update({
    where: { id },
    data: {
      nip: input.nip,
      nama: input.nama,
      jabatan: input.jabatan,
      golongan: input.golongan,
      pangkat: input.pangkat,
      noHp: input.noHp,
      email: input.email,
      perangkatDaerahId: input.perangkatDaerahId,
    },
    include: { perangkatDaerah: true },
  })
}

export async function deletePegawai(id: number) {
  await prisma.$transaction(async (tx) => {
    const target = await tx.pegawai.findUnique({
      where: { id },
      include: {
        kendaraan: {
          include: { perangkatDaerah: true },
        },
      },
    })

    if (!target) {
      throw new NotFoundError('Data PNS tidak ditemukan.')
    }

    // Lepaskan penanggung jawab pada KDO yang dipegang PNS ini dan catat ke riwayat
    for (const k of target.kendaraan) {
      await tx.riwayatKendaraan.create({
        data: {
          kendaraanId: k.id,
          pegawaiId: null,
          pegawaiNamaSnapshot: null,
          perangkatDaerahId: k.perangkatDaerahId,
          perangkatDaerahNamaSnapshot: k.perangkatDaerah.nama,
          jenisPerubahan: 'PENUGASAN',
          kondisiSaatItu: k.kondisi,
          nomorBast: '-',
          catatan: `Penanggung jawab (${target.nama}) dilepas karena data pegawai dihapus; kendaraan kembali ke Pool Perangkat Daerah.`,
        },
      })

      await tx.kendaraanDinas.update({
        where: { id: k.id },
        data: { pegawaiId: null },
      })
    }

    await tx.pegawai.delete({ where: { id } })
  })

  return { id }
}
