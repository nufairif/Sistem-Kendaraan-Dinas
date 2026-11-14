import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
  Car,
  CheckCircle2,
  Plus,
  Users,
  Wrench,
} from 'lucide-react'
import { ErrorState, LoadingState } from '../../components/common/StateViews'
import { useAsyncData } from '../../hooks/useAsyncData'
import { getDashboardSummary } from '../../services/dashboard.service'
import type { DashboardSummary, RolePermissionMap } from '../../types/bmd'
import { DashboardHistorySection } from './DashboardHistorySection'
import { DashboardSkpdSection } from './DashboardSkpdSection'

interface DashboardPageProps {
  selectedPdId: number | null
  readOnly?: boolean
  permissions?: RolePermissionMap
}

export function DashboardPage({
  selectedPdId,
  readOnly = false,
  permissions,
}: DashboardPageProps) {
  const canViewMonitoring = permissions?.peminjaman.read ?? true
  const canViewServis = permissions?.servis.read ?? true
  const canViewPajak = permissions?.pajakDokumen.read ?? true
  const canViewKendaraan = permissions?.kendaraan.read ?? true
  const canCreateKendaraan = permissions
    ? permissions.kendaraan.read && permissions.kendaraan.create
    : !readOnly
  const canViewPd = permissions?.perangkatDaerah.read ?? true
  const heroActionCount =
    Number(canViewMonitoring) +
    Number(canViewServis) +
    Number(canViewPajak) +
    Number(canCreateKendaraan)

  const {
    data: summary,
    loading,
    error,
    reload,
  } = useAsyncData<DashboardSummary | null>(
    () => getDashboardSummary(selectedPdId),
    null,
    'Gagal memuat ringkasan BMD.',
    [selectedPdId],
  )

  if (loading) {
    return (
      <LoadingState label="Memuat ringkasan aset Kendaraan Dinas Operasional..." />
    )
  }

  if (error || !summary) {
    return (
      <ErrorState
        message={error ?? 'Data ringkasan tidak tersedia.'}
        onRetry={reload}
      />
    )
  }

  const pctBaik =
    summary.totalKendaraan > 0
      ? Math.round((summary.totalBaik / summary.totalKendaraan) * 100)
      : 0

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-[#0f4f6a]/50 bg-gradient-to-br from-[#0a3649] via-[#0c4158] to-[#0f4f6a] p-6 text-white shadow-sm sm:px-7 sm:py-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between xl:gap-8">
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-300/30 bg-white/10 px-3 py-1 text-[11px] font-semibold text-sky-200">
              Platform Pengelolaan Barang Milik Daerah (BMD)
            </span>
            <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-white sm:text-[26px] sm:leading-tight">
              Monitoring Kendaraan Dinas Operasional
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-200/90">
              Pantau inventaris unit KDO Perangkat Daerah, kelayakan &amp; peminjaman aktif, riwayat servis, serta jatuh tempo pajak STNK/BPKB.
            </p>
          </div>

          {heroActionCount > 0 && (
            <div className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5 xl:w-[348px]">
              {canViewMonitoring && (
                <Link
                  to="/monitoring"
                  className={`inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/20 bg-white/10 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-white/20 ${
                    heroActionCount === 1 ? 'sm:col-span-2' : ''
                  }`}
                >
                  <CalendarCheck
                    className="h-3.5 w-3.5 shrink-0 text-sky-300"
                    aria-hidden="true"
                  />
                  <span>Monitoring</span>
                  <span className="rounded-full bg-[#38bdf8] px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none text-[#072633]">
                    {summary.totalSedangDipinjam}
                  </span>
                </Link>
              )}
              {canViewServis && (
                <Link
                  to="/servis"
                  className={`inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/20 bg-white/10 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-white/20 ${
                    heroActionCount === 1 ? 'sm:col-span-2' : ''
                  }`}
                >
                  <Wrench
                    className="h-3.5 w-3.5 shrink-0 text-sky-300"
                    aria-hidden="true"
                  />
                  <span>Servis</span>
                  <span className="rounded-full bg-white/20 px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none text-white">
                    {summary.totalServisAktif}
                  </span>
                </Link>
              )}
              {canViewPajak && (
                <Link
                  to="/pajak-dokumen"
                  className={`inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/20 bg-white/10 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-white/20 ${
                    heroActionCount === 1 ||
                    (heroActionCount === 3 && !canCreateKendaraan)
                      ? 'sm:col-span-2'
                      : ''
                  }`}
                >
                  <CalendarClock
                    className="h-3.5 w-3.5 shrink-0 text-sky-300"
                    aria-hidden="true"
                  />
                  <span>Pajak &amp; STNK</span>
                </Link>
              )}
              {canCreateKendaraan && (
                <Link
                  to="/kendaraan"
                  className={`inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#2563eb] px-3.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#1d4ed8] ${
                    heroActionCount === 1 || heroActionCount === 3
                      ? 'sm:col-span-2'
                      : ''
                  }`}
                >
                  <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Kelola Unit</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 4 Kartu Statistik Utama */}
      <section aria-label="Statistik utama kendaraan dinas">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Unit KDO
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-[#0a3649]">
                <Car className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold tabular-nums text-slate-900">
                {summary.totalKendaraan}
              </span>
              <span className="text-xs font-medium text-slate-500">Unit</span>
            </div>
            <p className="mt-2.5 text-xs text-slate-600">
              <strong className="text-slate-800">{summary.totalRoda4}</strong>{' '}
              Roda 4 ·{' '}
              <strong className="text-slate-800">{summary.totalRoda2}</strong>{' '}
              Roda 2 ·{' '}
              <strong className="text-slate-800">{summary.totalKhusus}</strong>{' '}
              Khusus
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Kondisi Operasional
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold tabular-nums text-emerald-700">
                {summary.totalBaik}
              </span>
              <span className="text-xs font-medium text-slate-500">
                Unit Baik ({pctBaik}%)
              </span>
            </div>
            <p className="mt-2.5 text-xs">
              <span className="font-semibold text-amber-700">
                {summary.totalRusakRingan} Rusak Ringan
              </span>
              <span className="mx-1.5 text-slate-300">·</span>
              <span className="font-semibold text-rose-700">
                {summary.totalRusakBerat} Rusak Berat
              </span>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Penanggung Jawab
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                <Users className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold tabular-nums text-slate-900">
                {summary.totalBerpenanggungJawab}
              </span>
              <span className="text-xs font-medium text-slate-500">
                Dipegang PNS
              </span>
            </div>
            <p className="mt-2.5 text-xs text-slate-600">
              {summary.totalPoolDinas} unit di Pool · {summary.totalPegawai}{' '}
              PNS terdaftar
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pengingat Pajak
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb]">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold tabular-nums text-[#2563eb]">
                {summary.pajakPerluPerhatian}
              </span>
              <span className="text-xs font-medium text-slate-500">
                Jatuh Tempo &lt; 30 Hari
              </span>
            </div>
            <p className="mt-2.5 text-xs text-slate-600">
              <Link
                to="/pajak-dokumen"
                className="font-semibold text-[#0a3649] underline-offset-4 hover:underline"
              >
                Lihat jadwal pajak &amp; STNK
              </Link>
            </p>
          </div>
        </div>
      </section>

      <DashboardSkpdSection
        summary={summary}
        canViewPd={canViewPd}
        canViewPajak={canViewPajak}
      />

      <DashboardHistorySection
        riwayat={summary.riwayatTerbaru}
        canViewKendaraan={canViewKendaraan}
      />
    </div>
  )
}

