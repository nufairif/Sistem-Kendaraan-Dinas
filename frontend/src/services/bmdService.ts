import { INITIAL_SEED_DATA, type BmdDatabase } from '../data/seedData'
import type {
  AppUser,
  AppUserInput,
  AuthSession,
  DashboardSummary,
  KendaraanDinas,
  KendaraanInput,
  KondisiKendaraan,
  Pegawai,
  PegawaiInput,
  PeminjamanInput,
  PeminjamanKendaraan,
  PerangkatDaerah,
  PerangkatDaerahInput,
  RiwayatKendaraan,
  RoleDefinition,
  RoleInput,
  RolePermissionMap,
  ServisInput,
  ServisKendaraan,
  TaxReminderItem,
  VehiclePhoto,
} from '../types/bmd'
import {
  evaluateVehicleBorrowStatus,
  getTaxStatus,
  makeDefaultPermissionMap,
} from '../utils/format'

const STORAGE_KEY = 'si_kdo_bmd_db_v1'
const SESSION_KEY = 'si_kdo_bmd_session_v1'

function cloneSeed(): BmdDatabase {
  return JSON.parse(JSON.stringify(INITIAL_SEED_DATA)) as BmdDatabase
}

type LegacyKendaraan = KendaraanDinas & { fotoDataUrl?: string | null }

function readDb(): BmdDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const initial = cloneSeed()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
      return initial
    }
    const parsed = JSON.parse(raw) as Partial<BmdDatabase>
    if (
      !Array.isArray(parsed.perangkatDaerah) ||
      !Array.isArray(parsed.pegawai) ||
      !Array.isArray(parsed.kendaraan) ||
      !Array.isArray(parsed.riwayat) ||
      !parsed.nextIds
    ) {
      const initial = cloneSeed()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
      return initial
    }

    // Migrasi data lama agar kompatibel dengan field lokasiParkir, fotos[], dokumenStnk/Bpkb, pajak, servis, roles, dan users
    let migrated = false
    const seed = cloneSeed()
    const users = Array.isArray(parsed.users) ? parsed.users : seed.users
    if (!Array.isArray(parsed.users)) migrated = true

    const servis = Array.isArray(parsed.servis) ? parsed.servis : seed.servis
    if (!Array.isArray(parsed.servis)) migrated = true

    const peminjaman = Array.isArray(parsed.peminjaman)
      ? parsed.peminjaman
      : seed.peminjaman
    if (!Array.isArray(parsed.peminjaman)) migrated = true

    const roles: RoleDefinition[] = Array.isArray(parsed.roles)
      ? parsed.roles.map((r) => {
          const defaultPerms = makeDefaultPermissionMap(false)
          const existingPerms = r.permissions ?? {}
          if (!existingPerms.peminjaman) {
            migrated = true
          }
          const fallbackPeminjaman =
            r.code === 'VIEWER'
              ? { read: true, create: false, update: false, delete: false }
              : {
                  read: existingPerms.kendaraan?.read ?? false,
                  create: existingPerms.kendaraan?.create ?? false,
                  update: existingPerms.kendaraan?.update ?? false,
                  delete: existingPerms.kendaraan?.delete ?? false,
                }
          return {
            ...r,
            permissions: {
              ...defaultPerms,
              ...existingPerms,
              peminjaman: existingPerms.peminjaman ?? fallbackPeminjaman,
            },
          }
        })
      : seed.roles
    if (!Array.isArray(parsed.roles)) migrated = true

    const nextIds = {
      perangkatDaerah: parsed.nextIds.perangkatDaerah ?? seed.nextIds.perangkatDaerah,
      pegawai: parsed.nextIds.pegawai ?? seed.nextIds.pegawai,
      kendaraan: parsed.nextIds.kendaraan ?? seed.nextIds.kendaraan,
      riwayat: parsed.nextIds.riwayat ?? seed.nextIds.riwayat,
      servis: parsed.nextIds.servis ?? seed.nextIds.servis,
      peminjaman: parsed.nextIds.peminjaman ?? seed.nextIds.peminjaman,
      roles: parsed.nextIds.roles ?? seed.nextIds.roles,
      users: parsed.nextIds.users ?? seed.nextIds.users,
    }
    if (
      parsed.nextIds.users === undefined ||
      parsed.nextIds.servis === undefined ||
      parsed.nextIds.peminjaman === undefined ||
      parsed.nextIds.roles === undefined
    ) {
      migrated = true
    }

    const kendaraan: KendaraanDinas[] = parsed.kendaraan.map((rawItem) => {
      const item = rawItem as LegacyKendaraan
      let itemChanged = false
      let fotos: VehiclePhoto[] = Array.isArray(item.fotos) ? item.fotos : []

      if (!Array.isArray(item.fotos)) {
        itemChanged = true
        if (item.fotoDataUrl) {
          fotos = [
            {
              id: `migrated-${item.id}`,
              name: `${item.nomorPolisi}.jpg`,
              dataUrl: item.fotoDataUrl,
            },
          ]
        }
      }

      if (
        item.lokasiParkir === undefined ||
        item.dokumenStnk === undefined ||
        item.dokumenBpkb === undefined ||
        item.pajakTahunanJatuhTempo === undefined ||
        item.pajakLimaTahunanJatuhTempo === undefined
      ) {
        itemChanged = true
      }

      if (itemChanged) {
        migrated = true
      }

      return {
        id: item.id,
        nomorPolisi: item.nomorPolisi,
        kodeBarang: item.kodeBarang,
        merek: item.merek,
        tipeModel: item.tipeModel,
        jenis: item.jenis,
        tahunProduksi: item.tahunProduksi,
        warna: item.warna,
        nomorRangka: item.nomorRangka,
        nomorMesin: item.nomorMesin,
        kondisi: item.kondisi,
        lokasiParkir: item.lokasiParkir ?? '',
        keterangan: item.keterangan,
        fotos,
        dokumenStnk: item.dokumenStnk ?? null,
        dokumenBpkb: item.dokumenBpkb ?? null,
        pajakTahunanJatuhTempo: item.pajakTahunanJatuhTempo ?? null,
        pajakLimaTahunanJatuhTempo: item.pajakLimaTahunanJatuhTempo ?? null,
        perangkatDaerahId: item.perangkatDaerahId,
        pegawaiId: item.pegawaiId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }
    })

    const db: BmdDatabase = {
      perangkatDaerah: parsed.perangkatDaerah,
      pegawai: parsed.pegawai,
      kendaraan,
      riwayat: parsed.riwayat,
      servis,
      peminjaman,
      roles,
      users,
      nextIds,
    }

    if (migrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
    }
    return db
  } catch {
    return cloneSeed()
  }
}

