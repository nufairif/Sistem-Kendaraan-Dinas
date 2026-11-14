import { z } from 'zod'
import { kondisiKendaraanEnum } from './kendaraan.schema'

export const statusPeminjamanEnum = z.enum([
  'DIPINJAM',
  'TERJADWAL',
  'SELESAI',
  'DIBATALKAN',
])

const ymdDateSchema = z
  .string({ required_error: 'Tanggal wajib diisi.' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD.')

const nullableKmSchema = z
  .union([
    z.coerce
      .number()
      .int('Kilometer harus bilangan bulat.')
      .min(0, 'Kilometer tidak boleh negatif.'),
    z.null(),
  ])
  .optional()
  .default(null)

export const peminjamanInputSchema = z
  .object({
    kendaraanId: z.coerce
      .number({ invalid_type_error: 'Kendaraan dinas wajib dipilih.' })
      .int()
      .positive('Kendaraan dinas wajib dipilih.'),
    peminjamPegawaiId: z
      .union([z.coerce.number().int().positive(), z.null()])
      .optional()
      .default(null),
    peminjamNama: z
      .string({ required_error: 'Nama peminjam wajib diisi.' })
      .trim()
      .min(1, 'Nama peminjam wajib diisi.'),
    peminjamInstansi: z.string().trim().optional().default(''),
    tujuanKeperluan: z
      .string({ required_error: 'Tujuan / keperluan tugas wajib diisi.' })
      .trim()
      .min(1, 'Tujuan / keperluan tugas wajib diisi.'),
    lokasiTujuan: z.string().trim().optional().default(''),
    tanggalPinjam: ymdDateSchema,
    tanggalKembaliRencana: ymdDateSchema,
    tanggalKembaliAktual: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD.')
      .nullable()
      .optional()
      .default(null),
    status: statusPeminjamanEnum,
    nomorSuratTugas: z.string().trim().optional().default(''),
    kilometerAwal: nullableKmSchema,
    kilometerAkhir: nullableKmSchema,
    kondisiSaatKembali: kondisiKendaraanEnum.nullable().optional().default(null),
    catatan: z.string().trim().optional().default(''),
  })
  .refine((data) => data.tanggalKembaliRencana >= data.tanggalPinjam, {
    message:
      'Tanggal rencana kembali tidak boleh lebih awal dari tanggal pinjam.',
    path: ['tanggalKembaliRencana'],
  })

export const completePeminjamanSchema = z.object({
  tanggalKembaliAktual: ymdDateSchema,
  kilometerAkhir: nullableKmSchema,
  kondisiSaatKembali: kondisiKendaraanEnum,
  catatan: z.string().trim().optional().default(''),
})

export const peminjamanQuerySchema = z.object({
  kendaraanId: z.coerce.number().int().positive().optional(),
  perangkatDaerahId: z.coerce.number().int().positive().optional(),
  status: statusPeminjamanEnum.optional(),
  search: z.string().trim().optional(),
})

