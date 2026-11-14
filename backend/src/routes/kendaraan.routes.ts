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
  kendaraanInputSchema,
  kendaraanQuerySchema,
} from '../schemas/kendaraan.schema'
import {
  createKendaraan,
  deleteKendaraan,
  getKendaraanById,
  listKendaraan,
  listRiwayatByKendaraan,
  updateKendaraan,
} from '../services/kendaraan.service'

export const kendaraanRouter = Router()

kendaraanRouter.use(authenticate)

kendaraanRouter.get(
  '/',
  requireAnyPermission(
    ['kendaraan', 'read'],
    ['pajakDokumen', 'read'],
    ['servis', 'read'],
    ['peminjaman', 'read']
  ),
  asyncHandler(async (req, res) => {
    const query = kendaraanQuerySchema.parse(req.query)
    const items = await listKendaraan(query)
    sendSuccess(
      res,
      items,
      'Daftar Kendaraan Dinas Operasional (KDO) berhasil dimuat.',
      200,
      { total: items.length }
    )
  })
)

kendaraanRouter.get(
  '/:id',
  requireAnyPermission(
    ['kendaraan', 'read'],
    ['pajakDokumen', 'read'],
    ['servis', 'read'],
    ['peminjaman', 'read']
  ),
  asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id)
    const item = await getKendaraanById(id)
    sendSuccess(
      res,
      item,
      'Detail Kendaraan Dinas Operasional (KDO) berhasil dimuat.'
    )
  })
)

kendaraanRouter.get(
  '/:id/riwayat',
  requireAnyPermission(['kendaraan', 'read'], ['dashboard', 'read']),
  asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id)
    const riwayat = await listRiwayatByKendaraan(id)
    sendSuccess(
      res,
      riwayat,
      'Riwayat perubahan kendaraan dinas berhasil dimuat.',
      200,
      { total: riwayat.length }
    )
  })
)

kendaraanRouter.post(
  '/',
  requirePermission('kendaraan', 'create'),
  asyncHandler(async (req, res) => {
    const input = kendaraanInputSchema.parse(req.body)
    const created = await createKendaraan(input)
    sendCreated(
      res,
      created,
      'Kendaraan dinas operasional berhasil ditambahkan.'
    )
  })
)

kendaraanRouter.put(
  '/:id',
  requirePermission('kendaraan', 'update'),
  asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id)
    const input = kendaraanInputSchema.parse(req.body)
    const updated = await updateKendaraan(id, input)
    sendSuccess(res, updated, 'Data kendaraan dinas berhasil diperbarui.')
  })
)

kendaraanRouter.delete(
  '/:id',
  requirePermission('kendaraan', 'delete'),
  asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id)
    const deleted = await deleteKendaraan(id)
    sendSuccess(res, deleted, 'Data kendaraan dinas berhasil dihapus.')
  })
)
