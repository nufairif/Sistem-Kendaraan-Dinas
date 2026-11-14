import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler'
import { sendCreated, sendSuccess } from '../lib/apiResponse'
import {
  authenticate,
  requireAnyPermission,
  requirePermission,
} from '../middleware/auth.middleware'
import { parseIdParam } from '../middleware/validate.middleware'
import { pegawaiInputSchema, pegawaiQuerySchema } from '../schemas/pegawai.schema'
import {
  createPegawai,
  deletePegawai,
  getPegawaiById,
  listPegawai,
  updatePegawai,
} from '../services/pegawai.service'

export const pegawaiRouter = Router()

pegawaiRouter.use(authenticate)

pegawaiRouter.get(
  '/',
  requireAnyPermission(
    ['pegawai', 'read'],
    ['kendaraan', 'read'],
    ['peminjaman', 'read']
  ),
  asyncHandler(async (req, res) => {
    const query = pegawaiQuerySchema.parse(req.query)
    const items = await listPegawai(query)
    sendSuccess(
      res,
      items,
      'Daftar Pegawai Negeri Sipil (PNS) berhasil dimuat.',
      200,
      { total: items.length }
    )
  })
)

pegawaiRouter.get(
  '/:id',
  requireAnyPermission(
    ['pegawai', 'read'],
    ['kendaraan', 'read'],
    ['peminjaman', 'read']
  ),
  asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id)
    const item = await getPegawaiById(id)
    sendSuccess(res, item, 'Detail PNS berhasil dimuat.')
  })
)

pegawaiRouter.post(
  '/',
  requirePermission('pegawai', 'create'),
  asyncHandler(async (req, res) => {
    const input = pegawaiInputSchema.parse(req.body)
    const created = await createPegawai(input)
    sendCreated(res, created, 'Data PNS berhasil ditambahkan.')
  })
)

pegawaiRouter.put(
  '/:id',
  requirePermission('pegawai', 'update'),
  asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id)
    const input = pegawaiInputSchema.parse(req.body)
    const updated = await updatePegawai(id, input)
    sendSuccess(res, updated, 'Data PNS berhasil diperbarui.')
  })
)

pegawaiRouter.delete(
  '/:id',
  requirePermission('pegawai', 'delete'),
  asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id)
    const deleted = await deletePegawai(id)
    sendSuccess(
      res,
      deleted,
      'Data PNS berhasil dihapus dan kendaraan terkait dikembalikan ke Pool Perangkat Daerah.'
    )
  })
)
