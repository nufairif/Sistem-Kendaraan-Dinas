import { z } from 'zod'

export const pegawaiInputSchema = z.object({
  nip: z
    .string({ required_error: 'NIP PNS wajib diisi.' })
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => val.length === 18, {
      message: 'NIP PNS harus terdiri dari tepat 18 digit angka.',
    }),
  nama: z
    .string({ required_error: 'Nama pegawai wajib diisi.' })
    .trim()
    .min(1, 'Nama pegawai wajib diisi.'),
  jabatan: z
    .string({ required_error: 'Jabatan wajib diisi.' })
    .trim()
    .min(1, 'Jabatan wajib diisi.'),
  golongan: z
    .string({ required_error: 'Golongan wajib diisi.' })
    .trim()
    .min(1, 'Golongan wajib diisi.'),
  pangkat: z.string().trim().optional().default(''),
  noHp: z.string().trim().optional().default(''),
  email: z
    .string()
    .trim()
    .email('Format email pegawai tidak valid.')
    .or(z.literal(''))
    .optional()
    .default(''),
  perangkatDaerahId: z.coerce
    .number({ invalid_type_error: 'Perangkat Daerah asal pegawai tidak valid.' })
    .int()
    .positive('Perangkat Daerah asal pegawai wajib dipilih.'),
})

export const pegawaiQuerySchema = z.object({
  perangkatDaerahId: z.coerce.number().int().positive().optional(),
  golongan: z.string().trim().optional(),
  search: z.string().trim().optional(),
})
