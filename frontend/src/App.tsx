import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { KendaraanPage } from './pages/KendaraanPage'
import { LoginPage } from './pages/LoginPage'
import { MonitoringPage } from './pages/MonitoringPage'
import { PajakDokumenPage } from './pages/PajakDokumenPage'
import { PegawaiPage } from './pages/PegawaiPage'
import { PerangkatDaerahPage } from './pages/PerangkatDaerahPage'
import { RolesPage } from './pages/RolesPage'
import { ServisPage } from './pages/ServisPage'
import { UsersPage } from './pages/UsersPage'
import {
  getCurrentSession,
  getPermissionsForRole,
  getRoleNameByCode,
  logoutUser,
} from './services/bmdService'
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
  const [refreshKey, setRefreshKey] = useState(0)
  const [, setPermVersion] = useState(0)

  const handleLoginSuccess = (newSession: AuthSession) => {
    setSession(newSession)
    setSelectedPdId(null)
  }

  const handleLogout = () => {
    logoutUser()
    setSession(null)
    setSelectedPdId(null)
  }

  const handleDatabaseReset = () => {
    setSelectedPdId(null)
    setRefreshKey((k) => k + 1)
    setPermVersion((v) => v + 1)
  }

  const handlePermissionsChanged = () => {
    setPermVersion((v) => v + 1)
  }

  const permissions = session ? getPermissionsForRole(session.role) : null
  const roleLabel = session ? getRoleNameByCode(session.role) : ''

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
          onDatabaseReset={handleDatabaseReset}
        >
          <Routes key={refreshKey}>
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