function writeDb(db: BmdDatabase): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      throw new Error(
        'Penyimpanan browser penuh. Kurangi jumlah/ukuran foto atau file PDF STNK/BPKB terlebih dahulu.'
      )
    }
    throw err
  }
}

function nowIso(): string {
  return new Date().toISOString()
}

export async function resetDatabaseToSeed(): Promise<void> {
  const initial = cloneSeed()
  writeDb(initial)
}

export async function getAllData(): Promise<BmdDatabase> {
  return readDb()
}

export async function getDashboardSummary(
  filterPdId?: number | null
): Promise<DashboardSummary> {
  const db = readDb()
  const scopedKendaraan = filterPdId
    ? db.kendaraan.filter((k) => k.perangkatDaerahId === filterPdId)
    : db.kendaraan
  const scopedPegawai = filterPdId
    ? db.pegawai.filter((p) => p.perangkatDaerahId === filterPdId)
    : db.pegawai
  const scopedPdList = filterPdId
    ? db.perangkatDaerah.filter((pd) => pd.id === filterPdId)
    : db.perangkatDaerah

  const totalKendaraan = scopedKendaraan.length
  const totalBaik = scopedKendaraan.filter((k) => k.kondisi === 'BAIK').length
  const totalRusakRingan = scopedKendaraan.filter(
    (k) => k.kondisi === 'RUSAK_RINGAN'
  ).length
  const totalRusakBerat = scopedKendaraan.filter(
    (k) => k.kondisi === 'RUSAK_BERAT'
  ).length
  const totalBerpenanggungJawab = scopedKendaraan.filter(
    (k) => k.pegawaiId !== null
  ).length
  const totalPoolDinas = totalKendaraan - totalBerpenanggungJawab
  const totalRoda4 = scopedKendaraan.filter((k) => k.jenis === 'RODA_4').length
  const totalRoda2 = scopedKendaraan.filter((k) => k.jenis === 'RODA_2').length
  const totalKhusus = scopedKendaraan.filter((k) => k.jenis === 'KHUSUS').length

  const pdMap = new Map(db.perangkatDaerah.map((pd) => [pd.id, pd]))

  const daftarPengingatPajak: TaxReminderItem[] = []
  for (const k of scopedKendaraan) {
    const pd = pdMap.get(k.perangkatDaerahId)
    const cekTahunan = getTaxStatus(k.pajakTahunanJatuhTempo)
    if (
      k.pajakTahunanJatuhTempo &&
      (cekTahunan.status === 'OVERDUE' || cekTahunan.status === 'WARNING') &&
      cekTahunan.daysRemaining !== null
    ) {
      daftarPengingatPajak.push({
        kendaraanId: k.id,
        nomorPolisi: k.nomorPolisi,
        merekModel: `${k.merek} ${k.tipeModel}`,
        perangkatDaerahNama: pd?.nama ?? '-',
        perangkatDaerahSingkatan: pd?.singkatan ?? '-',
        jenisPajak: 'PKB_TAHUNAN',
        tanggalJatuhTempo: k.pajakTahunanJatuhTempo,
        daysRemaining: cekTahunan.daysRemaining,
      })
    }

    const cekLimaTahunan = getTaxStatus(k.pajakLimaTahunanJatuhTempo)
    if (
      k.pajakLimaTahunanJatuhTempo &&
      (cekLimaTahunan.status === 'OVERDUE' ||
        cekLimaTahunan.status === 'WARNING') &&
      cekLimaTahunan.daysRemaining !== null
    ) {
      daftarPengingatPajak.push({
        kendaraanId: k.id,
        nomorPolisi: k.nomorPolisi,
        merekModel: `${k.merek} ${k.tipeModel}`,
        perangkatDaerahNama: pd?.nama ?? '-',
        perangkatDaerahSingkatan: pd?.singkatan ?? '-',
        jenisPajak: 'PLAT_5_TAHUNAN',
        tanggalJatuhTempo: k.pajakLimaTahunanJatuhTempo,
        daysRemaining: cekLimaTahunan.daysRemaining,
      })
    }
  }
  daftarPengingatPajak.sort((a, b) => a.daysRemaining - b.daysRemaining)

  const perPerangkatDaerah = scopedPdList.map((pd) => {
    const unitList = db.kendaraan.filter((k) => k.perangkatDaerahId === pd.id)
    const pegawaiList = db.pegawai.filter((p) => p.perangkatDaerahId === pd.id)
    return {
      perangkatDaerah: pd,
      totalKendaraan: unitList.length,
      baik: unitList.filter((k) => k.kondisi === 'BAIK').length,
      rusakRingan: unitList.filter((k) => k.kondisi === 'RUSAK_RINGAN').length,
      rusakBerat: unitList.filter((k) => k.kondisi === 'RUSAK_BERAT').length,
      totalPegawai: pegawaiList.length,
    }
  })

  const scopedKendaraanIds = new Set(scopedKendaraan.map((k) => k.id))
  const scopedServis = db.servis.filter((s) =>
    scopedKendaraanIds.has(s.kendaraanId)
  )
  const totalServisAktif = scopedServis.filter(
    (s) => s.status === 'TERJADWAL' || s.status === 'DALAM_PERBAIKAN'
  ).length
  const totalSedangDipinjam = db.peminjaman.filter(
    (p) => scopedKendaraanIds.has(p.kendaraanId) && p.status === 'DIPINJAM'
  ).length
  const totalBiayaServis = scopedServis.reduce((sum, s) => sum + s.biaya, 0)

  const kendaraanMap = new Map(db.kendaraan.map((k) => [k.id, k]))
  const riwayatTerbaru = [...db.riwayat]
    .filter((r) => !filterPdId || r.perangkatDaerahId === filterPdId)
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
    .slice(0, 8)
    .map((r) => {
      const k = kendaraanMap.get(r.kendaraanId)
      return {
        ...r,
        nomorPolisi: k?.nomorPolisi ?? 'Unit Dihapus',
        merekModel: k ? `${k.merek} ${k.tipeModel}` : '-',
      }
    })

  return {
    totalKendaraan,
    totalBaik,
    totalRusakRingan,
    totalRusakBerat,
    totalBerpenanggungJawab,
    totalPoolDinas,
    totalPegawai: scopedPegawai.length,
    totalPerangkatDaerah: scopedPdList.length,
    totalRoda4,
    totalRoda2,
    totalKhusus,
    pajakPerluPerhatian: daftarPengingatPajak.length,
    totalServisAktif,
    totalSedangDipinjam,
    totalBiayaServis,
    daftarPengingatPajak,
    perPerangkatDaerah,
    riwayatTerbaru,
  }
}

