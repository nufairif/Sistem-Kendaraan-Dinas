import type { AuthSession } from '../types/bmd'

const SESSION_KEY = 'si_kdo_bmd_session_v1'
export const AUTH_UNAUTHORIZED_EVENT = 'sikdo:unauthorized'

export const API_BASE_URL = (
  (import.meta.env.VITE_API_URL as string | undefined) || '/api'
).replace(/\/+$/, '')

export interface ApiEnvelope<T> {
  success: boolean
  message?: string
  data?: T
  error?: {
    code?: string
    details?: Array<{ field?: string; message?: string }>
  }
}

function isValidSession(parsed: unknown): parsed is AuthSession {
  if (!parsed || typeof parsed !== 'object') return false
  const obj = parsed as Partial<AuthSession>
  return (
    typeof obj.token === 'string' &&
    obj.token.length > 0 &&
    typeof obj.userId === 'number' &&
    typeof obj.username === 'string' &&
    typeof obj.role === 'string' &&
    Boolean(obj.permissions && typeof obj.permissions === 'object')
  )
}

export function getCurrentSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isValidSession(parsed)) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function saveSession(session: AuthSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

function buildErrorMessage(
  status: number,
  payload: ApiEnvelope<unknown> | null
): string {
  const firstDetail = payload?.error?.details?.[0]?.message
  if (firstDetail) return firstDetail
  if (payload?.message) return payload.message
  if (status === 401) return 'Sesi login telah berakhir. Silakan masuk kembali.'
  if (status === 403) return 'Anda tidak memiliki izin untuk melakukan aksi ini.'
  if (status === 404) return 'Data yang diminta tidak ditemukan.'
  if (status === 413) {
    return 'Ukuran berkas atau data terlalu besar untuk dikirim ke server (maks. 15 MB).'
  }
  return `Terjadi kesalahan pada server (HTTP ${status}).`
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  { skipAuth = false }: { skipAuth?: boolean } = {}
): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (!skipAuth) {
    const session = getCurrentSession()
    if (session?.token) {
      headers.set('Authorization', `Bearer ${session.token}`)
    }
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    })
  } catch {
    throw new Error(
      'Tidak dapat terhubung ke server backend API. Pastikan backend berjalan di http://localhost:3001.'
    )
  }

  let parsed: ApiEnvelope<T> | null = null
  try {
    parsed = (await response.json()) as ApiEnvelope<T>
  } catch {
    parsed = null
  }

  if (!response.ok || !parsed?.success) {
    if (response.status === 401 && !skipAuth) {
      clearSession()
      window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT))
    }
    throw new Error(buildErrorMessage(response.status, parsed))
  }

  return parsed.data as T
}

export function normalizeOptionalDate(
  val: string | null | undefined
): string | null {
  if (!val) return null
  const trimmed = val.trim()
  return trimmed.length > 0 ? trimmed : null
}

