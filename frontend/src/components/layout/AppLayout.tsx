import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Building2,
  CalendarCheck,
  Car,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  UserCog,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { getDashboardSummary } from '../../services/dashboard.service'
import { listPerangkatDaerah } from '../../services/master.service'
import type {
  AuthSession,
  PerangkatDaerah,
  RolePermissionMap,
} from '../../types/bmd'
import { CustomSelect } from '../common/CustomSelect'

interface AppLayoutProps {
  session: AuthSession
  permissions: RolePermissionMap
  roleLabel: string
  selectedPdId: number | null
  onChangeSelectedPdId: (pdId: number | null) => void
  onLogout: () => void
  children: ReactNode
}

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard Monitoring BMD',
  '/kendaraan': 'Inventaris Kendaraan Dinas Operasional',
  '/monitoring': 'Monitoring & Peminjaman Kendaraan',
  '/servis': 'Servis & Pemeliharaan Kendaraan',
  '/pajak-dokumen': 'Dokumen STNK, BPKB & Pengingat Pajak',
  '/pegawai': 'Pegawai Negeri Sipil (Penanggung Jawab)',
  '/perangkat-daerah': 'Master Perangkat Daerah (SKPD)',
  '/users': 'Manajemen Akun Pengguna',
  '/roles': 'Manajemen Role & Hak Akses',
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function AppLayout({
  session,
  permissions,
  roleLabel,
  selectedPdId,
  onChangeSelectedPdId,
  onLogout,
  children,
}: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pdList, setPdList] = useState<PerangkatDaerah[]>([])
  const [taxWarningCount, setTaxWarningCount] = useState(0)
  const [servisAktifCount, setServisAktifCount] = useState(0)
  const [sedangDipinjamCount, setSedangDipinjamCount] = useState(0)
  const location = useLocation()

  const canReadPdList =
    permissions.perangkatDaerah.read ||
    permissions.dashboard.read ||
    permissions.kendaraan.read ||
    permissions.pajakDokumen.read ||
    permissions.servis.read ||
    permissions.peminjaman.read ||
    permissions.pegawai.read ||
    permissions.users.read

  useEffect(() => {
    let active = true
    Promise.all([
      canReadPdList ? listPerangkatDaerah() : Promise.resolve([]),
      permissions.dashboard.read
        ? getDashboardSummary(selectedPdId)
        : Promise.resolve(null),
    ])
      .then(([pds, summary]) => {
        if (active) {
          setPdList(pds)
          if (summary) {
            setTaxWarningCount(summary.pajakPerluPerhatian)
            setServisAktifCount(summary.totalServisAktif)
            setSedangDipinjamCount(summary.totalSedangDipinjam)
          }
        }
      })
      .catch(() => {
        // Abaikan error minor pada badge sidebar
      })
    return () => {
      active = false
    }
  }, [canReadPdList, permissions.dashboard.read, selectedPdId, location.pathname])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mobileMenuOpen])

  const activePd = selectedPdId
    ? pdList.find((p) => p.id === selectedPdId)
    : undefined

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-[42px] items-center justify-between gap-2 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors ${
      isActive
        ? 'bg-[#2563eb] font-semibold text-white shadow-sm'
        : 'text-slate-200 hover:bg-white/10 hover:text-white'
    }`

  const SidebarContent = (
    <div className="flex h-full flex-col bg-[#0a3649] text-white">
      {/* Pinned Top Sidebar (Logo, Brand, & Filter SKPD) */}
      <div className="sticky top-0 z-10 shrink-0 bg-[#0a3649]">
        {/* Brand Header */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-extrabold tracking-tight text-[#0a3649] shadow-sm">
            BMD
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight text-white">
              SI-KDO DAERAH
            </p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-sky-300">
              Monitoring Aset Kendaraan
            </p>
          </div>
        </div>

        {/* Filter Perangkat Daerah */}
        <div className="border-b border-white/10 px-4 py-3.5">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label
              htmlFor="sidebar-skpd-filter"
              className="text-[10px] font-bold uppercase tracking-wider text-slate-300"
            >
              Filter Perangkat Daerah
            </label>
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-slate-200">
              {selectedPdId ? activePd?.singkatan ?? 'Terpilih' : 'Semua'}
            </span>
          </div>
          <CustomSelect
            id="sidebar-skpd-filter"
            variant="dark"
            size="sm"
            value={selectedPdId ? String(selectedPdId) : ''}
            onChange={(val) =>
              onChangeSelectedPdId(val ? Number(val) : null)
            }
            searchPlaceholder="Cari nama atau singkatan SKPD..."
            options={[
              { value: '', label: '-- Semua Perangkat Daerah --' },
              ...pdList.map((pd) => ({
                value: String(pd.id),
                label: `${pd.singkatan} - ${pd.nama}`,
              })),
            ]}
          />
        </div>
      </div>

      {/* Scrollable Navigation Links */}
      <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto">
        {/* Navigation Links */}
        <nav aria-label="Navigasi Utama" className="space-y-5 px-3 py-4">
          {permissions.dashboard.read && (
            <div>
              <NavLink
                to="/"
                end
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkClass}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate whitespace-nowrap">Dashboard</span>
                </span>
              </NavLink>
            </div>
          )}

          {(permissions.kendaraan.read ||
            permissions.servis.read ||
            permissions.pajakDokumen.read) && (
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Aset &amp; Inventaris
              </p>
              {permissions.kendaraan.read && (
                <NavLink
                  to="/kendaraan"
                  onClick={() => setMobileMenuOpen(false)}
                  className={navLinkClass}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Car className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate whitespace-nowrap">Kendaraan Dinas</span>
                  </span>
                </NavLink>
              )}

              {permissions.peminjaman.read && (
                <NavLink
                  to="/monitoring"
                  onClick={() => setMobileMenuOpen(false)}
                  className={navLinkClass}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <CalendarCheck
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="truncate whitespace-nowrap">
                      Monitoring &amp; Pinjam
                    </span>
                  </span>
                  {sedangDipinjamCount > 0 && (
                    <span className="inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[#38bdf8] px-1.5 font-mono text-[10px] font-bold text-[#072633]">
                      {sedangDipinjamCount}
                    </span>
                  )}
                </NavLink>
              )}

              {permissions.servis.read && (
                <NavLink
                  to="/servis"
                  onClick={() => setMobileMenuOpen(false)}
                  className={navLinkClass}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Wrench className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate whitespace-nowrap">
                      Servis &amp; Pemeliharaan
                    </span>
                  </span>
                  {servisAktifCount > 0 && (
                    <span className="inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-white/15 px-1.5 font-mono text-[11px] font-bold text-white">
                      {servisAktifCount}
                    </span>
                  )}
                </NavLink>
              )}

              {permissions.pajakDokumen.read && (
                <NavLink
                  to="/pajak-dokumen"
                  onClick={() => setMobileMenuOpen(false)}
                  className={navLinkClass}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate whitespace-nowrap">Dokumen &amp; Pajak</span>
                  </span>
                  {taxWarningCount > 0 && (
                    <span className="inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-amber-400 px-1.5 font-mono text-[11px] font-bold text-[#0a3649]">
                      {taxWarningCount}
                    </span>
                  )}
                </NavLink>
              )}
            </div>
          )}

          {(permissions.pegawai.read || permissions.perangkatDaerah.read) && (
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Master Data
              </p>
              {permissions.pegawai.read && (
                <NavLink
                  to="/pegawai"
                  onClick={() => setMobileMenuOpen(false)}
                  className={navLinkClass}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate whitespace-nowrap">Pegawai (PNS)</span>
                  </span>
                </NavLink>
              )}

              {permissions.perangkatDaerah.read && (
                <NavLink
                  to="/perangkat-daerah"
                  onClick={() => setMobileMenuOpen(false)}
                  className={navLinkClass}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate whitespace-nowrap">Perangkat Daerah</span>
                  </span>
                  {pdList.length > 0 && (
                    <span className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-white">
                      {pdList.length}
                    </span>
                  )}
                </NavLink>
              )}
            </div>
          )}

          {(permissions.users.read || permissions.roles.read) && (
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pengaturan Sistem
              </p>
              {permissions.users.read && (
                <NavLink
                  to="/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className={navLinkClass}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <UserCog className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate whitespace-nowrap">Manajemen User</span>
                  </span>
                </NavLink>
              )}
              {permissions.roles.read && (
                <NavLink
                  to="/roles"
                  onClick={() => setMobileMenuOpen(false)}
                  className={navLinkClass}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Shield className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate whitespace-nowrap">Role &amp; Hak Akses</span>
                  </span>
                </NavLink>
              )}
            </div>
          )}
        </nav>
      </div>

      {/* User Card Footer */}
      <div className="shrink-0 border-t border-white/10 bg-[#082c3b] p-3.5">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-xs font-bold text-white">
              {getInitials(session.nama)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-white">
                {session.nama}
              </p>
              <p className="truncate text-[11px] text-slate-300">
                {session.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            aria-label="Keluar dari aplikasi"
            title="Keluar (Logout)"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 transition-colors hover:bg-white/15 hover:text-white"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )

  const currentTitle = PAGE_TITLES[location.pathname] ?? 'SI-KDO Daerah'

  return (
    <div className="min-h-screen bg-[#f3f6f9] text-slate-900 lg:flex">
      {/* Sidebar Desktop */}
      <aside className="hidden w-[264px] shrink-0 lg:block lg:sticky lg:top-0 lg:h-screen">
        {SidebarContent}
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top White Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200/80 bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={
                mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'
              }
              aria-expanded={mobileMenuOpen}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 lg:hidden"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>

            <h2 className="truncate text-base font-bold text-slate-900 sm:text-lg">
              {currentTitle}
            </h2>

            <span className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 sm:inline-flex">
              <Building2 className="h-3.5 w-3.5 text-[#0a3649]" aria-hidden="true" />
              {activePd ? `${activePd.singkatan} (${activePd.nama})` : 'Semua Perangkat Daerah'}
            </span>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900">
                {roleLabel}
              </p>
              <p className="font-mono text-[11px] text-slate-500">
                @{session.username}
              </p>
            </div>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 flex lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi mobile"
          >
            <div
              className="fixed inset-0 bg-slate-950/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative z-10 h-full w-72 max-w-[85vw] shadow-xl">
              {SidebarContent}
            </div>
          </div>
        )}

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
