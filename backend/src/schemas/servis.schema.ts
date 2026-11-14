import { z } from 'zod'
import { vehicleDocumentSchema } from './kendaraan.schema'

export const jenisServisEnum = z.enum([
  'SERVIS_RUTIN',
  'PERBAIKAN',
  'GANTI_BAN_AKI',
  'UJI_KIR',
  'LAINNYA',
])

export const statusServisEnum = z.enum([
  'TERJADWAL',
  'DALAM_PERBAIKAN',
  'SELESAI',
])

export const servisInputSchema = z.object({
  kendaraanId: z.coerce
    .number({ invalid_type_error: 'Kendaraan dinas wajib dipilih.' })
    .int()
    .positive('Kendaraan dinas wajib dipilih.'),
  tanggalServis: z
    .string({ required_error: 'Tanggal servis wajib diisi.' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal servis harus YYYY-MM-DD.'),
  jenisServis: jenisServisEnum,
  status: statusServisEnum,
  bengkel: z
    .string({ required_error: 'Nama bengkel/rekanan wajib diisi.' })
    .trim()
    .min(1, 'Nama bengkel/rekanan wajib diisi.'),
  kilometer: z
    .union([
      z.coerce
        .number()
        .int('Kilometer harus bilangan bulat.')
        .min(0, 'Kilometer tidak boleh negatif.'),
      z.null(),
    ])
    .optional()
    .default(null),
  biaya: z.coerce
    .number({ invalid_type_error: 'Biaya pemeliharaan harus berupa angka.' })
    .min(0, 'Biaya pemeliharaan tidak boleh bernilai negatif.')
    .transform((val) => Math.round(val)),
  servisBerikutnyaTanggal: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal servis berikutnya harus YYYY-MM-DD.')
    .nullable()
    .optional()
    .default(null),
  deskripsi: z
    .string({ required_error: 'Uraian pekerjaan servis wajib diisi.' })
    .trim()
    .min(1, 'Uraian pekerjaan wajib diisi.'),
  buktiNota: vehicleDocumentSchema.nullable().optional().default(null),
})

export const servisQuerySchema = z.object({
  kendaraanId: z.coerce.number().int().positive().optional(),
  perangkatDaerahId: z.coerce.number().int().positive().optional(),
  status: statusServisEnum.optional(),
  jenisServis: jenisServisEnum.optional(),
  search: z.string().trim().optional(),
})
