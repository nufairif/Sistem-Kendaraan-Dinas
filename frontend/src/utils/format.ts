import type {
  JenisKendaraan,
  JenisRiwayat,
  JenisServis,
  KondisiKendaraan,
  RoleDefinition,
  StatusPeminjaman,
  StatusServis,
  UserRole,
} from '../types/bmd'

export function getTodayIsoDate(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

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

export function formatNip(nip: string): string {
  const clean = nip.replace(/\D/g, '')
  if (clean.length !== 18) {
    return nip
  }
  return `${clean.slice(0, 8)} ${clean.slice(8, 14)} ${clean.slice(14, 15)} ${clean.slice(15, 18)}`
}

// Re-export domain options & vehicle rules for concise imports where still migrating
export * from '../constants/domainOptions'
export * from './vehicleRules'
