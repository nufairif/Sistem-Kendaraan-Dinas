import { z } from 'zod'

export const loginSchema = z.object({
  identifier: z
    .string({ required_error: 'Username atau email wajib diisi.' })
    .trim()
    .min(1, 'Username/Email wajib diisi.'),
  password: z
    .string({ required_error: 'Kata sandi wajib diisi.' })
    .min(1, 'Kata sandi wajib diisi.'),
})
