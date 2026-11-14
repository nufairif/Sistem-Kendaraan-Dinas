import type {
  JenisKendaraan,
  JenisRiwayat,
  JenisServis,
  KendaraanDinas,
  KondisiKendaraan,
  PagePermissionKey,
  PeminjamanKendaraan,
  RoleDefinition,
  RolePermissionMap,
  ServisKendaraan,
  StatusPeminjaman,
  StatusServis,
  UserRole,
} from '../types/bmd'

export const PAGE_PERMISSION_META: Array<{
  key: PagePermissionKey
  label: string
  description: string
  hasCrud: boolean
}> = [
  {
    key: 'dashboard',
    label: 'Dashboard Monitoring',
    description: 'Ringkasan aset, pengingat pajak, dan distribusi SKPD.',
    hasCrud: false,
  },
  {
    key: 'kendaraan',
    label: 'Kendaraan Dinas (KDO)',
    description: 'Inventaris kendaraan, lokasi parkir, foto, STNK & BPKB.',
    hasCrud: true,
  },
  {
    key: 'peminjaman',
    label: 'Monitoring & Peminjaman',
    description: 'Pantau ketersediaan armada dan catat peminjaman unit laik jalan.',
    hasCrud: true,
  },
  {
    key: 'servis',
    label: 'Servis & Pemeliharaan',
    description: 'Riwayat servis rutin, perbaikan bengkel, dan biaya.',
    hasCrud: true,
  },
  {
    key: 'pajakDokumen',
    label: 'Dokumen & Pajak',
    description: 'Pemantauan PKB tahunan, plat 5 tahunan, dan arsip STNK/BPKB.',
    hasCrud: false,
  },
  {
    key: 'pegawai',
    label: 'Pegawai (PNS)',
    description: 'Data pegawai penanggung jawab kendaraan dinas.',
    hasCrud: true,
  },
  {
    key: 'perangkatDaerah',
    label: 'Perangkat Daerah (SKPD)',
    description: 'Daftar dinas/badan pemilik aset kendaraan.',
    hasCrud: true,
  },
  {
    key: 'users',
    label: 'Manajemen User',
    description: 'Pengelolaan akun login pengguna sistem.',
    hasCrud: true,
  },
  {
    key: 'roles',
    label: 'Manajemen Role',
    description: 'Konfigurasi role dan izin CRUD per halaman.',
    hasCrud: true,
  },
]

export function makeDefaultPermissionMap(allTrue = false): RolePermissionMap {
  return {
    dashboard: { read: allTrue, create: false, update: false, delete: false },
    kendaraan: {
      read: allTrue,
      create: allTrue,
      update: allTrue,
      delete: allTrue,
    },
    peminjaman: {
      read: allTrue,
      create: allTrue,
      update: allTrue,
      delete: allTrue,
    },
    servis: { read: allTrue, create: allTrue, update: allTrue, delete: allTrue },
    pajakDokumen: {
      read: allTrue,
      create: false,
      update: false,
      delete: false,
    },
    pegawai: {
      read: allTrue,
      create: allTrue,
      update: allTrue,
      delete: allTrue,
    },
    perangkatDaerah: {
      read: allTrue,
      create: allTrue,
      update: allTrue,
      delete: allTrue,
    },
    users: { read: allTrue, create: allTrue, update: allTrue, delete: allTrue },
    roles: { read: allTrue, create: allTrue, update: allTrue, delete: allTrue },
  }
}

export const LOKASI_PARKIR_PRESETS: string[] = [
  'Pool Kendaraan Kantor Dinas',
  'Basement Gedung Utama SKPD',
  'Halaman Parkir Sektor / Gudang',
  'Dibawa PNS Penanggung Jawab',
  'Bengkel Rekanan (Dalam Perbaikan)',
]

export const JENIS_SERVIS_OPTIONS: Array<{
  value: JenisServis
  label: string
}> = [
  { value: 'SERVIS_RUTIN', label: 'Servis Rutin & Ganti Oli' },
  { value: 'PERBAIKAN', label: 'Perbaikan Mesin / AC / Bodi' },
  { value: 'GANTI_BAN_AKI', label: 'Penggantian Ban / Aki / Rem' },
  { value: 'UJI_KIR', label: 'Uji KIR & Emisi Gas Buang' },
  { value: 'LAINNYA', label: 'Pemeliharaan Lainnya' },
]

export const STATUS_SERVIS_OPTIONS: Array<{
  value: StatusServis
  label: string
}> = [
  { value: 'TERJADWAL', label: 'Terjadwal' },
  { value: 'DALAM_PERBAIKAN', label: 'Dalam Perbaikan' },
  { value: 'SELESAI', label: 'Selesai' },
]

export const STATUS_PEMINJAMAN_OPTIONS: Array<{
  value: StatusPeminjaman
  label: string
}> = [
  { value: 'DIPINJAM', label: 'Sedang Dipinjam' },
  { value: 'TERJADWAL', label: 'Terjadwal' },
  { value: 'SELESAI', label: 'Dikembalikan / Selesai' },
  { value: 'DIBATALKAN', label: 'Dibatalkan' },
]

