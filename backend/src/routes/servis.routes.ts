import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler'
import { sendCreated, sendSuccess } from '../lib/apiResponse'
import {
  authenticate,
  requireAnyPermission,
  requirePermission,
} from '../middleware/auth.middleware'
import { parseIdParam } from '../middleware/validate.middleware'
import { servisInputSchema, servisQuerySchema } from '../schemas/servis.schema'
import {
  createServis,
  deleteServis,
  getServisById,
  listServis,
  updateServis,
} from '../services/servis.service'

export const servisRouter = Router()

servisRouter.use(authenticate)

servisRouter.get(
  '/',
  requireAnyPermission(['servis', 'read'], ['peminjaman', 'read']),
  asyncHandler(async (req, res) => {
    const query = servisQuerySchema.parse(req.query)
    const items = await listServis(query)
    sendSuccess(
      res,
      items,
      'Daftar catatan servis & pemeliharaan berhasil dimuat.',
      200,
      { total: items.length }
    )
  })
)

servisRouter.get(
  '/:id',
  requireAnyPermission(['servis', 'read'], ['peminjaman', 'read']),
  asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id)
    const item = await getServisById(id)
    sendSuccess(res, item, 'Detail catatan servis berhasil dimuat.')
  })
)

servisRouter.post(
  '/',
  requirePermission('servis', 'create'),
  asyncHandler(async (req, res) => {
    const input = servisInputSchema.parse(req.body)
    const created = await createServis(input)
    sendCreated(
      res,
      created,
      'Catatan servis & pemeliharaan berhasil ditambahkan.'
    )
  })
)

servisRouter.put(
  '/:id',
  requirePermission('servis', 'update'),
  asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id)
    const input = servisInputSchema.parse(req.body)
    const updated = await updateServis(id, input)
    sendSuccess(res, updated, 'Data catatan servis berhasil diperbarui.')
  })
)

servisRouter.delete(
  '/:id',
  requirePermission('servis', 'delete'),
  asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id)
    const deleted = await deleteServis(id)
    sendSuccess(res, deleted, 'Data catatan servis berhasil dihapus.')
  })
)
