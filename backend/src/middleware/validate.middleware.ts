import { z } from 'zod'
import { BadRequestError } from '../lib/httpError'

export const idParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: 'Parameter id harus berupa angka.' })
    .int('Parameter id harus berupa bilangan bulat.')
    .positive('Parameter id harus lebih besar dari 0.'),
})

export function parseIdParam(rawId: string): number {
  const result = idParamSchema.safeParse({ id: rawId })
  if (!result.success) {
    throw new BadRequestError(
      result.error.issues[0]?.message ?? 'Parameter ID tidak valid.'
    )
  }
  return result.data.id
}
