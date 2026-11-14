export type KondisiKendaraan = 'BAIK' | 'RUSAK_RINGAN' | 'RUSAK_BERAT'

export type JenisKendaraan = 'RODA_4' | 'RODA_2' | 'KHUSUS'

export type JenisRiwayat = 'PENDAFTARAN' | 'PENUGASAN' | 'KONDISI' | 'MUTASI_SKPD'

export type JenisServis =
  | 'SERVIS_RUTIN'
  | 'PERBAIKAN'
  | 'GANTI_BAN_AKI'
  | 'UJI_KIR'
  | 'LAINNYA'

export type StatusServis = 'TERJADWAL' | 'DALAM_PERBAIKAN' | 'SELESAI'

export type StatusPeminjaman = 'DIPINJAM' | 'TERJADWAL' | 'SELESAI' | 'DIBATALKAN'

export type UserRole = string

export type PagePermissionKey =
  | 'dashboard'
  | 'kendaraan'
  | 'peminjaman'
  | 'servis'
  | 'pajakDokumen'
  | 'pegawai'
  | 'perangkatDaerah'
  | 'users'
  | 'roles'

export interface CrudPermission {
  read: boolean
  create: boolean
  update: boolean
  delete: boolean
}

export type RolePermissionMap = Record<PagePermissionKey, CrudPermission>

export interface RoleDefinition {
  id: number
  code: string
  name: string
  description: string
  isSystem: boolean
  permissions: RolePermissionMap
  userCount?: number
  createdAt: string
  updatedAt: string
}

export interface RoleInput {
  code: string
  name: string
  description: string
  permissions: RolePermissionMap
}

export interface VehiclePhoto {
  id: string
  name: string
  dataUrl: string
}

export interface VehicleDocument {
  fileName: string
  mimeType: string
  dataUrl: string
  uploadedAt: string
}

export interface AppUser {
  id: number
  username: string
  nama: string
  email: string
  role: UserRole
  perangkatDaerahId: number | null
  aktif: boolean
  createdAt: string
  updatedAt: string
}

export interface AppUserInput {
  username: string
  nama: string
  email: string
  password?: string
  role: UserRole
  perangkatDaerahId: number | null
  aktif: boolean
}

export interface AuthSession {
  token: string
  userId: number
  username: string
  nama: string
  email: string
  role: UserRole
  roleName: string
  permissions: RolePermissionMap
  perangkatDaerahId: number | null
  loggedInAt: string
}

export interface PerangkatDaerah {
  id: number
  kodeSkpd: string
  nama: string
  singkatan: string
  kepalaDinas: string
  alamat: string
  telepon: string
  createdAt: string
  updatedAt: string
}

export interface Pegawai {
  id: number
  nip: string
  nama: string
  jabatan: string
  golongan: string
  pangkat: string
  noHp: string
  email: string
  perangkatDaerahId: number
  createdAt: string
  updatedAt: string
}

export interface KendaraanDinas {
  id: number
  nomorPolisi: string
  kodeBarang: string
  merek: string
  tipeModel: string
  jenis: JenisKendaraan
  tahunProduksi: number
  warna: string
  nomorRangka: string
  nomorMesin: string
  kondisi: KondisiKendaraan
  lokasiParkir: string
  keterangan: string
  fotos: VehiclePhoto[]
  dokumenStnk: VehicleDocument | null
  dokumenBpkb: VehicleDocument | null
  pajakTahunanJatuhTempo: string | null
  pajakLimaTahunanJatuhTempo: string | null
  perangkatDaerahId: number
  pegawaiId: number | null
  createdAt: string
  updatedAt: string
}

export interface RiwayatKendaraan {
  id: number
  kendaraanId: number
  pegawaiId: number | null
  pegawaiNamaSnapshot: string | null
  perangkatDaerahId: number
  perangkatDaerahNamaSnapshot: string
  jenisPerubahan: JenisRiwayat
  kondisiSaatItu: KondisiKendaraan
  nomorBast: string
  catatan: string
  tanggal: string
}

export interface PerangkatDaerahInput {
  kodeSkpd: string
  nama: string
  singkatan: string
  kepalaDinas: string
  alamat: string
  telepon: string
}

export interface PegawaiInput {
  nip: string
  nama: string
  jabatan: string
  golongan: string
  pangkat: string
  noHp: string
  email: string
  perangkatDaerahId: number
}

export interface KendaraanInput {
  nomorPolisi: string
  kodeBarang: string
  merek: string
  tipeModel: string
  jenis: JenisKendaraan
  tahunProduksi: number
  warna: string
  nomorRangka: string
  nomorMesin: string
  kondisi: KondisiKendaraan
  lokasiParkir: string
  keterangan: string
  fotos: VehiclePhoto[]
  dokumenStnk: VehicleDocument | null
  dokumenBpkb: VehicleDocument | null
  pajakTahunanJatuhTempo: string | null
  pajakLimaTahunanJatuhTempo: string | null
  perangkatDaerahId: number
  pegawaiId: number | null
  nomorBast?: string
  catatanPerubahan?: string
}

export interface ServisKendaraan {
  id: number
  kendaraanId: number
  tanggalServis: string
  jenisServis: JenisServis
  status: StatusServis
  bengkel: string
  kilometer: number | null
  biaya: number
  servisBerikutnyaTanggal: string | null
  deskripsi: string
  buktiNota: VehicleDocument | null
  createdAt: string
  updatedAt: string
}

export type ServisInput = Omit<ServisKendaraan, 'id' | 'createdAt' | 'updatedAt'>

export interface PeminjamanKendaraan {
  id: number
  kendaraanId: number
  peminjamPegawaiId: number | null
  peminjamNama: string
  peminjamInstansi: string
  tujuanKeperluan: string
  lokasiTujuan: string
  tanggalPinjam: string
  tanggalKembaliRencana: string
  tanggalKembaliAktual: string | null
  status: StatusPeminjaman
  nomorSuratTugas: string
  kilometerAwal: number | null
  kilometerAkhir: number | null
  kondisiSaatKembali: KondisiKendaraan | null
  catatan: string
  createdAt: string
  updatedAt: string
}

export type PeminjamanInput = Omit<
  PeminjamanKendaraan,
  'id' | 'createdAt' | 'updatedAt'
>

export interface TaxReminderItem {
  kendaraanId: number
  nomorPolisi: string
  merekModel: string
  perangkatDaerahNama: string
  perangkatDaerahSingkatan: string
  jenisPajak: 'PKB_TAHUNAN' | 'PLAT_5_TAHUNAN'
  tanggalJatuhTempo: string
  daysRemaining: number
}

export interface DashboardSummary {
  totalKendaraan: number
  totalBaik: number
  totalRusakRingan: number
  totalRusakBerat: number
  totalBerpenanggungJawab: number
  totalPoolDinas: number
  totalPegawai: number
  totalPerangkatDaerah: number
  totalRoda4: number
  totalRoda2: number
  totalKhusus: number
  pajakPerluPerhatian: number
  totalServisAktif: number
  totalSedangDipinjam: number
  totalBiayaServis: number
  daftarPengingatPajak: TaxReminderItem[]
  perPerangkatDaerah: Array<{
    perangkatDaerah: PerangkatDaerah
    totalKendaraan: number
    baik: number
    rusakRingan: number
    rusakBerat: number
    totalPegawai: number
  }>
  riwayatTerbaru: Array<
    RiwayatKendaraan & {
      nomorPolisi: string
      merekModel: string
    }
  >
}
