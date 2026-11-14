import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler'
import { sendSuccess } from '../lib/apiResponse'
import { prisma } from '../lib/db'

export const healthRouter = Router()

healthRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`
    sendSuccess(
      res,
      {
        status: 'UP',
        service: 'si-kdo-bmd-api',
        database: 'connected',
        timestamp: new Date().toISOString(),
      },
      'Server REST API SI-KDO BMD berjalan normal.'
    )
  })
)
