import type { KendaraanDinas, PerangkatDaerah } from '@prisma/client'
import { prisma } from '../lib/db'
import { getTaxStatus } from '../lib/tax'

interface TaxReminderItem {
  kendaraanId: number
  nomorPolisi: string
  merekModel: string
  perangkatDaerahNama: string
  perangkatDaerahSingkatan: string
  jenisPajak: 'PKB_TAHUNAN' | 'PLAT_5_TAHUNAN'
  tanggalJatuhTempo: string
  daysRemaining: number
}

function collectTaxReminder(
  reminders: TaxReminderItem[],
  kendaraan: KendaraanDinas,
  pd: PerangkatDaerah | undefined,
  jenisPajak: 'PKB_TAHUNAN' | 'PLAT_5_TAHUNAN',
  dateValue: string | null
) {
  if (!dateValue) return
  const check = getTaxStatus(dateValue)
  if (
    (check.status === 'OVERDUE' || check.status === 'WARNING') &&
    check.daysRemaining !== null
  ) {
    reminders.push({
      kendaraanId: kendaraan.id,
      nomorPolisi: kendaraan.nomorPolisi,
      merekModel: `${kendaraan.merek} ${kendaraan.tipeModel}`,
      perangkatDaerahNama: pd?.nama ?? '-',
      perangkatDaerahSingkatan: pd?.singkatan ?? '-',
      jenisPajak,
      tanggalJatuhTempo: dateValue,
      daysRemaining: check.daysRemaining,
    })
  }
}

function buildTaxReminders(
  kendaraanList: KendaraanDinas[],
  pdMap: Map<number, PerangkatDaerah>
): TaxReminderItem[] {
  const reminders: TaxReminderItem[] = []
  for (const k of kendaraanList) {
    const pd = pdMap.get(k.perangkatDaerahId)
    collectTaxReminder(
      reminders,
      k,
      pd,
      'PKB_TAHUNAN',
      k.pajakTahunanJatuhTempo
    )
    collectTaxReminder(
      reminders,
      k,
      pd,
      'PLAT_5_TAHUNAN',
      k.pajakLimaTahunanJatuhTempo
    )
  }
  return reminders.sort((a, b) => a.daysRemaining - b.daysRemaining)
}

export async function getDashboardSummary(filterPdId?: number) {
  const [
    allPd,
    scopedKendaraan,
    scopedPegawai,
    allServis,
    totalSedangDipinjam,
    recentRiwayat,
  ] = await Promise.all([
    prisma.perangkatDaerah.findMany({ orderBy: { kodeSkpd: 'asc' } }),
    prisma.kendaraanDinas.findMany({
      where: filterPdId ? { perangkatDaerahId: filterPdId } : undefined,
    }),
    prisma.pegawai.findMany({
      where: filterPdId ? { perangkatDaerahId: filterPdId } : undefined,
    }),
    prisma.servisKendaraan.findMany({
      where: filterPdId
        ? { kendaraan: { perangkatDaerahId: filterPdId } }
        : undefined,
    }),
    prisma.peminjamanKendaraan.count({
      where: {
        status: 'DIPINJAM',
        ...(filterPdId ? { kendaraan: { perangkatDaerahId: filterPdId } } : {}),
      },
    }),
    prisma.riwayatKendaraan.findMany({
      where: filterPdId ? { perangkatDaerahId: filterPdId } : undefined,
      orderBy: { tanggal: 'desc' },
      take: 8,
      include: {
        kendaraan: {
          select: {
            nomorPolisi: true,
            merek: true,
            tipeModel: true,
          },
        },
      },
    }),
  ])

  const scopedPdList = filterPdId
    ? allPd.filter((pd) => pd.id === filterPdId)
    : allPd

  const pdMap = new Map(allPd.map((pd) => [pd.id, pd]))
  const daftarPengingatPajak = buildTaxReminders(scopedKendaraan, pdMap)

  const totalKendaraan = scopedKendaraan.length
  const totalBerpenanggungJawab = scopedKendaraan.filter(
    (k) => k.pegawaiId !== null
  ).length

  const perPerangkatDaerah = scopedPdList.map((pd) => {
    const unitList = scopedKendaraan.filter(
      (k) => k.perangkatDaerahId === pd.id
    )
    const pegawaiList = scopedPegawai.filter(
      (p) => p.perangkatDaerahId === pd.id
    )
    return {
      perangkatDaerah: pd,
      totalKendaraan: unitList.length,
      baik: unitList.filter((k) => k.kondisi === 'BAIK').length,
      rusakRingan: unitList.filter((k) => k.kondisi === 'RUSAK_RINGAN').length,
      rusakBerat: unitList.filter((k) => k.kondisi === 'RUSAK_BERAT').length,
      totalPegawai: pegawaiList.length,
    }
  })

  const riwayatTerbaru = recentRiwayat.map((r) => ({
    id: r.id,
    kendaraanId: r.kendaraanId,
    pegawaiId: r.pegawaiId,
    pegawaiNamaSnapshot: r.pegawaiNamaSnapshot,
    perangkatDaerahId: r.perangkatDaerahId,
    perangkatDaerahNamaSnapshot: r.perangkatDaerahNamaSnapshot,
    jenisPerubahan: r.jenisPerubahan,
    kondisiSaatItu: r.kondisiSaatItu,
    nomorBast: r.nomorBast,
    catatan: r.catatan,
    tanggal: r.tanggal,
    nomorPolisi: r.kendaraan?.nomorPolisi ?? 'Unit Dihapus',
    merekModel: r.kendaraan
      ? `${r.kendaraan.merek} ${r.kendaraan.tipeModel}`
      : '-',
  }))

  return {
    totalKendaraan,
    totalBaik: scopedKendaraan.filter((k) => k.kondisi === 'BAIK').length,
    totalRusakRingan: scopedKendaraan.filter(
      (k) => k.kondisi === 'RUSAK_RINGAN'
    ).length,
    totalRusakBerat: scopedKendaraan.filter(
      (k) => k.kondisi === 'RUSAK_BERAT'
    ).length,
    totalBerpenanggungJawab,
    totalPoolDinas: totalKendaraan - totalBerpenanggungJawab,
    totalPegawai: scopedPegawai.length,
    totalPerangkatDaerah: scopedPdList.length,
    totalRoda4: scopedKendaraan.filter((k) => k.jenis === 'RODA_4').length,
    totalRoda2: scopedKendaraan.filter((k) => k.jenis === 'RODA_2').length,
    totalKhusus: scopedKendaraan.filter((k) => k.jenis === 'KHUSUS').length,
    pajakPerluPerhatian: daftarPengingatPajak.length,
    totalServisAktif: allServis.filter(
      (s) => s.status === 'TERJADWAL' || s.status === 'DALAM_PERBAIKAN'
    ).length,
    totalSedangDipinjam,
    totalBiayaServis: allServis.reduce((sum, s) => sum + s.biaya, 0),
    daftarPengingatPajak,
    perPerangkatDaerah,
    riwayatTerbaru,
  }
}