export function getStatusPeminjamanLabel(status: StatusPeminjaman): string {
  switch (status) {
    case 'DIPINJAM':
      return 'Sedang Dipinjam'
    case 'TERJADWAL':
      return 'Terjadwal'
    case 'SELESAI':
      return 'Dikembalikan'
    case 'DIBATALKAN':
      return 'Dibatalkan'
  }
}

export interface VehicleBorrowEvaluation {
  eligible: boolean
  blockReasons: string[]
  inRepair: boolean
  taxOverdue: boolean
  activeLoan: PeminjamanKendaraan | null
  scheduledCount: number
}

/**
 * Evaluates whether a KDO meets safety and administrative requirements for borrowing:
 * must have condition BAIK, not currently in repair, and no overdue tax/plate.
 */
export function evaluateVehicleBorrowStatus(
  kendaraan: KendaraanDinas,
  servisList: ServisKendaraan[],
  peminjamanList: PeminjamanKendaraan[],
  ignorePeminjamanId?: number
): VehicleBorrowEvaluation {
  const blockReasons: string[] = []
  if (kendaraan.kondisi !== 'BAIK') {
    blockReasons.push(`Kondisi ${getKondisiLabel(kendaraan.kondisi)}`)
  }

  const inRepair = servisList.some(
    (s) => s.kendaraanId === kendaraan.id && s.status === 'DALAM_PERBAIKAN'
  )
  if (inRepair) {
    blockReasons.push('Sedang Dalam Perbaikan (Servis)')
  }

  const pkbOverdue = getTaxStatus(kendaraan.pajakTahunanJatuhTempo).status === 'OVERDUE'
  const platOverdue =
    getTaxStatus(kendaraan.pajakLimaTahunanJatuhTempo).status === 'OVERDUE'
  const taxOverdue = pkbOverdue || platOverdue
  if (taxOverdue) {
    blockReasons.push('Pajak / Plat Lewat Jatuh Tempo')
  }

  const activeLoan =
    peminjamanList.find(
      (p) =>
        p.id !== ignorePeminjamanId &&
        p.kendaraanId === kendaraan.id &&
        p.status === 'DIPINJAM'
    ) ?? null

  const scheduledCount = peminjamanList.filter(
    (p) =>
      p.id !== ignorePeminjamanId &&
      p.kendaraanId === kendaraan.id &&
      p.status === 'TERJADWAL'
  ).length

  return {
    eligible: blockReasons.length === 0,
    blockReasons,
    inRepair,
    taxOverdue,
    activeLoan,
    scheduledCount,
  }
}

export function getJenisServisLabel(jenis: JenisServis): string {
  switch (jenis) {
    case 'SERVIS_RUTIN':
      return 'Servis Rutin & Ganti Oli'
    case 'PERBAIKAN':
      return 'Perbaikan Mesin / AC / Bodi'
    case 'GANTI_BAN_AKI':
      return 'Penggantian Ban / Aki / Rem'
    case 'UJI_KIR':
      return 'Uji KIR & Emisi'
    case 'LAINNYA':
      return 'Pemeliharaan Lainnya'
  }
}

