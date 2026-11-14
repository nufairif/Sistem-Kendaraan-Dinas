import { z } from 'zod'
import {
  normalizePermissionMap,
  normalizeRoleCode,
  PAGE_PERMISSION_KEYS,
} from '../lib/permissions'

const crudPermissionSchema = z.object({
  read: z.boolean().default(false),
  create: z.boolean().default(false),
  update: z.boolean().default(false),
  delete: z.boolean().default(false),
})

const permissionMapShape = Object.fromEntries(
  PAGE_PERMISSION_KEYS.map((key) => [key, crudPermissionSchema.optional()])
) as Record<(typeof PAGE_PERMISSION_KEYS)[number], z.ZodOptional<typeof crudPermissionSchema>>

export const roleInputSchema = z.object({
  code: z
    .string({ required_error: 'Kode role wajib diisi.' })
    .trim()
    .min(1, 'Kode role wajib diisi.')
    .transform(normalizeRoleCode)
    .refine((val) => val.length > 0, {
      message: 'Kode role harus mengandung huruf atau angka.',
    }),
  name: z
    .string({ required_error: 'Nama role wajib diisi.' })
    .trim()
    .min(1, 'Nama role wajib diisi.'),
  description: z.string().trim().optional().default(''),
  permissions: z
    .object(permissionMapShape)
    .optional()
    .default({})
    .transform((val) => normalizePermissionMap(val)),
})

export const roleQuerySchema = z.object({
  search: z.string().trim().optional(),
})

