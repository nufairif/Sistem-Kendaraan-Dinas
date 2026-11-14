import type { KendaraanDinas, Pegawai, PerangkatDaerah, Prisma } from '@prisma/client'
import type { z } from 'zod'
import { prisma } from '../lib/db'
import { BadRequestError, ConflictError, NotFoundError } from '../lib/httpError'
import type {
  kendaraanInputSchema,
  kendaraanQuerySchema,
} from '../schemas/kendaraan.schema'
import { serializeKendaraan } from '../lib/serializers'

export type KendaraanInput = z.infer<typeof kendaraanInputSchema>
export type KendaraanQuery = z.infer<typeof kendaraanQuerySchema>

function toKendaraanMutationData(input: KendaraanInput) {
  return {
    nomorPolisi: input.nomorPolisi,
    kodeBarang: input.kodeBarang,
    merek: input.merek,
    tipeModel: input.tipeModel,
    jenis: input.jenis,
    tahunProduksi: input.tahunProduksi,
    warna: input.warna,
    nomorRangka: input.nomorRangka,
    nomorMesin: input.nomorMesin,
    kondisi: input.kondisi,
    lokasiParkir: input.lokasiParkir,
    keterangan: input.keterangan,
    fotos: JSON.stringify(input.fotos),
    dokumenStnk: input.dokumenStnk ? JSON.stringify(input.dokumenStnk) : null,
    dokumenBpkb: input.dokumenBpkb ? JSON.stringify(input.dokumenBpkb) : null,
    pajakTahunanJatuhTempo: input.pajakTahunanJatuhTempo,
    pajakLimaTahunanJatuhTempo: input.pajakLimaTahunanJatuhTempo,
    perangkatDaerahId: input.perangkatDaerahId,
    pegawaiId: input.pegawaiId,
  }
}

