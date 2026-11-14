import { makeDefaultPermissionMap } from '../constants/domainOptions'
import {
  API_BASE_URL,
  AUTH_UNAUTHORIZED_EVENT,
  apiRequest,
  clearSession,
  getCurrentSession,
  saveSession,
} from '../lib/apiClient'
import type { AuthSession, RolePermissionMap } from '../types/bmd'

export { AUTH_UNAUTHORIZED_EVENT, getCurrentSession }

interface LoginApiData {
  token: string
  tokenType: string
  user: {
    userId: number
    username: string
    nama: string
    email: string
    role: string
    roleName: string
    permissions: RolePermissionMap
    perangkatDaerahId: number | null
    loggedInAt: string
  }
}

interface AuthMeApiData {
  userId: number
  username: string
  nama: string
  email: string
  role: string
  roleName: string
  permissions: RolePermissionMap
  perangkatDaerahId: number | null
  aktif: boolean
}

export async function loginUser(
  identifier: string,
  password: string
): Promise<AuthSession> {
  const data = await apiRequest<LoginApiData>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({
        identifier: identifier.trim(),
        password,
      }),
    },
    { skipAuth: true }
  )

  const session: AuthSession = {
    token: data.token,
    userId: data.user.userId,
    username: data.user.username,
    nama: data.user.nama,
    email: data.user.email,
    role: data.user.role,
    roleName: data.user.roleName || data.user.role,
    permissions: data.user.permissions ?? makeDefaultPermissionMap(false),
    perangkatDaerahId: data.user.perangkatDaerahId,
    loggedInAt: data.user.loggedInAt,
  }

  saveSession(session)
  return session
}

export async function refreshCurrentSession(): Promise<AuthSession | null> {
  const existing = getCurrentSession()
  if (!existing) return null

  try {
    const profile = await apiRequest<AuthMeApiData>('/auth/me')
    if (!profile.aktif) {
      clearSession()
      window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT))
      return null
    }

    const updated: AuthSession = {
      ...existing,
      userId: profile.userId,
      username: profile.username,
      nama: profile.nama,
      email: profile.email,
      role: profile.role,
      roleName: profile.roleName || profile.role,
      permissions: profile.permissions,
      perangkatDaerahId: profile.perangkatDaerahId,
    }
    saveSession(updated)
    return updated
  } catch {
    return getCurrentSession()
  }
}

export function logoutUser(): void {
  const session = getCurrentSession()
  if (session?.token) {
    void fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.token}` },
    }).catch(() => {
      // Logout tetap dilanjutkan di sisi klien meski backend tidak merespons
    })
  }
  clearSession()
}

