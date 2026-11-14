import type {
  JenisKendaraan,
  JenisServis,
  KondisiKendaraan,
  PagePermissionKey,
  RolePermissionMap,
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

