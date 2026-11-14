import { MEREK_KENDARAAN_LIST } from '../../constants/domainOptions'
import type {
  JenisKendaraan,
  KendaraanDinas,
  KondisiKendaraan,
  Pegawai,
  PerangkatDaerah,
  VehicleDocument,
  VehiclePhoto,
} from '../../types/bmd'
import { getJenisLabel, getKondisiLabel } from '../../utils/format'

export interface KendaraanFormState {
  nomorPolisi: string
  kodeBarang: string
  merekPilihan: string
  merekLainnya: string
  tipeModel: string
  jenis: JenisKendaraan
  tahunProduksi: string
  warna: string
  nomorRangka: string
  nomorMesin: string
  kondisi: KondisiKendaraan
  lokasiParkir: string
  keterangan: string
  fotos: VehiclePhoto[]
  dokumenStnk: VehicleDocument | null
  dokumenBpkb: VehicleDocument | null
  pajakTahunanJatuhTempo: string
  pajakLimaTahunanJatuhTempo: string
  perangkatDaerahId: string
  pegawaiId: string
  nomorBast: string
  catatanPerubahan: string
}

export const MAX_TAHUN_PRODUKSI = new Date().getFullYear() + 1
export const MAX_VEHICLE_PHOTOS = 6

export function resolveMerekFields(merek: string): {
  merekPilihan: string
  merekLainnya: string
} {
  const matched = MEREK_KENDARAAN_LIST.find(
    (m) => m.toLowerCase() === merek.trim().toLowerCase()
  )
  if (matched) {
    return { merekPilihan: matched, merekLainnya: '' }
  }
  if (!merek.trim()) {
    return { merekPilihan: MEREK_KENDARAAN_LIST[0], merekLainnya: '' }
  }
  return { merekPilihan: 'LAINNYA', merekLainnya: merek }
}

export function makeEmptyKendaraanForm(
  defaultPdId: number | ''
): KendaraanFormState {
  return {
    nomorPolisi: '',
    kodeBarang: '',
    merekPilihan: MEREK_KENDARAAN_LIST[0],
    merekLainnya: '',
    tipeModel: '',
    jenis: 'RODA_4',
    tahunProduksi: String(new Date().getFullYear()),
    warna: '',
    nomorRangka: '',
    nomorMesin: '',
    kondisi: 'BAIK',
    lokasiParkir: '',
    keterangan: '',
    fotos: [],
    dokumenStnk: null,
    dokumenBpkb: null,
    pajakTahunanJatuhTempo: '',
    pajakLimaTahunanJatuhTempo: '',
    perangkatDaerahId: defaultPdId === '' ? '' : String(defaultPdId),
    pegawaiId: '',
    nomorBast: '',
    catatanPerubahan: '',
  }
}

export function kendaraanToFormState(item: KendaraanDinas): KendaraanFormState {
  const merekFields = resolveMerekFields(item.merek)
  return {
    nomorPolisi: item.nomorPolisi,
    kodeBarang: item.kodeBarang,
    merekPilihan: merekFields.merekPilihan,
    merekLainnya: merekFields.merekLainnya,
    tipeModel: item.tipeModel,
    jenis: item.jenis,
    tahunProduksi: String(item.tahunProduksi),
    warna: item.warna,
    nomorRangka: item.nomorRangka,
    nomorMesin: item.nomorMesin,
    kondisi: item.kondisi,
    lokasiParkir: item.lokasiParkir ?? '',
    keterangan: item.keterangan,
    fotos: item.fotos ?? [],
    dokumenStnk: item.dokumenStnk ?? null,
    dokumenBpkb: item.dokumenBpkb ?? null,
    pajakTahunanJatuhTempo: item.pajakTahunanJatuhTempo ?? '',
    pajakLimaTahunanJatuhTempo: item.pajakLimaTahunanJatuhTempo ?? '',
    perangkatDaerahId: String(item.perangkatDaerahId),
    pegawaiId: item.pegawaiId ? String(item.pegawaiId) : '',
    nomorBast: '',
    catatanPerubahan: '',
  }
}

export function exportKendaraanCsv(
  list: KendaraanDinas[],
  pdMap: Map<number, PerangkatDaerah>,
  pegawaiMap: Map<number, Pegawai>
): void {
  const headers = [
    'Nomor Polisi',
    'Kode Barang',
    'Merek',
    'Tipe/Model',
    'Jenis',
    'Tahun Produksi',
    'Warna',
    'Kondisi',
    'Pajak Tahunan (PKB)',
    'Pajak & Plat 5 Tahunan',
    'Perangkat Daerah',
    'Penanggung Jawab (PNS)',
    'NIP Penanggung Jawab',
    'Keterangan',
  ]

  const escapeCsv = (val: string | number) => {
    const str = String(val).replace(/"/g, '""')
    return `"${str}"`
  }

  const rows = list.map((item) => {
    const pd = pdMap.get(item.perangkatDaerahId)
    const pj = item.pegawaiId ? pegawaiMap.get(item.pegawaiId) : undefined
    return [
      item.nomorPolisi,
      item.kodeBarang || '-',
      item.merek,
      item.tipeModel,
      getJenisLabel(item.jenis),
      item.tahunProduksi,
      item.warna,
      getKondisiLabel(item.kondisi),
      item.pajakTahunanJatuhTempo ?? '-',
      item.pajakLimaTahunanJatuhTempo ?? '-',
      pd?.nama ?? '-',
      pj?.nama ?? 'Pool Perangkat Daerah',
      pj?.nip ?? '-',
      item.keterangan || '-',
    ]
      .map(escapeCsv)
      .join(',')
  })

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `inventaris-kdo-bmd-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

