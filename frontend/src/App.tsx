import { useCallback, useEffect, useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './features/auth/LoginPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { KendaraanPage } from './features/kendaraan/KendaraanPage'
import { MonitoringPage } from './features/monitoring/MonitoringPage'
import { PajakDokumenPage } from './features/pajak/PajakDokumenPage'
import { PegawaiPage } from './features/pegawai/PegawaiPage'
import { PerangkatDaerahPage } from './features/perangkat-daerah/PerangkatDaerahPage'
import { RolesPage } from './features/roles/RolesPage'
import { ServisPage } from './features/servis/ServisPage'
import { UsersPage } from './features/users/UsersPage'
import {
  AUTH_UNAUTHORIZED_EVENT,
  getCurrentSession,
  logoutUser,
  refreshCurrentSession,
} from './services/auth.service'
import type { AuthSession } from './types/bmd'

function ForbiddenPage({ pageLabel }: { pageLabel: string }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
      <ShieldAlert className="mx-auto h-10 w-10 text-amber-600" aria-hidden="true" />
      <h2 className="mt-3 text-lg font-bold text-slate-900">
        Akses {pageLabel} Dibatasi
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Role akun Anda tidak memiliki izin melihat halaman ini. Hubungi Administrator untuk menyesuaikan hak akses pada menu Role &amp; Hak Akses.
      </p>
    </div>
  )
}

export function App() {
  const [session, setSession] = useState<AuthSession | null>(() =>
    getCurrentSession()
  )
  const [selectedPdId, setSelectedPdId] = useState<number | null>(null)

  useEffect(() => {
    const onUnauthorized = () => {
      setSession(null)
      setSelectedPdId(null)
    }
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized)
    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized)
    }
  }, [])

  useEffect(() => {
    if (!session?.token) return
    let active = true
    refreshCurrentSession().then((updated) => {
      if (active && updated) {
        setSession(updated)
      }
    })
    return () => {
      active = false
    }
  }, [session?.token])

  const handleLoginSuccess = (newSession: AuthSession) => {
    setSession(newSession)
    setSelectedPdId(null)
  }

  const handleLogout = () => {
    logoutUser()
    setSession(null)
    setSelectedPdId(null)
  }

  const handlePermissionsChanged = useCallback(async () => {
    const updated = await refreshCurrentSession()
    if (updated) {
      setSession(updated)
    }
  }, [])

  const permissions = session ? session.permissions : null
  const roleLabel = session ? session.roleName || session.role : ''

  return (
    <BrowserRouter>
      {!session || !permissions ? (
        <Routes>
          <Route
            path="/login"
            element={<LoginPage onLoginSuccess={handleLoginSuccess} />}
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <AppLayout
          session={session}
          permissions={permissions}
          roleLabel={roleLabel}
          selectedPdId={selectedPdId}
          onChangeSelectedPdId={setSelectedPdId}
          onLogout={handleLogout}
        >
          <Routes>
            <Route
              path="/"
              element={
                permissions.dashboard.read ? (
                  <DashboardPage
                    selectedPdId={selectedPdId}
                    readOnly={!permissions.kendaraan.create}
                    permissions={permissions}
                  />
                ) : (
                  <ForbiddenPage pageLabel="Dashboard Monitoring" />
                )
              }
            />
            <Route
              path="/kendaraan"
              element={
                permissions.kendaraan.read ? (
                  <KendaraanPage
                    selectedPdId={selectedPdId}
                    permission={permissions.kendaraan}
                  />
                ) : (
                  <ForbiddenPage pageLabel="Kendaraan Dinas" />
                )
              }
            />
            <Route
              path="/monitoring"
              element={
                permissions.peminjaman.read ? (
                  <MonitoringPage
                    selectedPdId={selectedPdId}
                    permission={permissions.peminjaman}
                  />
                ) : (
                  <ForbiddenPage pageLabel="Monitoring & Peminjaman Kendaraan" />
                )
              }
            />
            <Route
              path="/servis"
              element={
                permissions.servis.read ? (
                  <ServisPage
                    selectedPdId={selectedPdId}
                    permission={permissions.servis}
                  />
                ) : (
                  <ForbiddenPage pageLabel="Servis & Pemeliharaan" />
                )
              }
            />
            <Route
              path="/pajak-dokumen"
              element={
                permissions.pajakDokumen.read ? (
                  <PajakDokumenPage selectedPdId={selectedPdId} />
                ) : (
                  <ForbiddenPage pageLabel="Dokumen & Pajak" />
                )
              }
            />
            <Route
              path="/pegawai"
              element={
                permissions.pegawai.read ? (
                  <PegawaiPage
                    selectedPdId={selectedPdId}
                    permission={permissions.pegawai}
                  />
                ) : (
                  <ForbiddenPage pageLabel="Pegawai (PNS)" />
                )
              }
            />
            <Route
              path="/perangkat-daerah"
              element={
                permissions.perangkatDaerah.read ? (
                  <PerangkatDaerahPage permission={permissions.perangkatDaerah} />
                ) : (
                  <ForbiddenPage pageLabel="Perangkat Daerah" />
                )
              }
            />
            <Route
              path="/users"
              element={
                permissions.users.read ? (
                  <UsersPage
                    session={session}
                    permission={permissions.users}
                    onPermissionsChanged={handlePermissionsChanged}
                  />
                ) : (
                  <ForbiddenPage pageLabel="Manajemen User" />
                )
              }
            />
            <Route
              path="/roles"
              element={
                permissions.roles.read ? (
                  <RolesPage
                    permission={permissions.roles}
                    onPermissionsChanged={handlePermissionsChanged}
                  />
                ) : (
                  <ForbiddenPage pageLabel="Role & Hak Akses" />
                )
              }
            />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      )}
    </BrowserRouter>
  )
}

export default App
