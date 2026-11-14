import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  Car,
  CheckCircle2,
  Clock,
  Plus,
  Users,
  Wrench,
} from 'lucide-react'
import { KondisiBadge } from '../components/common/KondisiBadge'
import { EmptyState, ErrorState, LoadingState } from '../components/common/StateViews'
import { getDashboardSummary } from '../services/bmdService'
import type { DashboardSummary, RolePermissionMap } from '../types/bmd'
import {
  formatTanggalIndonesia,
  formatTanggalPendek,
  getJenisRiwayatLabel,
} from '../utils/format'

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
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSummary = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getDashboardSummary(selectedPdId)
      setSummary(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal memuat ringkasan BMD.'
      )
    } finally {
      setLoading(false)
    }
  }, [selectedPdId])

  useEffect(() => {
    let active = true
    getDashboardSummary(selectedPdId)
      .then((data) => {
        if (active) {
          setSummary(data)
          setError(null)
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Gagal memuat ringkasan BMD.'
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [selectedPdId])

  if (loading) {
    return (
      <LoadingState label="Memuat ringkasan aset Kendaraan Dinas Operasional..." />
    )
  }

  if (error || !summary) {
    return (
      <ErrorState
        message={error ?? 'Data ringkasan tidak tersedia.'}
        onRetry={loadSummary}
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
              <strong className="text-slate-800">{summary.totalRoda4}</strong> Roda 4 ·{' '}
              <strong className="text-slate-800">{summary.totalRoda2}</strong> Roda 2 ·{' '}
              <strong className="text-slate-800">{summary.totalKhusus}</strong> Khusus
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
              {summary.totalPoolDinas} unit di Pool · {summary.totalPegawai} PNS terdaftar
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

      {/* Panel Tengah: Distribusi per SKPD & Pengingat Pajak */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Kiri (7 kolom): Rekapitulasi Perangkat Daerah */}
        <section className="xl:col-span-7 rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Distribusi KDO per Perangkat Daerah
              </h2>
              <p className="text-xs text-slate-500">
                Sebaran kondisi fisik kendaraan dan jumlah PNS pengampu pada tiap SKPD.
              </p>
            </div>
            {canViewPd && (
              <Link
                to="/perangkat-daerah"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563eb] hover:underline"
              >
                Detail SKPD
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            )}
          </div>

          {summary.perPerangkatDaerah.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="Belum ada Perangkat Daerah"
                description="Tambahkan perangkat daerah agar distribusi aset kendaraan dapat ditampilkan."
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {summary.perPerangkatDaerah.map((row) => {
                const maxBar = Math.max(
                  ...summary.perPerangkatDaerah.map((r) => r.totalKendaraan),
                  1
                )
                const barWidth = Math.round(
                  (row.totalKendaraan / maxBar) * 100
                )
                return (
                  <div key={row.perangkatDaerah.id} className="px-6 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-sm text-slate-900">
                          {row.perangkatDaerah.nama}
                        </span>
                        <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                          {row.perangkatDaerah.singkatan}
                        </span>
                      </div>
                      <span className="font-mono text-sm font-bold text-[#0a3649]">
                        {row.totalKendaraan} Unit
                      </span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#0a3649] transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                      <span>{row.totalPegawai} PNS terdaftar</span>
                      <div className="flex flex-wrap gap-3 font-medium">
                        <span className="text-emerald-700">
                          Baik: {row.baik}
                        </span>
                        <span className="text-amber-700">
                          Rusak Ringan: {row.rusakRingan}
                        </span>
                        <span className="text-rose-700">
                          Rusak Berat: {row.rusakBerat}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Kanan (5 kolom): Pengingat Pajak Samsat */}
        <section className="xl:col-span-5 rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Peringatan Pajak &amp; Plat (&lt; 30 Hari)
              </h2>
              <p className="text-xs text-slate-500">
                Otomatis dari jadwal PKB tahunan &amp; plat 5 tahunan.
              </p>
            </div>
            {canViewPajak && (
              <Link
                to="/pajak-dokumen"
                className="text-xs font-semibold text-[#2563eb] hover:underline"
              >
                Semua Pajak
              </Link>
            )}
          </div>

          <div className="p-5">
            {summary.daftarPengingatPajak.length === 0 ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-900">
                <p className="font-semibold">Seluruh jadwal pajak aman</p>
                <p className="mt-1 text-xs text-emerald-800">
                  Tidak ada kendaraan dengan masa berlaku pajak kurang dari 30 hari atau lewat jatuh tempo.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {summary.daftarPengingatPajak.slice(0, 5).map((item, idx) => {
                  const isOverdue = item.daysRemaining < 0
                  return (
                    <li
                      key={`${item.kendaraanId}-${item.jenisPajak}-${idx}`}
                      className={`rounded-xl border p-3.5 ${
                        isOverdue
                          ? 'border-rose-200 bg-rose-50/60'
                          : 'border-amber-200 bg-amber-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-[#0a3649]">
                          {item.nomorPolisi}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            isOverdue
                              ? 'bg-rose-700 text-white'
                              : 'bg-amber-600 text-white'
                          }`}
                        >
                          {isOverdue
                            ? `Lewat ${Math.abs(item.daysRemaining)} hari`
                            : item.daysRemaining === 0
                              ? 'Hari Ini'
                              : `Sisa ${item.daysRemaining} hari`}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-slate-900">
                        {item.merekModel} ({item.perangkatDaerahSingkatan})
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {item.jenisPajak === 'PKB_TAHUNAN'
                          ? 'Pajak Tahunan (PKB)'
                          : 'Pajak & Plat 5 Tahunan'}{' '}
                        · Jatuh tempo {formatTanggalPendek(item.tanggalJatuhTempo)}
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Log Riwayat Perubahan Terbaru */}
      <section className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#2563eb]" aria-hidden="true" />
            <h2 className="text-base font-bold text-slate-900">
              Riwayat Perubahan &amp; Serah Terima Terbaru
            </h2>
          </div>
          {canViewKendaraan && (
            <Link
              to="/kendaraan"
              className="text-xs font-semibold text-[#0a3649] hover:underline"
            >
              Buka Daftar KDO
            </Link>
          )}
        </div>

        {summary.riwayatTerbaru.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            Belum ada catatan riwayat pada lingkup Perangkat Daerah ini.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {summary.riwayatTerbaru.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#0a3649]">
                      {item.nomorPolisi}
                    </span>
                    <span className="text-xs font-semibold text-slate-800">
                      {getJenisRiwayatLabel(item.jenisPerubahan)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600">{item.catatan}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <KondisiBadge kondisi={item.kondisiSaatItu} />
                  <span className="text-xs text-slate-500">
                    {formatTanggalIndonesia(item.tanggal)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
