import { z } from 'zod'

export const jenisKendaraanEnum = z.enum(['RODA_4', 'RODA_2', 'KHUSUS'])
export const kondisiKendaraanEnum = z.enum([
  'BAIK',
  'RUSAK_RINGAN',
  'RUSAK_BERAT',
])

export const vehiclePhotoSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  dataUrl: z.string().min(1),
})

export const vehicleDocumentSchema = z.object({
  fileName: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  dataUrl: z.string().min(1),
  uploadedAt: z.string().trim().min(1),
})

const nullableDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD.')
  .nullable()
  .optional()
  .default(null)

export const kendaraanInputSchema = z.object({
  nomorPolisi: z
    .string({ required_error: 'Nomor polisi wajib diisi.' })
    .trim()
    .min(1, 'Nomor polisi wajib diisi.')
    .transform((val) => val.toUpperCase().replace(/\s+/g, ' ')),
  kodeBarang: z.string().trim().optional().default(''),
  merek: z
    .string({ required_error: 'Merek kendaraan wajib diisi.' })
    .trim()
    .min(1, 'Merek kendaraan wajib diisi.'),
  tipeModel: z
    .string({ required_error: 'Tipe/model kendaraan wajib diisi.' })
    .trim()
    .min(1, 'Tipe/model kendaraan wajib diisi.'),
  jenis: jenisKendaraanEnum,
  tahunProduksi: z.coerce
    .number({ invalid_type_error: 'Tahun produksi harus berupa angka.' })
    .int('Tahun produksi harus bilangan bulat.')
    .min(1980, 'Tahun produksi minimal 1980.')
    .max(
      new Date().getFullYear() + 1,
      `Tahun produksi maksimal ${new Date().getFullYear() + 1}.`
    ),
  warna: z
    .string({ required_error: 'Warna kendaraan wajib diisi.' })
    .trim()
    .min(1, 'Warna kendaraan wajib diisi.'),
  nomorRangka: z
    .string()
    .trim()
    .optional()
    .default('')
    .transform((val) => val.toUpperCase()),
  nomorMesin: z
    .string()
    .trim()
    .optional()
    .default('')
    .transform((val) => val.toUpperCase()),
  kondisi: kondisiKendaraanEnum,
  lokasiParkir: z.string().trim().optional().default(''),
  keterangan: z.string().trim().optional().default(''),
  fotos: z
    .array(vehiclePhotoSchema)
    .max(6, 'Maksimal 6 foto per kendaraan.')
    .optional()
    .default([]),
  dokumenStnk: vehicleDocumentSchema.nullable().optional().default(null),
  dokumenBpkb: vehicleDocumentSchema.nullable().optional().default(null),
  pajakTahunanJatuhTempo: nullableDateString,
  pajakLimaTahunanJatuhTempo: nullableDateString,
  perangkatDaerahId: z.coerce
    .number({ invalid_type_error: 'Perangkat Daerah pemilik wajib dipilih.' })
    .int()
    .positive('Perangkat Daerah pemilik kendaraan wajib dipilih.'),
  pegawaiId: z
    .union([z.coerce.number().int().positive(), z.null()])
    .optional()
    .default(null),
  nomorBast: z.string().trim().optional(),
  catatanPerubahan: z.string().trim().optional(),
})

export const kendaraanQuerySchema = z.object({
  kondisi: kondisiKendaraanEnum.optional(),
  jenis: jenisKendaraanEnum.optional(),
  perangkatDaerahId: z.coerce.number().int().positive().optional(),
  pegawaiId: z.coerce.number().int().positive().optional(),
  penugasan: z.enum(['ASSIGNED', 'POOL']).optional(),
  search: z.string().trim().optional(),
})
