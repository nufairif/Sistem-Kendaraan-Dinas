import { z } from 'zod'

export const dashboardQuerySchema = z.object({
  perangkatDaerahId: z.coerce.number().int().positive().optional(),
})