async function resolveKendaraanRelations(
  input: KendaraanInput,
  excludeId?: number
): Promise<{ pd: PerangkatDaerah; pegawaiObj: Pegawai | null }> {
  const [duplicateNopol, pd, pegawaiObj] = await Promise.all([
    prisma.kendaraanDinas.findFirst({
      where: {
        nomorPolisi: input.nomorPolisi,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    }),
    prisma.perangkatDaerah.findUnique({
      where: { id: input.perangkatDaerahId },
    }),
    input.pegawaiId !== null
      ? prisma.pegawai.findUnique({ where: { id: input.pegawaiId } })
      : Promise.resolve(null),
  ])

  if (duplicateNopol) {
    throw new ConflictError(
      excludeId
        ? `Nomor polisi "${input.nomorPolisi}" sudah digunakan oleh kendaraan lain.`
        : `Nomor polisi "${input.nomorPolisi}" sudah terdaftar dalam sistem.`
    )
  }
  if (!pd) {
    throw new BadRequestError('Perangkat Daerah pemilik kendaraan wajib dipilih.')
  }
  if (input.pegawaiId !== null && !pegawaiObj) {
    throw new BadRequestError(
      'Pegawai penanggung jawab yang dipilih tidak ditemukan.'
    )
  }

  return { pd, pegawaiObj }
}

async function recordUpdateRiwayatIfChanged(
  tx: Prisma.TransactionClient,
  existing: KendaraanDinas,
  updated: KendaraanDinas,
  pd: PerangkatDaerah,
  pegawaiObj: Pegawai | null,
  input: KendaraanInput
) {
  const skpdChanged = existing.perangkatDaerahId !== updated.perangkatDaerahId
  const pegawaiChanged = existing.pegawaiId !== updated.pegawaiId
  const kondisiChanged = existing.kondisi !== updated.kondisi

  if (!skpdChanged && !pegawaiChanged && !kondisiChanged) {
    return
  }

  const messages: string[] = []
  if (skpdChanged) {
    const oldPd = await tx.perangkatDaerah.findUnique({
      where: { id: existing.perangkatDaerahId },
      select: { singkatan: true },
    })
    messages.push(`Mutasi SKPD dari ${oldPd?.singkatan ?? '-'} ke ${pd.singkatan}.`)
  }
  if (pegawaiChanged) {
    const oldPegawai = existing.pegawaiId
      ? await tx.pegawai.findUnique({
          where: { id: existing.pegawaiId },
          select: { nama: true },
        })
      : null
    messages.push(
      `Penanggung jawab berubah dari ${oldPegawai?.nama ?? 'Pool Dinas'} menjadi ${pegawaiObj?.nama ?? 'Pool Dinas'}.`
    )
  }
  if (kondisiChanged) {
    messages.push(`Kondisi berubah dari ${existing.kondisi} menjadi ${updated.kondisi}.`)
  }

  const jenisPerubahan = skpdChanged
    ? 'MUTASI_SKPD'
    : pegawaiChanged
      ? 'PENUGASAN'
      : 'KONDISI'

  await tx.riwayatKendaraan.create({
    data: {
      kendaraanId: updated.id,
      pegawaiId: updated.pegawaiId,
      pegawaiNamaSnapshot: pegawaiObj?.nama ?? null,
      perangkatDaerahId: pd.id,
      perangkatDaerahNamaSnapshot: pd.nama,
      jenisPerubahan,
      kondisiSaatItu: updated.kondisi,
      nomorBast: input.nomorBast || '-',
      catatan: input.catatanPerubahan || messages.join(' '),
    },
  })
}

export async function listKendaraan(query: KendaraanQuery) {
  const items = await prisma.kendaraanDinas.findMany({
    where: {
      ...(query.kondisi ? { kondisi: query.kondisi } : {}),
      ...(query.jenis ? { jenis: query.jenis } : {}),
      ...(query.perangkatDaerahId
        ? { perangkatDaerahId: query.perangkatDaerahId }
        : {}),
      ...(query.pegawaiId ? { pegawaiId: query.pegawaiId } : {}),
      ...(query.penugasan === 'ASSIGNED' ? { pegawaiId: { not: null } } : {}),
      ...(query.penugasan === 'POOL' ? { pegawaiId: null } : {}),
    },
    include: {
      perangkatDaerah: true,
      pegawai: true,
    },
    orderBy: { id: 'desc' },
  })

  const filtered = query.search
    ? items.filter((item) => {
        const q = query.search!.toLowerCase()
        return (
          item.nomorPolisi.toLowerCase().includes(q) ||
          item.merek.toLowerCase().includes(q) ||
          item.tipeModel.toLowerCase().includes(q) ||
          item.kodeBarang.toLowerCase().includes(q)
        )
      })
    : items

  return filtered.map((item) => serializeKendaraan(item))
}

export async function getKendaraanById(id: number) {
  const item = await prisma.kendaraanDinas.findUnique({
    where: { id },
    include: {
      perangkatDaerah: true,
      pegawai: true,
      riwayat: { orderBy: { tanggal: 'desc' } },
      servis: { orderBy: [{ tanggalServis: 'desc' }, { id: 'desc' }] },
    },
  })

  if (!item) {
    throw new NotFoundError('Data kendaraan dinas tidak ditemukan.')
  }

  return serializeKendaraan(item)
}

export async function listRiwayatByKendaraan(kendaraanId: number) {
  const exists = await prisma.kendaraanDinas.findUnique({
    where: { id: kendaraanId },
    select: { id: true },
  })
  if (!exists) {
    throw new NotFoundError('Data kendaraan dinas tidak ditemukan.')
  }

  return prisma.riwayatKendaraan.findMany({
    where: { kendaraanId },
    orderBy: { tanggal: 'desc' },
  })
}

export async function createKendaraan(input: KendaraanInput) {
  const { pd, pegawaiObj } = await resolveKendaraanRelations(input)

  const created = await prisma.$transaction(async (tx) => {
    const k = await tx.kendaraanDinas.create({
      data: toKendaraanMutationData(input),
      include: {
        perangkatDaerah: true,
        pegawai: true,
      },
    })

    await tx.riwayatKendaraan.create({
      data: {
        kendaraanId: k.id,
        pegawaiId: k.pegawaiId,
        pegawaiNamaSnapshot: pegawaiObj?.nama ?? null,
        perangkatDaerahId: pd.id,
        perangkatDaerahNamaSnapshot: pd.nama,
        jenisPerubahan: 'PENDAFTARAN',
        kondisiSaatItu: k.kondisi,
        nomorBast: input.nomorBast || '-',
        catatan:
          input.catatanPerubahan ||
          (pegawaiObj
            ? `Registrasi awal KDO pada ${pd.nama} dengan penanggung jawab ${pegawaiObj.nama}.`
            : `Registrasi awal KDO pada Pool ${pd.nama}.`),
      },
    })

    return k
  })

  return serializeKendaraan(created)
}

export async function updateKendaraan(id: number, input: KendaraanInput) {
  const existing = await prisma.kendaraanDinas.findUnique({ where: { id } })
  if (!existing) {
    throw new NotFoundError('Data kendaraan dinas tidak ditemukan.')
  }

  const { pd, pegawaiObj } = await resolveKendaraanRelations(input, id)

  const updated = await prisma.$transaction(async (tx) => {
    const k = await tx.kendaraanDinas.update({
      where: { id },
      data: toKendaraanMutationData(input),
      include: {
        perangkatDaerah: true,
        pegawai: true,
      },
    })

    await recordUpdateRiwayatIfChanged(tx, existing, k, pd, pegawaiObj, input)
    return k
  })

  return serializeKendaraan(updated)
}

export async function deleteKendaraan(id: number) {
  const existing = await prisma.kendaraanDinas.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!existing) {
    throw new NotFoundError('Data kendaraan dinas tidak ditemukan.')
  }

  await prisma.kendaraanDinas.delete({ where: { id } })
  return { id }
}