export function getStatusServisLabel(status: StatusServis): string {
  switch (status) {
    case 'TERJADWAL':
      return 'Terjadwal'
    case 'DALAM_PERBAIKAN':
      return 'Dalam Perbaikan'
    case 'SELESAI':
      return 'Selesai'
  }
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export const MEREK_KENDARAAN_LIST: string[] = [
  'Toyota',
  'Honda',
  'Mitsubishi',
  'Suzuki',
  'Daihatsu',
  'Isuzu',
  'Yamaha',
  'Kawasaki',
  'Hyundai',
  'Wuling',
  'Nissan',
  'Hino',
  'Mazda',
  'Mercedes-Benz',
]

export const USER_ROLE_OPTIONS: Array<{
  value: UserRole
  label: string
  description: string
}> = [
  {
    value: 'ADMIN_BPAD',
    label: 'Admin BPAD',
    description: 'Akses penuh ke seluruh SKPD, KDO, PNS, dan manajemen user.',
  },
  {
    value: 'OPERATOR_SKPD',
    label: 'Operator SKPD',
    description: 'Mengelola data KDO, PNS, dan Perangkat Daerah.',
  },
  {
    value: 'VIEWER',
    label: 'Pemantau / Auditor',
    description: 'Melihat data aset KDO dan riwayat tanpa mengubah data.',
  },
]

export function getUserRoleLabel(
  role: UserRole,
  roles?: RoleDefinition[]
): string {
  const matched = roles?.find((r) => r.code === role)
  if (matched) return matched.name
  switch (role) {
    case 'ADMIN_BPAD':
      return 'Admin BPAD'
    case 'OPERATOR_SKPD':
      return 'Operator SKPD'
    case 'VIEWER':
      return 'Pemantau / Auditor'
    default:
      return role.replace(/_/g, ' ')
  }
}

export const KONDISI_OPTIONS: Array<{
  value: KondisiKendaraan
  label: string
  shortLabel: string
  description: string
}> = [
  {
    value: 'BAIK',
    label: 'Baik',
    shortLabel: 'Baik',
    description: 'Laik jalan dan siap operasional penuh.',
  },
  {
    value: 'RUSAK_RINGAN',
    label: 'Rusak Ringan',
    shortLabel: 'Rusak Ringan',
    description: 'Memerlukan perawatan berkala atau perbaikan minor.',
  },
  {
    value: 'RUSAK_BERAT',
    label: 'Rusak Berat',
    shortLabel: 'Rusak Berat',
    description: 'Tidak laik operasional atau menunggu penghapusan BMD.',
  },
]

export const JENIS_KENDARAAN_OPTIONS: Array<{
  value: JenisKendaraan
  label: string
}> = [
  { value: 'RODA_4', label: 'Roda 4 (Mobil Dinas / MPV / SUV)' },
  { value: 'RODA_2', label: 'Roda 2 (Sepeda Motor Dinas)' },
  { value: 'KHUSUS', label: 'Operasional Khusus (Pick-up / Ambulans / Truk)' },
]

export const GOLONGAN_PNS_MAP: Array<{ golongan: string; pangkat: string }> = [
  { golongan: 'II/a', pangkat: 'Pengatur Muda' },
  { golongan: 'II/b', pangkat: 'Pengatur Muda Tingkat I' },
  { golongan: 'II/c', pangkat: 'Pengatur' },
  { golongan: 'II/d', pangkat: 'Pengatur Tingkat I' },
  { golongan: 'III/a', pangkat: 'Penata Muda' },
  { golongan: 'III/b', pangkat: 'Penata Muda Tingkat I' },
  { golongan: 'III/c', pangkat: 'Penata' },
  { golongan: 'III/d', pangkat: 'Penata Tingkat I' },
  { golongan: 'IV/a', pangkat: 'Pembina' },
  { golongan: 'IV/b', pangkat: 'Pembina Tingkat I' },
  { golongan: 'IV/c', pangkat: 'Pembina Utama Muda' },
  { golongan: 'IV/d', pangkat: 'Pembina Utama Madya' },
  { golongan: 'IV/e', pangkat: 'Pembina Utama' },
]

export function getKondisiLabel(kondisi: KondisiKendaraan): string {
  switch (kondisi) {
    case 'BAIK':
      return 'Baik'
    case 'RUSAK_RINGAN':
      return 'Rusak Ringan'
    case 'RUSAK_BERAT':
      return 'Rusak Berat'
  }
}

export function getJenisLabel(jenis: JenisKendaraan): string {
  switch (jenis) {
    case 'RODA_4':
      return 'Roda 4'
    case 'RODA_2':
      return 'Roda 2'
    case 'KHUSUS':
      return 'Operasional Khusus'
  }
}

export function getJenisRiwayatLabel(jenis: JenisRiwayat): string {
  switch (jenis) {
    case 'PENDAFTARAN':
      return 'Registrasi Awal BMD'
    case 'PENUGASAN':
      return 'Perubahan Penanggung Jawab'
    case 'KONDISI':
      return 'Pembaruan Kondisi Fisik'
    case 'MUTASI_SKPD':
      return 'Mutasi Perangkat Daerah'
  }
}

export function formatTanggalIndonesia(isoString: string): string {
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatTanggalPendek(dateStr: string | null): string {
  if (!dateStr) return '-'
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    if (!Number.isNaN(d.getTime())) {
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(d)
    }
  }
  return dateStr
}

export function getTaxStatus(dateStr: string | null): {
  status: 'NONE' | 'OVERDUE' | 'WARNING' | 'SAFE'
  daysRemaining: number | null
  label: string
} {
  if (!dateStr) {
    return { status: 'NONE', daysRemaining: null, label: 'Belum Diatur' }
  }
  const parts = dateStr.split('-')
  if (parts.length !== 3) {
    return { status: 'NONE', daysRemaining: null, label: 'Format Tidak Valid' }
  }

  const target = new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2])
  )
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffMs = target.getTime() - today.getTime()
  const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (daysRemaining < 0) {
    return {
      status: 'OVERDUE',
      daysRemaining,
      label: `Lewat ${Math.abs(daysRemaining)} hari`,
    }
  }
  if (daysRemaining === 0) {
    return {
      status: 'WARNING',
      daysRemaining: 0,
      label: 'Jatuh Tempo Hari Ini',
    }
  }
  if (daysRemaining < 30) {
    return {
      status: 'WARNING',
      daysRemaining,
      label: `Sisa ${daysRemaining} hari`,
    }
  }
  return {
    status: 'SAFE',
    daysRemaining,
    label: `Aktif (${daysRemaining} hari lagi)`,
  }
}

export function formatNip(nip: string): string {
  const clean = nip.replace(/\D/g, '')
  if (clean.length !== 18) {
    return nip
  }
  return `${clean.slice(0, 8)} ${clean.slice(8, 14)} ${clean.slice(14, 15)} ${clean.slice(15, 18)}`
}
