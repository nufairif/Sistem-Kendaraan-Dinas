import { z } from 'zod'

export const perangkatDaerahInputSchema = z.object({
  kodeSkpd: z
    .string({ required_error: 'Kode SKPD wajib diisi.' })
    .trim()
    .min(1, 'Kode SKPD wajib diisi.'),
  nama: z
    .string({ required_error: 'Nama Perangkat Daerah wajib diisi.' })
    .trim()
    .min(1, 'Nama Perangkat Daerah wajib diisi.'),
  singkatan: z
    .string({ required_error: 'Singkatan wajib diisi.' })
    .trim()
    .min(1, 'Singkatan wajib diisi.'),
  kepalaDinas: z.string().trim().optional().default(''),
  alamat: z.string().trim().optional().default(''),
  telepon: z.string().trim().optional().default(''),
})

export const perangkatDaerahQuerySchema = z.object({
  search: z.string().trim().optional(),
})
