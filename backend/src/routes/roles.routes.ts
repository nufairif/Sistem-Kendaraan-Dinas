import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler'
import { sendCreated, sendSuccess } from '../lib/apiResponse'
import {
  authenticate,
  requireAnyPermission,
  requirePermission,
} from '../middleware/auth.middleware'
import { parseIdParam } from '../middleware/validate.middleware'
import { roleInputSchema, roleQuerySchema } from '../schemas/roles.schema'
import {
  createRole,
  deleteRole,
  getRoleById,
  listRoles,
  updateRole,
} from '../services/roles.service'

export const rolesRouter = Router()

rolesRouter.use(authenticate)

rolesRouter.get(
  '/',
  requireAnyPermission(['roles', 'read'], ['users', 'read']),
  asyncHandler(async (req, res) => {
    const { search } = roleQuerySchema.parse(req.query)
    const items = await listRoles(search)
    sendSuccess(res, items, 'Daftar role & hak akses berhasil dimuat.', 200, {
      total: items.length,
    })
  })
)

rolesRouter.get(
  '/:id',
  requireAnyPermission(['roles', 'read'], ['users', 'read']),
  asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id)
    const item = await getRoleById(id)
    sendSuccess(res, item, 'Detail role & hak akses berhasil dimuat.')
  })
)

rolesRouter.post(
  '/',
  requirePermission('roles', 'create'),
  asyncHandler(async (req, res) => {
    const input = roleInputSchema.parse(req.body)
    const created = await createRole(input)
    sendCreated(res, created, 'Role hak akses baru berhasil dibuat.')
  })
)

rolesRouter.put(
  '/:id',
  requirePermission('roles', 'update'),
  asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id)
    const input = roleInputSchema.parse(req.body)
    const updated = await updateRole(id, input)
    sendSuccess(res, updated, 'Konfigurasi role & hak akses berhasil diperbarui.')
  })
)

rolesRouter.delete(
  '/:id',
  requirePermission('roles', 'delete'),
  asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id)
    const deleted = await deleteRole(id)
    sendSuccess(res, deleted, 'Role hak akses berhasil dihapus.')
  })
)

