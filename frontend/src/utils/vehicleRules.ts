import type {
  KendaraanDinas,
  PeminjamanKendaraan,
  ServisKendaraan,
} from '../types/bmd'
import { getKondisiLabel } from './format'

export interface TaxStatusResult {
  status: 'NONE' | 'OVERDUE' | 'WARNING' | 'SAFE'
  daysRemaining: number | null
  label: string
}

export function getTaxStatus(dateStr: string | null): TaxStatusResult {
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

  const pkbOverdue =
    getTaxStatus(kendaraan.pajakTahunanJatuhTempo).status === 'OVERDUE'
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

