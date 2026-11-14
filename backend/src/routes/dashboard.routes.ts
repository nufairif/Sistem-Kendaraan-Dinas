import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler'
import { sendSuccess } from '../lib/apiResponse'
import { authenticate, requirePermission } from '../middleware/auth.middleware'
import { dashboardQuerySchema } from '../schemas/dashboard.schema'
import { getDashboardSummary } from '../services/dashboard.service'

export const dashboardRouter = Router()

dashboardRouter.use(authenticate)

dashboardRouter.get(
  '/',
  requirePermission('dashboard', 'read'),
  asyncHandler(async (req, res) => {
    const { perangkatDaerahId } = dashboardQuerySchema.parse(req.query)
    const summary = await getDashboardSummary(perangkatDaerahId)
    sendSuccess(res, summary, 'Ringkasan dashboard BMD berhasil dimuat.')
  })
)
