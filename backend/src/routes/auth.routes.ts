import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { asyncHandler } from '../lib/asyncHandler'
import { sendSuccess } from '../lib/apiResponse'
import { authenticate } from '../middleware/auth.middleware'
import { loginSchema } from '../schemas/auth.schema'
import { getAuthProfile, loginWithCredentials } from '../services/auth.service'

export const authRouter = Router()

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.',
    error: { code: 'TOO_MANY_LOGIN_ATTEMPTS' },
  },
})

authRouter.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { identifier, password } = loginSchema.parse(req.body)
    const result = await loginWithCredentials(identifier, password)
    sendSuccess(res, result, 'Login berhasil.')
  })
)

authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const profile = await getAuthProfile(req.user!.userId)
    sendSuccess(res, profile, 'Profil sesi pengguna berhasil dimuat.')
  })
)

authRouter.post(
  '/logout',
  authenticate,
  asyncHandler(async (_req, res) => {
    sendSuccess(
      res,
      { loggedOut: true },
      'Logout berhasil. Hapus token Bearer di sisi klien.'
    )
  })
)
