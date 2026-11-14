import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler'
import { sendCreated, sendSuccess } from '../lib/apiResponse'
import { authenticate, requirePermission } from '../middleware/auth.middleware'
import { parseIdParam } from '../middleware/validate.middleware'
import {
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
} from '../schemas/user.schema'
import {
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  updateUser,
} from '../services/users.service'

export const usersRouter = Router()

usersRouter.use(authenticate)

usersRouter.get(
  '/',
  requirePermission('users', 'read'),
  asyncHandler(async (req, res) => {
    const query = userQuerySchema.parse(req.query)
    const items = await listUsers(query)
    sendSuccess(res, items, 'Daftar pengguna aplikasi berhasil dimuat.', 200, {
      total: items.length,
    })
  })
)

usersRouter.get(
  '/:id',
  requirePermission('users', 'read'),
  asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id)
    const user = await getUserById(id)
    sendSuccess(res, user, 'Detail pengguna berhasil dimuat.')
  })
)

usersRouter.post(
  '/',
  requirePermission('users', 'create'),
  asyncHandler(async (req, res) => {
    const input = createUserSchema.parse(req.body)
    const created = await createUser(input)
    sendCreated(res, created, 'Akun pengguna berhasil dibuat.')
  })
)

usersRouter.put(
  '/:id',
  requirePermission('users', 'update'),
  asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id)
    const input = updateUserSchema.parse(req.body)
    const updated = await updateUser(id, input)
    sendSuccess(res, updated, 'Data pengguna berhasil diperbarui.')
  })
)

usersRouter.delete(
  '/:id',
  requirePermission('users', 'delete'),
  asyncHandler(async (req, res) => {
    const id = parseIdParam(req.params.id)
    const deleted = await deleteUser(id, req.user?.userId)
    sendSuccess(res, deleted, 'Akun pengguna berhasil dihapus.')
  })
)