// ==========================================
// CRUD PERANGKAT DAERAH
// ==========================================

export async function listPerangkatDaerah(): Promise<PerangkatDaerah[]> {
  const db = readDb()
  return [...db.perangkatDaerah].sort((a, b) => a.kodeSkpd.localeCompare(b.kodeSkpd))
}

export async function createPerangkatDaerah(
  input: PerangkatDaerahInput
): Promise<PerangkatDaerah> {
  const db = readDb()
  const kode = input.kodeSkpd.trim()
  const nama = input.nama.trim()

  if (!kode || !nama || !input.singkatan.trim()) {
    throw new Error('Kode SKPD, Nama Perangkat Daerah, dan Singkatan wajib diisi.')
  }

  const duplicateKode = db.perangkatDaerah.some(
    (p) => p.kodeSkpd.toLowerCase() === kode.toLowerCase()
  )
  if (duplicateKode) {
    throw new Error(`Kode SKPD "${kode}" sudah terdaftar.`)
  }

  const timestamp = nowIso()
  const created: PerangkatDaerah = {
    id: db.nextIds.perangkatDaerah++,
    kodeSkpd: kode,
    nama,
    singkatan: input.singkatan.trim().toUpperCase(),
    kepalaDinas: input.kepalaDinas.trim(),
    alamat: input.alamat.trim(),
    telepon: input.telepon.trim(),
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  db.perangkatDaerah.push(created)
  writeDb(db)
  return created
}

export async function updatePerangkatDaerah(
  id: number,
  input: PerangkatDaerahInput
): Promise<PerangkatDaerah> {
  const db = readDb()
  const idx = db.perangkatDaerah.findIndex((p) => p.id === id)
  if (idx === -1) {
    throw new Error('Data Perangkat Daerah tidak ditemukan.')
  }

  const kode = input.kodeSkpd.trim()
  const nama = input.nama.trim()
  if (!kode || !nama || !input.singkatan.trim()) {
    throw new Error('Kode SKPD, Nama Perangkat Daerah, dan Singkatan wajib diisi.')
  }

  const duplicateKode = db.perangkatDaerah.some(
    (p) => p.id !== id && p.kodeSkpd.toLowerCase() === kode.toLowerCase()
  )
  if (duplicateKode) {
    throw new Error(`Kode SKPD "${kode}" sudah digunakan Perangkat Daerah lain.`)
  }

  const updated: PerangkatDaerah = {
    ...db.perangkatDaerah[idx],
    kodeSkpd: kode,
    nama,
    singkatan: input.singkatan.trim().toUpperCase(),
    kepalaDinas: input.kepalaDinas.trim(),
    alamat: input.alamat.trim(),
    telepon: input.telepon.trim(),
    updatedAt: nowIso(),
  }

  db.perangkatDaerah[idx] = updated
  writeDb(db)
  return updated
}

export async function deletePerangkatDaerah(id: number): Promise<void> {
  const db = readDb()
  const jumlahKendaraan = db.kendaraan.filter((k) => k.perangkatDaerahId === id).length
  const jumlahPegawai = db.pegawai.filter((p) => p.perangkatDaerahId === id).length

  if (jumlahKendaraan > 0 || jumlahPegawai > 0) {
    throw new Error(
      `Perangkat Daerah tidak dapat dihapus karena masih menaungi ${jumlahPegawai} PNS dan ${jumlahKendaraan} unit kendaraan dinas. Pindahkan atau hapus data terkait terlebih dahulu.`
    )
  }

  db.perangkatDaerah = db.perangkatDaerah.filter((p) => p.id !== id)
  writeDb(db)
}

// ==========================================
// CRUD PEGAWAI NEGERI SIPIL (PNS)
// ==========================================

export async function listPegawai(): Promise<Pegawai[]> {
  const db = readDb()
  return [...db.pegawai].sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
}

export async function createPegawai(input: PegawaiInput): Promise<Pegawai> {
  const db = readDb()
  const nipClean = input.nip.replace(/\D/g, '')
  if (nipClean.length !== 18) {
    throw new Error('NIP PNS harus terdiri dari tepat 18 digit angka.')
  }
  if (!input.nama.trim() || !input.jabatan.trim() || !input.golongan.trim()) {
    throw new Error('Nama pegawai, jabatan, dan golongan wajib diisi.')
  }

  const pdExists = db.perangkatDaerah.some((pd) => pd.id === input.perangkatDaerahId)
  if (!pdExists) {
    throw new Error('Perangkat Daerah asal pegawai tidak valid.')
  }

  const duplicateNip = db.pegawai.some((p) => p.nip === nipClean)
  if (duplicateNip) {
    throw new Error(`NIP ${nipClean} sudah terdaftar pada pegawai lain.`)
  }

  const timestamp = nowIso()
  const created: Pegawai = {
    id: db.nextIds.pegawai++,
    nip: nipClean,
    nama: input.nama.trim(),
    jabatan: input.jabatan.trim(),
    golongan: input.golongan.trim(),
    pangkat: input.pangkat.trim(),
    noHp: input.noHp.trim(),
    email: input.email.trim(),
    perangkatDaerahId: input.perangkatDaerahId,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  db.pegawai.push(created)
  writeDb(db)
  return created
}

export async function updatePegawai(id: number, input: PegawaiInput): Promise<Pegawai> {
  const db = readDb()
  const idx = db.pegawai.findIndex((p) => p.id === id)
  if (idx === -1) {
    throw new Error('Data PNS tidak ditemukan.')
  }

  const nipClean = input.nip.replace(/\D/g, '')
  if (nipClean.length !== 18) {
    throw new Error('NIP PNS harus terdiri dari tepat 18 digit angka.')
  }
  if (!input.nama.trim() || !input.jabatan.trim() || !input.golongan.trim()) {
    throw new Error('Nama pegawai, jabatan, dan golongan wajib diisi.')
  }

  const duplicateNip = db.pegawai.some((p) => p.id !== id && p.nip === nipClean)
  if (duplicateNip) {
    throw new Error(`NIP ${nipClean} sudah digunakan pegawai lain.`)
  }

  const updated: Pegawai = {
    ...db.pegawai[idx],
    nip: nipClean,
    nama: input.nama.trim(),
    jabatan: input.jabatan.trim(),
    golongan: input.golongan.trim(),
    pangkat: input.pangkat.trim(),
    noHp: input.noHp.trim(),
    email: input.email.trim(),
    perangkatDaerahId: input.perangkatDaerahId,
    updatedAt: nowIso(),
  }

  db.pegawai[idx] = updated
  writeDb(db)
  return updated
}

export async function deletePegawai(id: number): Promise<void> {
  const db = readDb()
  const target = db.pegawai.find((p) => p.id === id)
  if (!target) {
    throw new Error('Data PNS tidak ditemukan.')
  }

  const timestamp = nowIso()
  const pdMap = new Map(db.perangkatDaerah.map((pd) => [pd.id, pd]))

  // Lepaskan relasi penanggung jawab pada KDO yang dipegang PNS ini
  db.kendaraan = db.kendaraan.map((k) => {
    if (k.pegawaiId === id) {
      const pdName = pdMap.get(k.perangkatDaerahId)?.nama ?? '-'
      db.riwayat.push({
        id: db.nextIds.riwayat++,
        kendaraanId: k.id,
        pegawaiId: null,
        pegawaiNamaSnapshot: null,
        perangkatDaerahId: k.perangkatDaerahId,
        perangkatDaerahNamaSnapshot: pdName,
        jenisPerubahan: 'PENUGASAN',
        kondisiSaatItu: k.kondisi,
        nomorBast: '-',
        catatan: `Penanggung jawab (${target.nama}) dilepas karena data pegawai dihapus; kendaraan kembali ke Pool Perangkat Daerah.`,
        tanggal: timestamp,
      })
      return { ...k, pegawaiId: null, updatedAt: timestamp }
    }
    return k
  })

  db.pegawai = db.pegawai.filter((p) => p.id !== id)
  writeDb(db)
}

// ==========================================
// CRUD KENDARAAN DINAS OPERASIONAL (KDO)
// ==========================================

export async function listKendaraan(): Promise<KendaraanDinas[]> {
  const db = readDb()
  return [...db.kendaraan].sort((a, b) => b.id - a.id)
}

export async function listRiwayatByKendaraan(
  kendaraanId: number
): Promise<RiwayatKendaraan[]> {
  const db = readDb()
  return db.riwayat
    .filter((r) => r.kendaraanId === kendaraanId)
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
}

export async function createKendaraan(input: KendaraanInput): Promise<KendaraanDinas> {
  const db = readDb()
  const nopol = input.nomorPolisi.trim().toUpperCase().replace(/\s+/g, ' ')

  if (!nopol || !input.merek.trim() || !input.tipeModel.trim() || !input.warna.trim()) {
    throw new Error('Nomor polisi, merek, tipe/model, dan warna kendaraan wajib diisi.')
  }

  if (
    Number.isNaN(input.tahunProduksi) ||
    input.tahunProduksi < 1980 ||
    input.tahunProduksi > new Date().getFullYear() + 1
  ) {
    throw new Error('Tahun produksi kendaraan tidak valid.')
  }

  const duplicateNopol = db.kendaraan.some(
    (k) => k.nomorPolisi.toUpperCase() === nopol
  )
  if (duplicateNopol) {
    throw new Error(`Nomor polisi "${nopol}" sudah terdaftar dalam sistem.`)
  }

  const pd = db.perangkatDaerah.find((p) => p.id === input.perangkatDaerahId)
  if (!pd) {
    throw new Error('Perangkat Daerah pemilik kendaraan wajib dipilih.')
  }

  let pegawaiObj: Pegawai | undefined
  if (input.pegawaiId !== null) {
    pegawaiObj = db.pegawai.find((p) => p.id === input.pegawaiId)
    if (!pegawaiObj) {
      throw new Error('Pegawai penanggung jawab yang dipilih tidak ditemukan.')
    }
  }

  const timestamp = nowIso()
  const created: KendaraanDinas = {
    id: db.nextIds.kendaraan++,
    nomorPolisi: nopol,
    kodeBarang: input.kodeBarang.trim(),
    merek: input.merek.trim(),
    tipeModel: input.tipeModel.trim(),
    jenis: input.jenis,
    tahunProduksi: input.tahunProduksi,
    warna: input.warna.trim(),
    nomorRangka: input.nomorRangka.trim().toUpperCase(),
    nomorMesin: input.nomorMesin.trim().toUpperCase(),
    kondisi: input.kondisi,
    lokasiParkir: input.lokasiParkir.trim(),
    keterangan: input.keterangan.trim(),
    fotos: input.fotos ?? [],
    dokumenStnk: input.dokumenStnk ?? null,
    dokumenBpkb: input.dokumenBpkb ?? null,
    pajakTahunanJatuhTempo: input.pajakTahunanJatuhTempo || null,
    pajakLimaTahunanJatuhTempo: input.pajakLimaTahunanJatuhTempo || null,
    perangkatDaerahId: input.perangkatDaerahId,
    pegawaiId: input.pegawaiId,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  db.kendaraan.push(created)
  db.riwayat.push({
    id: db.nextIds.riwayat++,
    kendaraanId: created.id,
    pegawaiId: created.pegawaiId,
    pegawaiNamaSnapshot: pegawaiObj?.nama ?? null,
    perangkatDaerahId: pd.id,
    perangkatDaerahNamaSnapshot: pd.nama,
    jenisPerubahan: 'PENDAFTARAN',
    kondisiSaatItu: created.kondisi,
    nomorBast: input.nomorBast?.trim() || '-',
    catatan:
      input.catatanPerubahan?.trim() ||
      (pegawaiObj
        ? `Registrasi awal KDO pada ${pd.nama} dengan penanggung jawab ${pegawaiObj.nama}.`
        : `Registrasi awal KDO pada Pool ${pd.nama}.`),
    tanggal: timestamp,
  })

  writeDb(db)
  return created
}

export async function updateKendaraan(
  id: number,
  input: KendaraanInput
): Promise<KendaraanDinas> {
  const db = readDb()
  const idx = db.kendaraan.findIndex((k) => k.id === id)
  if (idx === -1) {
    throw new Error('Data kendaraan dinas tidak ditemukan.')
  }

  const existing = db.kendaraan[idx]
  const nopol = input.nomorPolisi.trim().toUpperCase().replace(/\s+/g, ' ')

  if (!nopol || !input.merek.trim() || !input.tipeModel.trim() || !input.warna.trim()) {
    throw new Error('Nomor polisi, merek, tipe/model, dan warna kendaraan wajib diisi.')
  }

  const duplicateNopol = db.kendaraan.some(
    (k) => k.id !== id && k.nomorPolisi.toUpperCase() === nopol
  )
  if (duplicateNopol) {
    throw new Error(`Nomor polisi "${nopol}" sudah digunakan oleh kendaraan lain.`)
  }

  const pd = db.perangkatDaerah.find((p) => p.id === input.perangkatDaerahId)
  if (!pd) {
    throw new Error('Perangkat Daerah pemilik kendaraan wajib dipilih.')
  }

  let pegawaiObj: Pegawai | undefined
  if (input.pegawaiId !== null) {
    pegawaiObj = db.pegawai.find((p) => p.id === input.pegawaiId)
    if (!pegawaiObj) {
      throw new Error('Pegawai penanggung jawab yang dipilih tidak ditemukan.')
    }
  }

  const timestamp = nowIso()
  const updated: KendaraanDinas = {
    ...existing,
    nomorPolisi: nopol,
    kodeBarang: input.kodeBarang.trim(),
    merek: input.merek.trim(),
    tipeModel: input.tipeModel.trim(),
    jenis: input.jenis,
    tahunProduksi: input.tahunProduksi,
    warna: input.warna.trim(),
    nomorRangka: input.nomorRangka.trim().toUpperCase(),
    nomorMesin: input.nomorMesin.trim().toUpperCase(),
    kondisi: input.kondisi,
    lokasiParkir: input.lokasiParkir.trim(),
    keterangan: input.keterangan.trim(),
    fotos: input.fotos ?? [],
    dokumenStnk: input.dokumenStnk ?? null,
    dokumenBpkb: input.dokumenBpkb ?? null,
    pajakTahunanJatuhTempo: input.pajakTahunanJatuhTempo || null,
    pajakLimaTahunanJatuhTempo: input.pajakLimaTahunanJatuhTempo || null,
    perangkatDaerahId: input.perangkatDaerahId,
    pegawaiId: input.pegawaiId,
    updatedAt: timestamp,
  }

  db.kendaraan[idx] = updated

  // Deteksi perubahan penting untuk dicatat di log riwayat
  const skpdChanged = existing.perangkatDaerahId !== updated.perangkatDaerahId
  const pegawaiChanged = existing.pegawaiId !== updated.pegawaiId
  const kondisiChanged = existing.kondisi !== updated.kondisi

  if (skpdChanged || pegawaiChanged || kondisiChanged) {
    const messages: string[] = []
    if (skpdChanged) {
      const oldPd = db.perangkatDaerah.find((p) => p.id === existing.perangkatDaerahId)
      messages.push(`Mutasi SKPD dari ${oldPd?.singkatan ?? '-'} ke ${pd.singkatan}.`)
    }
    if (pegawaiChanged) {
      const oldPegawai = db.pegawai.find((p) => p.id === existing.pegawaiId)
      messages.push(
        `Penanggung jawab berubah dari ${oldPegawai?.nama ?? 'Pool Dinas'} menjadi ${pegawaiObj?.nama ?? 'Pool Dinas'}.`
      )
    }
    if (kondisiChanged) {
      messages.push(`Kondisi berubah dari ${existing.kondisi} menjadi ${updated.kondisi}.`)
    }

    const jenisPerubahan = skpdChanged
      ? 'MUTASI_SKPD'
      : pegawaiChanged
        ? 'PENUGASAN'
        : 'KONDISI'

    db.riwayat.push({
      id: db.nextIds.riwayat++,
      kendaraanId: updated.id,
      pegawaiId: updated.pegawaiId,
      pegawaiNamaSnapshot: pegawaiObj?.nama ?? null,
      perangkatDaerahId: pd.id,
      perangkatDaerahNamaSnapshot: pd.nama,
      jenisPerubahan,
      kondisiSaatItu: updated.kondisi,
      nomorBast: input.nomorBast?.trim() || '-',
      catatan: input.catatanPerubahan?.trim() || messages.join(' '),
      tanggal: timestamp,
    })
  }

  writeDb(db)
  return updated
}

export async function deleteKendaraan(id: number): Promise<void> {
  const db = readDb()
  db.kendaraan = db.kendaraan.filter((k) => k.id !== id)
  db.riwayat = db.riwayat.filter((r) => r.kendaraanId !== id)
  db.servis = db.servis.filter((s) => s.kendaraanId !== id)
  writeDb(db)
}

// ==========================================
// CRUD SERVIS & PEMELIHARAAN KENDARAAN
// ==========================================

export async function listServis(): Promise<ServisKendaraan[]> {
  const db = readDb()
  return [...db.servis].sort((a, b) =>
    b.tanggalServis.localeCompare(a.tanggalServis) || b.id - a.id
  )
}

export async function createServis(
  input: ServisInput
): Promise<ServisKendaraan> {
  const db = readDb()
  const kendaraan = db.kendaraan.find((k) => k.id === input.kendaraanId)
  if (!kendaraan) {
    throw new Error('Kendaraan dinas yang dipilih tidak ditemukan.')
  }
  if (!input.tanggalServis || !input.bengkel.trim() || !input.deskripsi.trim()) {
    throw new Error('Tanggal servis, nama bengkel/rekanan, dan uraian pekerjaan wajib diisi.')
  }
  if (Number.isNaN(input.biaya) || input.biaya < 0) {
    throw new Error('Biaya pemeliharaan tidak boleh bernilai negatif.')
  }

  const timestamp = nowIso()
  const created: ServisKendaraan = {
    id: db.nextIds.servis++,
    kendaraanId: input.kendaraanId,
    tanggalServis: input.tanggalServis,
    jenisServis: input.jenisServis,
    status: input.status,
    bengkel: input.bengkel.trim(),
    kilometer:
      input.kilometer !== null && !Number.isNaN(input.kilometer)
        ? Math.max(0, Math.round(input.kilometer))
        : null,
    biaya: Math.round(input.biaya),
    servisBerikutnyaTanggal: input.servisBerikutnyaTanggal || null,
    deskripsi: input.deskripsi.trim(),
    buktiNota: input.buktiNota ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  db.servis.push(created)
  writeDb(db)
  return created
}

export async function updateServis(
  id: number,
  input: ServisInput
): Promise<ServisKendaraan> {
  const db = readDb()
  const idx = db.servis.findIndex((s) => s.id === id)
  if (idx === -1) {
    throw new Error('Data catatan servis tidak ditemukan.')
  }
  const kendaraan = db.kendaraan.find((k) => k.id === input.kendaraanId)
  if (!kendaraan) {
    throw new Error('Kendaraan dinas yang dipilih tidak ditemukan.')
  }
  if (!input.tanggalServis || !input.bengkel.trim() || !input.deskripsi.trim()) {
    throw new Error('Tanggal servis, nama bengkel/rekanan, dan uraian pekerjaan wajib diisi.')
  }
  if (Number.isNaN(input.biaya) || input.biaya < 0) {
    throw new Error('Biaya pemeliharaan tidak boleh bernilai negatif.')
  }

  const existing = db.servis[idx]
  const updated: ServisKendaraan = {
    ...existing,
    kendaraanId: input.kendaraanId,
    tanggalServis: input.tanggalServis,
    jenisServis: input.jenisServis,
    status: input.status,
    bengkel: input.bengkel.trim(),
    kilometer:
      input.kilometer !== null && !Number.isNaN(input.kilometer)
        ? Math.max(0, Math.round(input.kilometer))
        : null,
    biaya: Math.round(input.biaya),
    servisBerikutnyaTanggal: input.servisBerikutnyaTanggal || null,
    deskripsi: input.deskripsi.trim(),
    buktiNota: input.buktiNota ?? null,
    updatedAt: nowIso(),
  }

  db.servis[idx] = updated
  writeDb(db)
  return updated
}

export async function deleteServis(id: number): Promise<void> {
  const db = readDb()
  db.servis = db.servis.filter((s) => s.id !== id)
  writeDb(db)
}

// ==========================================
// CRUD MONITORING & PEMINJAMAN KENDARAAN
// ==========================================

function validatePeminjamanInput(
  db: BmdDatabase,
  input: PeminjamanInput,
  ignoreId?: number
): KendaraanDinas {
  const kendaraan = db.kendaraan.find((k) => k.id === input.kendaraanId)
  if (!kendaraan) {
    throw new Error('Kendaraan dinas yang dipilih tidak ditemukan.')
  }
  if (
    !input.peminjamNama.trim() ||
    !input.tujuanKeperluan.trim() ||
    !input.tanggalPinjam ||
    !input.tanggalKembaliRencana
  ) {
    throw new Error(
      'Nama peminjam, keperluan tugas, tanggal pinjam, dan rencana kembali wajib diisi.'
    )
  }
  if (input.tanggalKembaliRencana < input.tanggalPinjam) {
    throw new Error(
      'Tanggal rencana kembali tidak boleh lebih awal dari tanggal pinjam.'
    )
  }

  const isBookingActive =
    input.status === 'DIPINJAM' || input.status === 'TERJADWAL'
  if (isBookingActive) {
    const evalStatus = evaluateVehicleBorrowStatus(
      kendaraan,
      db.servis,
      db.peminjaman,
      ignoreId
    )
    if (!evalStatus.eligible) {
      throw new Error(
        `Kendaraan ${kendaraan.nomorPolisi} tidak memenuhi syarat peminjaman (${evalStatus.blockReasons.join(', ')}). Hanya unit kondisi Baik, tidak sedang servis, dan pajak aktif yang boleh dipinjam.`
      )
    }

    const overlap = db.peminjaman.find(
      (p) =>
        p.id !== ignoreId &&
        p.kendaraanId === input.kendaraanId &&
        (p.status === 'DIPINJAM' || p.status === 'TERJADWAL') &&
        p.tanggalPinjam <= input.tanggalKembaliRencana &&
        input.tanggalPinjam <= p.tanggalKembaliRencana
    )
    if (overlap) {
      throw new Error(
        `Jadwal bentrok dengan peminjaman atas nama ${overlap.peminjamNama} (${overlap.tanggalPinjam} s/d ${overlap.tanggalKembaliRencana}).`
      )
    }
  }

  return kendaraan
}

export async function listPeminjaman(): Promise<PeminjamanKendaraan[]> {
  const db = readDb()
  return [...db.peminjaman].sort(
    (a, b) =>
      new Date(b.tanggalPinjam).getTime() - new Date(a.tanggalPinjam).getTime() ||
      b.id - a.id
  )
}

export async function createPeminjaman(
  input: PeminjamanInput
): Promise<PeminjamanKendaraan> {
  const db = readDb()
  validatePeminjamanInput(db, input)

  const timestamp = nowIso()
  const created: PeminjamanKendaraan = {
    id: db.nextIds.peminjaman++,
    kendaraanId: input.kendaraanId,
    peminjamPegawaiId: input.peminjamPegawaiId ?? null,
    peminjamNama: input.peminjamNama.trim(),
    peminjamInstansi: input.peminjamInstansi.trim(),
    tujuanKeperluan: input.tujuanKeperluan.trim(),
    lokasiTujuan: input.lokasiTujuan.trim(),
    tanggalPinjam: input.tanggalPinjam,
    tanggalKembaliRencana: input.tanggalKembaliRencana,
    tanggalKembaliAktual:
      input.status === 'SELESAI'
        ? input.tanggalKembaliAktual || input.tanggalKembaliRencana
        : null,
    status: input.status,
    nomorSuratTugas: input.nomorSuratTugas.trim(),
    kilometerAwal:
      input.kilometerAwal !== null && !Number.isNaN(input.kilometerAwal)
        ? Math.max(0, Math.round(input.kilometerAwal))
        : null,
    kilometerAkhir:
      input.kilometerAkhir !== null && !Number.isNaN(input.kilometerAkhir)
        ? Math.max(0, Math.round(input.kilometerAkhir))
        : null,
    kondisiSaatKembali: input.kondisiSaatKembali ?? null,
    catatan: input.catatan.trim(),
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  db.peminjaman.push(created)
  writeDb(db)
  return created
}

export async function updatePeminjaman(
  id: number,
  input: PeminjamanInput
): Promise<PeminjamanKendaraan> {
  const db = readDb()
  const idx = db.peminjaman.findIndex((p) => p.id === id)
  if (idx === -1) {
    throw new Error('Data peminjaman kendaraan tidak ditemukan.')
  }

  validatePeminjamanInput(db, input, id)
  const existing = db.peminjaman[idx]
  const updated: PeminjamanKendaraan = {
    ...existing,
    kendaraanId: input.kendaraanId,
    peminjamPegawaiId: input.peminjamPegawaiId ?? null,
    peminjamNama: input.peminjamNama.trim(),
    peminjamInstansi: input.peminjamInstansi.trim(),
    tujuanKeperluan: input.tujuanKeperluan.trim(),
    lokasiTujuan: input.lokasiTujuan.trim(),
    tanggalPinjam: input.tanggalPinjam,
    tanggalKembaliRencana: input.tanggalKembaliRencana,
    tanggalKembaliAktual:
      input.status === 'SELESAI'
        ? input.tanggalKembaliAktual ||
          existing.tanggalKembaliAktual ||
          new Date().toISOString().slice(0, 10)
        : null,
    status: input.status,
    nomorSuratTugas: input.nomorSuratTugas.trim(),
    kilometerAwal:
      input.kilometerAwal !== null && !Number.isNaN(input.kilometerAwal)
        ? Math.max(0, Math.round(input.kilometerAwal))
        : null,
    kilometerAkhir:
      input.kilometerAkhir !== null && !Number.isNaN(input.kilometerAkhir)
        ? Math.max(0, Math.round(input.kilometerAkhir))
        : null,
    kondisiSaatKembali: input.kondisiSaatKembali ?? null,
    catatan: input.catatan.trim(),
    updatedAt: nowIso(),
  }

  db.peminjaman[idx] = updated
  writeDb(db)
  return updated
}

export async function completePeminjaman(
  id: number,
  payload: {
    tanggalKembaliAktual: string
    kilometerAkhir: number | null
    kondisiSaatKembali: KondisiKendaraan
    catatan: string
  }
): Promise<PeminjamanKendaraan> {
  const db = readDb()
  const idx = db.peminjaman.findIndex((p) => p.id === id)
  if (idx === -1) {
    throw new Error('Data peminjaman kendaraan tidak ditemukan.')
  }
  if (!payload.tanggalKembaliAktual) {
    throw new Error('Tanggal pengembalian aktual wajib diisi.')
  }

  const existing = db.peminjaman[idx]
  const timestamp = nowIso()
  const updated: PeminjamanKendaraan = {
    ...existing,
    tanggalKembaliAktual: payload.tanggalKembaliAktual,
    kilometerAkhir:
      payload.kilometerAkhir !== null && !Number.isNaN(payload.kilometerAkhir)
        ? Math.max(0, Math.round(payload.kilometerAkhir))
        : null,
    kondisiSaatKembali: payload.kondisiSaatKembali,
    catatan: payload.catatan.trim() || existing.catatan,
    status: 'SELESAI',
    updatedAt: timestamp,
  }
  db.peminjaman[idx] = updated

  // If condition changed upon return, synchronize KDO condition & record history
  const kIdx = db.kendaraan.findIndex((k) => k.id === existing.kendaraanId)
  if (kIdx !== -1) {
    const kendaraan = db.kendaraan[kIdx]
    if (kendaraan.kondisi !== payload.kondisiSaatKembali) {
      const pd = db.perangkatDaerah.find(
        (p) => p.id === kendaraan.perangkatDaerahId
      )
      const peg = kendaraan.pegawaiId
        ? db.pegawai.find((p) => p.id === kendaraan.pegawaiId)
        : undefined
      db.kendaraan[kIdx] = {
        ...kendaraan,
        kondisi: payload.kondisiSaatKembali,
        updatedAt: timestamp,
      }
      db.riwayat.push({
        id: db.nextIds.riwayat++,
        kendaraanId: kendaraan.id,
        pegawaiId: kendaraan.pegawaiId,
        pegawaiNamaSnapshot: peg?.nama ?? null,
        perangkatDaerahId: kendaraan.perangkatDaerahId,
        perangkatDaerahNamaSnapshot: pd?.nama ?? '-',
        jenisPerubahan: 'KONDISI',
        kondisiSaatItu: payload.kondisiSaatKembali,
        nomorBast: existing.nomorSuratTugas,
        catatan: `Pembaruan kondisi saat pengembalian peminjaman (${existing.peminjamNama}): ${payload.catatan.trim() || 'Pengecekan pasca pakai'}`,
        tanggal: timestamp,
      })
    }
  }

  writeDb(db)
  return updated
}

export async function deletePeminjaman(id: number): Promise<void> {
  const db = readDb()
  db.peminjaman = db.peminjaman.filter((p) => p.id !== id)
  writeDb(db)
}

// ==========================================
// AUTENTIKASI & SESI PENGGUNA
// ==========================================

export function getCurrentSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AuthSession>
    if (!parsed.userId || !parsed.username || !parsed.role) {
      return null
    }
    return parsed as AuthSession
  } catch {
    return null
  }
}

export async function loginUser(
  identifier: string,
  password: string
): Promise<AuthSession> {
  const db = readDb()
  const key = identifier.trim().toLowerCase()
  if (!key || !password) {
    throw new Error('Username/Email dan kata sandi wajib diisi.')
  }

  const user = db.users.find(
    (u) =>
      u.username.toLowerCase() === key || u.email.toLowerCase() === key
  )

  if (!user || user.password !== password) {
    throw new Error('Username/Email atau kata sandi tidak sesuai.')
  }

  if (!user.aktif) {
    throw new Error(
      'Akun Anda sedang dinonaktifkan. Hubungi Admin BPAD untuk aktivasi kembali.'
    )
  }

  const session: AuthSession = {
    userId: user.id,
    username: user.username,
    nama: user.nama,
    email: user.email,
    role: user.role,
    perangkatDaerahId: user.perangkatDaerahId,
    loggedInAt: nowIso(),
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export function logoutUser(): void {
  localStorage.removeItem(SESSION_KEY)
}

// ==========================================
// CRUD MANAJEMEN USER
// ==========================================

export async function listUsers(): Promise<AppUser[]> {
  const db = readDb()
  return [...db.users].sort((a, b) => a.id - b.id)
}

export async function createUser(input: AppUserInput): Promise<AppUser> {
  const db = readDb()
  const username = input.username.trim().toLowerCase()
  const email = input.email.trim().toLowerCase()
  const nama = input.nama.trim()
  const password = input.password?.trim() ?? ''

  if (!username || !email || !nama) {
    throw new Error('Username, nama lengkap, dan email wajib diisi.')
  }
  if (password.length < 6) {
    throw new Error('Kata sandi minimal 6 karakter.')
  }

  if (db.users.some((u) => u.username.toLowerCase() === username)) {
    throw new Error(`Username "${username}" sudah digunakan.`)
  }
  if (db.users.some((u) => u.email.toLowerCase() === email)) {
    throw new Error(`Email "${email}" sudah terdaftar.`)
  }

  if (input.role === 'OPERATOR_SKPD' && input.perangkatDaerahId === null) {
    throw new Error('Operator SKPD wajib ditautkan ke Perangkat Daerah tertentu.')
  }

  const timestamp = nowIso()
  const created: AppUser = {
    id: db.nextIds.users++,
    username,
    nama,
    email,
    password,
    role: input.role,
    perangkatDaerahId:
      input.role === 'OPERATOR_SKPD' ? input.perangkatDaerahId : null,
    aktif: input.aktif,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  db.users.push(created)
  writeDb(db)
  return created
}

export async function updateUser(
  id: number,
  input: AppUserInput
): Promise<AppUser> {
  const db = readDb()
  const idx = db.users.findIndex((u) => u.id === id)
  if (idx === -1) {
    throw new Error('Data pengguna tidak ditemukan.')
  }

  const existing = db.users[idx]
  const username = input.username.trim().toLowerCase()
  const email = input.email.trim().toLowerCase()
  const nama = input.nama.trim()
  const nextPassword = input.password?.trim()

  if (!username || !email || !nama) {
    throw new Error('Username, nama lengkap, dan email wajib diisi.')
  }
  if (nextPassword && nextPassword.length < 6) {
    throw new Error('Kata sandi baru minimal 6 karakter.')
  }

  if (
    db.users.some((u) => u.id !== id && u.username.toLowerCase() === username)
  ) {
    throw new Error(`Username "${username}" sudah digunakan pengguna lain.`)
  }
  if (db.users.some((u) => u.id !== id && u.email.toLowerCase() === email)) {
    throw new Error(`Email "${email}" sudah digunakan pengguna lain.`)
  }
  if (input.role === 'OPERATOR_SKPD' && input.perangkatDaerahId === null) {
    throw new Error('Operator SKPD wajib ditautkan ke Perangkat Daerah tertentu.')
  }

  // Pastikan masih ada minimal 1 Admin BPAD aktif
  const activeAdminsOther = db.users.filter(
    (u) => u.id !== id && u.role === 'ADMIN_BPAD' && u.aktif
  )
  if (
    existing.role === 'ADMIN_BPAD' &&
    (input.role !== 'ADMIN_BPAD' || !input.aktif) &&
    activeAdminsOther.length === 0
  ) {
    throw new Error(
      'Minimal harus ada 1 akun Admin BPAD yang aktif di dalam sistem.'
    )
  }

  const updated: AppUser = {
    ...existing,
    username,
    nama,
    email,
    password: nextPassword ? nextPassword : existing.password,
    role: input.role,
    perangkatDaerahId:
      input.role === 'OPERATOR_SKPD' ? input.perangkatDaerahId : null,
    aktif: input.aktif,
    updatedAt: nowIso(),
  }

  db.users[idx] = updated
  writeDb(db)

  // Sinkronkan sesi jika sedang login dengan akun yang diedit
  const session = getCurrentSession()
  if (session && session.userId === id) {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        ...session,
        username: updated.username,
        nama: updated.nama,
        email: updated.email,
        role: updated.role,
        perangkatDaerahId: updated.perangkatDaerahId,
      })
    )
  }

  return updated
}

export async function deleteUser(id: number): Promise<void> {
  const db = readDb()
  const session = getCurrentSession()
  if (session && session.userId === id) {
    throw new Error('Anda tidak dapat menghapus akun yang sedang digunakan untuk login.')
  }

  const target = db.users.find((u) => u.id === id)
  if (!target) {
    throw new Error('Data pengguna tidak ditemukan.')
  }

  if (target.role === 'ADMIN_BPAD') {
    const otherAdmins = db.users.filter(
      (u) => u.id !== id && u.role === 'ADMIN_BPAD' && u.aktif
    )
    if (otherAdmins.length === 0) {
      throw new Error('Tidak dapat menghapus satu-satunya akun Admin BPAD aktif.')
    }
  }

  db.users = db.users.filter((u) => u.id !== id)
  writeDb(db)
}

// ==========================================
// CRUD ROLES & HAK AKSES HALAMAN
// ==========================================

export function getPermissionsForRole(roleCode: string): RolePermissionMap {
  const db = readDb()
  const found = db.roles.find((r) => r.code === roleCode)
  if (found) {
    return {
      ...makeDefaultPermissionMap(false),
      ...found.permissions,
    }
  }
  const fallback = makeDefaultPermissionMap(false)
  fallback.dashboard.read = true
  return fallback
}

export function getRoleNameByCode(roleCode: string): string {
  const db = readDb()
  const found = db.roles.find((r) => r.code === roleCode)
  return found ? found.name : roleCode.replace(/_/g, ' ')
}

export async function listRoles(): Promise<RoleDefinition[]> {
  const db = readDb()
  return [...db.roles].sort((a, b) => a.id - b.id)
}

export async function createRole(input: RoleInput): Promise<RoleDefinition> {
  const db = readDb()
  const code = input.code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  const name = input.name.trim()

  if (!code || !name) {
    throw new Error('Kode role dan nama role wajib diisi.')
  }

  if (db.roles.some((r) => r.code.toUpperCase() === code)) {
    throw new Error(`Kode role "${code}" sudah terdaftar.`)
  }

  const timestamp = nowIso()
  const created: RoleDefinition = {
    id: db.nextIds.roles++,
    code,
    name,
    description: input.description.trim(),
    isSystem: false,
    permissions: input.permissions,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  db.roles.push(created)
  writeDb(db)
  return created
}

export async function updateRole(
  id: number,
  input: RoleInput
): Promise<RoleDefinition> {
  const db = readDb()
  const idx = db.roles.findIndex((r) => r.id === id)
  if (idx === -1) {
    throw new Error('Data role tidak ditemukan.')
  }

  const existing = db.roles[idx]
  const nextCode = existing.isSystem
    ? existing.code
    : input.code
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
  const name = input.name.trim()

  if (!nextCode || !name) {
    throw new Error('Kode role dan nama role wajib diisi.')
  }

  if (
    db.roles.some((r) => r.id !== id && r.code.toUpperCase() === nextCode)
  ) {
    throw new Error(`Kode role "${nextCode}" sudah digunakan oleh role lain.`)
  }

  if (
    existing.code === 'ADMIN_BPAD' &&
    (!input.permissions.roles.read ||
      !input.permissions.roles.update ||
      !input.permissions.users.read)
  ) {
    throw new Error(
      'Role ADMIN_BPAD harus tetap memiliki akses Lihat/Ubah pada Manajemen Role dan User agar tidak terkunci.'
    )
  }

  const oldCode = existing.code
  const updated: RoleDefinition = {
    ...existing,
    code: nextCode,
    name,
    description: input.description.trim(),
    permissions: input.permissions,
    updatedAt: nowIso(),
  }

  db.roles[idx] = updated

  if (oldCode !== nextCode) {
    db.users = db.users.map((u) =>
      u.role === oldCode ? { ...u, role: nextCode, updatedAt: nowIso() } : u
    )
    const session = getCurrentSession()
    if (session && session.role === oldCode) {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ ...session, role: nextCode })
      )
    }
  }

  writeDb(db)
  return updated
}

export async function deleteRole(id: number): Promise<void> {
  const db = readDb()
  const target = db.roles.find((r) => r.id === id)
  if (!target) {
    throw new Error('Data role tidak ditemukan.')
  }
  if (target.isSystem) {
    throw new Error(
      `Role bawaan "${target.name}" tidak dapat dihapus, namun hak akses CRUD per halamannya dapat Anda ubah lewat Edit.`
    )
  }
  const assignedCount = db.users.filter((u) => u.role === target.code).length
  if (assignedCount > 0) {
    throw new Error(
      `Role "${target.name}" masih digunakan oleh ${assignedCount} akun pengguna. Ubah role pengguna tersebut terlebih dahulu.`
    )
  }

  db.roles = db.roles.filter((r) => r.id !== id)
  writeDb(db)
}

