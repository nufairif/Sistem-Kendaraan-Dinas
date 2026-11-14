import jwt, { type SignOptions } from 'jsonwebtoken'

export type UserRole = string

export interface JwtUserPayload {
  userId: number
  username: string
  nama: string
  email: string
  role: UserRole
  perangkatDaerahId: number | null
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET wajib dikonfigurasi pada environment production.')
    }
    return 'si-kdo-bmd-dev-secret-change-in-production'
  }
  return secret
}

export function signAccessToken(payload: JwtUserPayload): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN || '12h') as SignOptions['expiresIn']
  return jwt.sign(payload, getJwtSecret(), { expiresIn })
}

export function verifyAccessToken(token: string): JwtUserPayload {
  return jwt.verify(token, getJwtSecret()) as JwtUserPayload
}
