import rateLimit from 'express-rate-limit'

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

const isProduction = process.env.NODE_ENV === 'production'
const defaultWindowMs = parsePositiveInt(
  process.env.RATE_LIMIT_WINDOW_MS,
  15 * 60 * 1000
)

export const apiLimiter = rateLimit({
  windowMs: defaultWindowMs,
  max: parsePositiveInt(
    process.env.RATE_LIMIT_MAX,
    isProduction ? 2000 : 10000
  ),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan. Coba lagi beberapa saat.',
    error: { code: 'RATE_LIMIT_EXCEEDED' },
  },
})

export const loginLimiter = rateLimit({
  windowMs: defaultWindowMs,
  max: parsePositiveInt(
    process.env.LOGIN_RATE_LIMIT_MAX,
    isProduction ? 50 : 200
  ),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.',
    error: { code: 'TOO_MANY_LOGIN_ATTEMPTS' },
  },
})

