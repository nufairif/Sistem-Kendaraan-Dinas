import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler'
import { sendCreated, sendSuccess } from '../lib/apiResponse'
import {
  authenticate,
  requireAnyPermission,
  requirePermission,
} from '../middleware/auth.middleware'
import { parseIdParam } from '../middleware/validate.middleware'
import {
  perangkatDaerahInputSchema,
  perangkatDaerahQuerySchema,
} from '../schemas/perangkat-daerah.schema'
import {
  createPerangkatDaerah,
  deletePerangkatDaerah,
  getPerangkatDaerahById,
  listPerangkatDaerah,
  updatePerangkatDaerah,
} from '../services/perangkat-daerah.service'

export const perangkatDaerahRouter = Router()

perangkatDaerahRouter.use(authenticate)

perangkatDaerahRouter.get(
  '/',
  requireAnyPermission(
    ['perangkatDaerah', 'read'],
    ['dashboard', 'read'],
    ['kendaraan', 'read'],
    ['pajakDokumen', 'read'],
    ['servis', 'read'],
    ['peminjaman', 'read'],
    ['pegawai', 'read'],
    ['users', 'read']
  ),
  asyncHandler(async (req, res) => {
    const { search } = perangkatDaerahQuerySchema.parse(req.query)
    const items = await listPerangkatDaerah(search)
    sendSuccess(res, items, 'Daftar Perangkat Daerah berhasil dimuat.', 200, {
      total: items.length,
    })
  })
)

perangkatDaerahRouter.get(
  '/:id',
  requireAnyPermission(
    ['perangkatDaerah', 'read'],
    ['kendaraan', 'read'],
    ['pajakDokumen', 'read'],
    ['servis', 'read'],
    ['peminjaman', 'read'],
    ['pegawai', 'read'],
    ['users', 'read']
  ),
  asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id)
    const item = await getPerangkatDaerahById(id)
    sendSuccess(res, item, 'Detail Perangkat Daerah berhasil dimuat.')
  })
)

perangkatDaerahRouter.post(
  '/',
  requirePermission('perangkatDaerah', 'create'),
  asyncHandler(async (req, res) => {
    const input = perangkatDaerahInputSchema.parse(req.body)
    const created = await createPerangkatDaerah(input)
    sendCreated(res, created, 'Perangkat Daerah berhasil ditambahkan.')
  })
)

perangkatDaerahRouter.put(
  '/:id',
  requirePermission('perangkatDaerah', 'update'),
  asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id)
    const input = perangkatDaerahInputSchema.parse(req.body)
    const updated = await updatePerangkatDaerah(id, input)
    sendSuccess(res, updated, 'Data Perangkat Daerah berhasil diperbarui.')
  })
)

perangkatDaerahRouter.delete(
  '/:id',
  requirePermission('perangkatDaerah', 'delete'),
  asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id)
    const deleted = await deletePerangkatDaerah(id)
    sendSuccess(res, deleted, 'Data Perangkat Daerah berhasil dihapus.')
  })
)
