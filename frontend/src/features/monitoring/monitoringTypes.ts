import type {
  KendaraanDinas,
  KondisiKendaraan,
  Pegawai,
  PerangkatDaerah,
  StatusPeminjaman,
} from '../../types/bmd'
import { getTodayIsoDate } from '../../utils/format'
import type { VehicleBorrowEvaluation } from '../../utils/vehicleRules'

export interface PeminjamanFormState {
  kendaraanId: string
  peminjamPegawaiId: string
  peminjamNama: string
  peminjamInstansi: string
  tujuanKeperluan: string
  lokasiTujuan: string
  tanggalPinjam: string
  tanggalKembaliRencana: string
  status: StatusPeminjaman
  nomorSuratTugas: string
  kilometerAwal: string
  catatan: string
}

export interface ReturnFormState {
  tanggalKembaliAktual: string
  kilometerAkhir: string
  kondisiSaatKembali: KondisiKendaraan
  catatan: string
}

export type FleetFilter = 'ALL' | 'READY' | 'BORROWED' | 'BLOCKED'

export interface FleetStatusRow {
  kendaraan: KendaraanDinas
  pd: PerangkatDaerah | undefined
  holder: Pegawai | undefined
  eval: VehicleBorrowEvaluation
}

export function makeEmptyPeminjamanForm(
  defaultKendaraanId = ''
): PeminjamanFormState {
  const today = getTodayIsoDate()
  return {
    kendaraanId: defaultKendaraanId,
    peminjamPegawaiId: '',
    peminjamNama: '',
    peminjamInstansi: '',
    tujuanKeperluan: '',
    lokasiTujuan: '',
    tanggalPinjam: today,
    tanggalKembaliRencana: today,
    status: 'DIPINJAM',
    nomorSuratTugas: '',
    kilometerAwal: '',
    catatan: '',
  }
}

