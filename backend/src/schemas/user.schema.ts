import { z } from 'zod'
import { normalizeRoleCode } from '../lib/permissions'

export const roleCodeSchema = z
  .string({ required_error: 'Role pengguna wajib dipilih.' })
  .trim()
  .min(1, 'Role pengguna wajib dipilih.')
  .transform(normalizeRoleCode)
  .refine((val) => val.length > 0, {
    message: 'Kode role tidak valid (gunakan huruf/angka).',
  })

const baseUserSchema = z.object({
  username: z
    .string({ required_error: 'Username wajib diisi.' })
    .trim()
    .min(3, 'Username minimal 3 karakter.')
    .transform((val) => val.toLowerCase()),
  nama: z
    .string({ required_error: 'Nama lengkap wajib diisi.' })
    .trim()
    .min(1, 'Nama lengkap wajib diisi.'),
  email: z
    .string({ required_error: 'Email wajib diisi.' })
    .trim()
    .email('Format email tidak valid.')
    .transform((val) => val.toLowerCase()),
  role: roleCodeSchema,
  perangkatDaerahId: z
    .union([z.coerce.number().int().positive(), z.null()])
    .optional()
    .default(null),
  aktif: z.boolean().optional().default(true),
})

export const createUserSchema = baseUserSchema
  .extend({
    password: z
      .string({ required_error: 'Kata sandi wajib diisi.' })
      .trim()
      .min(6, 'Kata sandi minimal 6 karakter.'),
  })
  .refine(
    (data) => !(data.role === 'OPERATOR_SKPD' && data.perangkatDaerahId === null),
    {
      message: 'Operator SKPD wajib ditautkan ke Perangkat Daerah tertentu.',
      path: ['perangkatDaerahId'],
    }
  )

export const updateUserSchema = baseUserSchema
  .extend({
    password: z
      .string()
      .trim()
      .min(6, 'Kata sandi baru minimal 6 karakter.')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => !(data.role === 'OPERATOR_SKPD' && data.perangkatDaerahId === null),
    {
      message: 'Operator SKPD wajib ditautkan ke Perangkat Daerah tertentu.',
      path: ['perangkatDaerahId'],
    }
  )

export const userQuerySchema = z.object({
  role: z
    .string()
    .trim()
    .transform(normalizeRoleCode)
    .optional(),
  aktif: z.enum(['true', 'false']).optional(),
  search: z.string().trim().optional(),
})
