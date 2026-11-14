import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler'
import { sendCreated, sendSuccess } from '../lib/apiResponse'
import {
  authenticate,
  requirePermission,
} from '../middleware/auth.middleware'
import { parseIdParam } from '../middleware/validate.middleware'
import {
  completePeminjamanSchema,
  peminjamanInputSchema,
  peminjamanQuerySchema,
} from '../schemas/peminjaman.schema'
import {
  completePeminjaman,
  createPeminjaman,
  deletePeminjaman,
  getPeminjamanById,
  listPeminjaman,
  updatePeminjaman,
} from '../services/peminjaman.service'

export const peminjamanRouter = Router()

peminjamanRouter.use(authenticate)

peminjamanRouter.get(
  '/',
  requirePermission('peminjaman', 'read'),
  asyncHandler(async (req, res) => {
    const query = peminjamanQuerySchema.parse(req.query)
    const items = await listPeminjaman(query)
    sendSuccess(
      res,
      items,
      'Daftar peminjaman & monitoring kendaraan berhasil dimuat.',
      200,
      { total: items.length }
    )
  })
)

peminjamanRouter.get(
  '/:id',
  requirePermission('peminjaman', 'read'),
  asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id)
    const item = await getPeminjamanById(id)
    sendSuccess(res, item, 'Detail peminjaman kendaraan berhasil dimuat.')
  })
)

peminjamanRouter.post(
  '/',
  requirePermission('peminjaman', 'create'),
  asyncHandler(async (req, res) => {
    const input = peminjamanInputSchema.parse(req.body)
    const created = await createPeminjaman(input)
    sendCreated(res, created, 'Jadwal peminjaman kendaraan berhasil disimpan.')
  })
)

peminjamanRouter.put(
  '/:id',
  requirePermission('peminjaman', 'update'),
  asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id)
    const input = peminjamanInputSchema.parse(req.body)
    const updated = await updatePeminjaman(id, input)
    sendSuccess(res, updated, 'Data peminjaman kendaraan berhasil diperbarui.')
  })
)

peminjamanRouter.post(
  '/:id/complete',
  requirePermission('peminjaman', 'update'),
  asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id)
    const input = completePeminjamanSchema.parse(req.body)
    const completed = await completePeminjaman(id, input)
    sendSuccess(
      res,
      completed,
      'Pengembalian kendaraan berhasil dicatat dan status peminjaman selesai.'
    )
  })
)

peminjamanRouter.delete(
  '/:id',
  requirePermission('peminjaman', 'delete'),
  asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id)
    const deleted = await deletePeminjaman(id)
    sendSuccess(res, deleted, 'Data peminjaman kendaraan berhasil dihapus.')
  })
)

