import type { z } from 'zod'
import { prisma } from '../lib/db'
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../lib/httpError'
import { serializePeminjaman } from '../lib/serializers'
import { getTaxStatus } from '../lib/tax'
import type {
  completePeminjamanSchema,
  peminjamanInputSchema,
  peminjamanQuerySchema,
} from '../schemas/peminjaman.schema'

export type PeminjamanInput = z.infer<typeof peminjamanInputSchema>
export type CompletePeminjamanInput = z.infer<typeof completePeminjamanSchema>
export type PeminjamanQuery = z.infer<typeof peminjamanQuerySchema>

function getKondisiLabel(kondisi: string): string {
  switch (kondisi) {
    case 'BAIK':
      return 'Baik'
    case 'RUSAK_RINGAN':
      return 'Rusak Ringan'
    case 'RUSAK_BERAT':
      return 'Rusak Berat'
    default:
      return kondisi
  }
}

async function validatePeminjamanRelationsAndSchedule(
  input: PeminjamanInput,
  excludeId?: number
) {
  const [kendaraan, pegawai, servisList, overlappingLoans] = await Promise.all([
    prisma.kendaraanDinas.findUnique({ where: { id: input.kendaraanId } }),
    input.peminjamPegawaiId !== null
      ? prisma.pegawai.findUnique({
          where: { id: input.peminjamPegawaiId },
          select: { id: true },
        })
      : Promise.resolve(true),
    prisma.servisKendaraan.findMany({
      where: {
        kendaraanId: input.kendaraanId,
        status: 'DALAM_PERBAIKAN',
      },
      select: { id: true },
    }),
    prisma.peminjamanKendaraan.findMany({
      where: {
        kendaraanId: input.kendaraanId,
        status: { in: ['DIPINJAM', 'TERJADWAL'] },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    }),
  ])

  if (!kendaraan) {
    throw new BadRequestError('Kendaraan dinas yang dipilih tidak ditemukan.')
  }
  if (!pegawai) {
    throw new BadRequestError('PNS peminjam yang dipilih tidak ditemukan.')
  }

  const isBookingActive =
    input.status === 'DIPINJAM' || input.status === 'TERJADWAL'
  if (isBookingActive) {
    const blockReasons: string[] = []
    if (kendaraan.kondisi !== 'BAIK') {
      blockReasons.push(`Kondisi ${getKondisiLabel(kendaraan.kondisi)}`)
    }
    if (servisList.length > 0) {
      blockReasons.push('Sedang Dalam Perbaikan (Servis)')
    }
    const pkbOverdue =
      getTaxStatus(kendaraan.pajakTahunanJatuhTempo).status === 'OVERDUE'
    const platOverdue =
      getTaxStatus(kendaraan.pajakLimaTahunanJatuhTempo).status === 'OVERDUE'
    if (pkbOverdue || platOverdue) {
      blockReasons.push('Pajak / Plat Lewat Jatuh Tempo')
    }

    if (blockReasons.length > 0) {
      throw new BadRequestError(
        `Kendaraan ${kendaraan.nomorPolisi} tidak memenuhi syarat peminjaman (${blockReasons.join(', ')}). Hanya unit kondisi Baik, tidak sedang servis, dan pajak aktif yang boleh dipinjam.`
      )
    }

    const overlap = overlappingLoans.find(
      (p) =>
        p.tanggalPinjam <= input.tanggalKembaliRencana &&
        input.tanggalPinjam <= p.tanggalKembaliRencana
    )
    if (overlap) {
      throw new ConflictError(
        `Jadwal bentrok dengan peminjaman atas nama ${overlap.peminjamNama} (${overlap.tanggalPinjam} s/d ${overlap.tanggalKembaliRencana}).`
      )
    }
  }

  return kendaraan
}

export async function listPeminjaman(query: PeminjamanQuery) {
  const items = await prisma.peminjamanKendaraan.findMany({
    where: {
      ...(query.kendaraanId ? { kendaraanId: query.kendaraanId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.perangkatDaerahId
        ? { kendaraan: { perangkatDaerahId: query.perangkatDaerahId } }
        : {}),
    },
    include: {
      kendaraan: true,
    },
    orderBy: [{ tanggalPinjam: 'desc' }, { id: 'desc' }],
  })

  const filtered = query.search
    ? items.filter((item) => {
        const q = query.search!.toLowerCase()
        return (
          item.peminjamNama.toLowerCase().includes(q) ||
          item.peminjamInstansi.toLowerCase().includes(q) ||
          item.tujuanKeperluan.toLowerCase().includes(q) ||
          item.lokasiTujuan.toLowerCase().includes(q) ||
          item.nomorSuratTugas.toLowerCase().includes(q) ||
          item.kendaraan.nomorPolisi.toLowerCase().includes(q) ||
          `${item.kendaraan.merek} ${item.kendaraan.tipeModel}`
            .toLowerCase()
            .includes(q)
        )
      })
    : items

  return filtered.map(serializePeminjaman)
}

export async function getPeminjamanById(id: number) {
  const item = await prisma.peminjamanKendaraan.findUnique({
    where: { id },
    include: { kendaraan: true },
  })
  if (!item) {
    throw new NotFoundError('Data peminjaman kendaraan tidak ditemukan.')
  }
  return serializePeminjaman(item)
}

export async function createPeminjaman(input: PeminjamanInput) {
  await validatePeminjamanRelationsAndSchedule(input)

  const created = await prisma.peminjamanKendaraan.create({
    data: {
      kendaraanId: input.kendaraanId,
      peminjamPegawaiId: input.peminjamPegawaiId,
      peminjamNama: input.peminjamNama,
      peminjamInstansi: input.peminjamInstansi,
      tujuanKeperluan: input.tujuanKeperluan,
      lokasiTujuan: input.lokasiTujuan,
      tanggalPinjam: input.tanggalPinjam,
      tanggalKembaliRencana: input.tanggalKembaliRencana,
      tanggalKembaliAktual:
        input.status === 'SELESAI'
          ? input.tanggalKembaliAktual || input.tanggalKembaliRencana
          : null,
      status: input.status,
      nomorSuratTugas: input.nomorSuratTugas,
      kilometerAwal: input.kilometerAwal,
      kilometerAkhir: input.kilometerAkhir,
      kondisiSaatKembali: input.kondisiSaatKembali,
      catatan: input.catatan,
    },
    include: { kendaraan: true },
  })

  return serializePeminjaman(created)
}

export async function updatePeminjaman(id: number, input: PeminjamanInput) {
  const existing = await prisma.peminjamanKendaraan.findUnique({ where: { id } })
  if (!existing) {
    throw new NotFoundError('Data peminjaman kendaraan tidak ditemukan.')
  }

  await validatePeminjamanRelationsAndSchedule(input, id)

  const updated = await prisma.peminjamanKendaraan.update({
    where: { id },
    data: {
      kendaraanId: input.kendaraanId,
      peminjamPegawaiId: input.peminjamPegawaiId,
      peminjamNama: input.peminjamNama,
      peminjamInstansi: input.peminjamInstansi,
      tujuanKeperluan: input.tujuanKeperluan,
      lokasiTujuan: input.lokasiTujuan,
      tanggalPinjam: input.tanggalPinjam,
      tanggalKembaliRencana: input.tanggalKembaliRencana,
      tanggalKembaliAktual:
        input.status === 'SELESAI'
          ? input.tanggalKembaliAktual ||
            existing.tanggalKembaliAktual ||
            new Date().toISOString().slice(0, 10)
          : null,
      status: input.status,
      nomorSuratTugas: input.nomorSuratTugas,
      kilometerAwal: input.kilometerAwal,
      kilometerAkhir: input.kilometerAkhir,
      kondisiSaatKembali: input.kondisiSaatKembali,
      catatan: input.catatan,
    },
    include: { kendaraan: true },
  })

  return serializePeminjaman(updated)
}

export async function completePeminjaman(
  id: number,
  input: CompletePeminjamanInput
) {
  const existing = await prisma.peminjamanKendaraan.findUnique({
    where: { id },
    include: {
      kendaraan: {
        include: {
          perangkatDaerah: true,
          pegawai: true,
        },
      },
    },
  })
  if (!existing) {
    throw new NotFoundError('Data peminjaman kendaraan tidak ditemukan.')
  }

  const completed = await prisma.$transaction(async (tx) => {
    const updated = await tx.peminjamanKendaraan.update({
      where: { id },
      data: {
        tanggalKembaliAktual: input.tanggalKembaliAktual,
        kilometerAkhir: input.kilometerAkhir,
        kondisiSaatKembali: input.kondisiSaatKembali,
        catatan: input.catatan || existing.catatan,
        status: 'SELESAI',
      },
      include: { kendaraan: true },
    })

    if (existing.kendaraan.kondisi !== input.kondisiSaatKembali) {
      await tx.kendaraanDinas.update({
        where: { id: existing.kendaraanId },
        data: { kondisi: input.kondisiSaatKembali },
      })

      await tx.riwayatKendaraan.create({
        data: {
          kendaraanId: existing.kendaraanId,
          pegawaiId: existing.kendaraan.pegawaiId,
          pegawaiNamaSnapshot: existing.kendaraan.pegawai?.nama ?? null,
          perangkatDaerahId: existing.kendaraan.perangkatDaerahId,
          perangkatDaerahNamaSnapshot:
            existing.kendaraan.perangkatDaerah.nama,
          jenisPerubahan: 'KONDISI',
          kondisiSaatItu: input.kondisiSaatKembali,
          nomorBast: existing.nomorSuratTugas || '-',
          catatan: `Pembaruan kondisi saat pengembalian peminjaman (${existing.peminjamNama}): ${input.catatan || 'Pengecekan pasca pakai'}`,
        },
      })
    }

    return updated
  })

  return serializePeminjaman(completed)
}

export async function deletePeminjaman(id: number) {
  const existing = await prisma.peminjamanKendaraan.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!existing) {
    throw new NotFoundError('Data peminjaman kendaraan tidak ditemukan.')
  }

  await prisma.peminjamanKendaraan.delete({ where: { id } })
  return { id }
}

