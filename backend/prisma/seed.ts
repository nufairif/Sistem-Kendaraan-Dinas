import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function seedDatabase(client: PrismaClient = prisma): Promise<void> {
  // Bersihkan data lama dengan urutan child -> parent agar aman terhadap FK
  await client.peminjamanKendaraan.deleteMany()
  await client.servisKendaraan.deleteMany()
  await client.riwayatKendaraan.deleteMany()
  await client.kendaraanDinas.deleteMany()
  await client.pegawai.deleteMany()
  await client.appUser.deleteMany()
  await client.roleDefinition.deleteMany()
  await client.perangkatDaerah.deleteMany()
  await client.$executeRawUnsafe(
    `DELETE FROM sqlite_sequence WHERE name IN ('PerangkatDaerah', 'Pegawai', 'KendaraanDinas', 'RiwayatKendaraan', 'ServisKendaraan', 'PeminjamanKendaraan', 'RoleDefinition', 'AppUser')`
  )

  // 1. Perangkat Daerah
  const disdik = await client.perangkatDaerah.create({
    data: {
      kodeSkpd: '1.01.01.01',
      nama: 'Dinas Pendidikan',
      singkatan: 'DISDIK',
      kepalaDinas: 'Dr. H. Budi Santoso, M.Pd.',
      alamat: 'Jl. Jenderal Gatot Subroto Kav. 40-41, Jakarta Selatan',
      telepon: '(021) 39504027',
    },
  })

  const dinkes = await client.perangkatDaerah.create({
    data: {
      kodeSkpd: '1.02.01.01',
      nama: 'Dinas Kesehatan',
      singkatan: 'DINKES',
      kepalaDinas: 'drg. Siti Rahmawati, M.Kes.',
      alamat: 'Jl. Kesehatan No. 10, Petojo Selatan, Jakarta Pusat',
      telepon: '(021) 3440751',
    },
  })

  const pupr = await client.perangkatDaerah.create({
    data: {
      kodeSkpd: '1.03.01.01',
      nama: 'Dinas Pekerjaan Umum dan Penataan Ruang',
      singkatan: 'PUPR',
      kepalaDinas: 'Ir. Hendra Wijaya, M.T.',
      alamat: 'Jl. Taman Jatibaru No. 1, Cideng, Jakarta Pusat',
      telepon: '(021) 3844382',
    },
  })

  // 2. Pegawai Negeri Sipil (PNS)
  const agus = await client.pegawai.create({
    data: {
      nip: '197804122003121004',
      nama: 'Drs. Agus Darmawan, M.Si.',
      jabatan: 'Kepala Bidang Sarana dan Prasarana Pendidikan',
      golongan: 'IV/b',
      pangkat: 'Pembina Tingkat I',
      noHp: '081288901122',
      email: 'agus.darmawan@jakarta.go.id',
      perangkatDaerahId: disdik.id,
    },
  })

  const ratna = await client.pegawai.create({
    data: {
      nip: '198509232010012011',
      nama: 'Ratna Kusuma Dewi, S.E.',
      jabatan: 'Kepala Subbagian Umum dan Kepegawaian',
      golongan: 'III/d',
      pangkat: 'Penata Tingkat I',
      noHp: '081311445566',
      email: 'ratna.kusuma@jakarta.go.id',
      perangkatDaerahId: disdik.id,
    },
  })

  const farhan = await client.pegawai.create({
    data: {
      nip: '198102152006041008',
      nama: 'dr. Farhan Pratama, M.K.M.',
      jabatan: 'Kepala Bidang Pelayanan Kesehatan',
      golongan: 'IV/a',
      pangkat: 'Pembina',
      noHp: '081190223344',
      email: 'farhan.pratama@jakarta.go.id',
      perangkatDaerahId: dinkes.id,
    },
  })

  const nadia = await client.pegawai.create({
    data: {
      nip: '199006172015032005',
      nama: 'Nadia Kartika, S.K.M.',
      jabatan: 'Pengurus Barang Pengguna',
      golongan: 'III/b',
      pangkat: 'Penata Muda Tingkat I',
      noHp: '085677889900',
      email: 'nadia.kartika@jakarta.go.id',
      perangkatDaerahId: dinkes.id,
    },
  })

  const dimas = await client.pegawai.create({
    data: {
      nip: '197911032005011009',
      nama: 'Ir. Dimas Nugroho, S.T., M.T.',
      jabatan: 'Kepala Seksi Pengawasan Infrastruktur Jalan',
      golongan: 'III/d',
      pangkat: 'Penata Tingkat I',
      noHp: '081234567890',
      email: 'dimas.nugroho@jakarta.go.id',
      perangkatDaerahId: pupr.id,
    },
  })

  const rizky = await client.pegawai.create({
    data: {
      nip: '199203282019031003',
      nama: 'Rizky Maulana, A.Md.T.',
      jabatan: 'Pengawas Lapangan Penataan Ruang',
      golongan: 'II/d',
      pangkat: 'Pengatur Tingkat I',
      noHp: '082144559988',
      email: 'rizky.maulana@jakarta.go.id',
      perangkatDaerahId: pupr.id,
    },
  })

  // 3. Kendaraan Dinas Operasional (KDO)
  const k1 = await client.kendaraanDinas.create({
    data: {
      nomorPolisi: 'B 1042 PQA',
      kodeBarang: '1.3.2.02.01.02.003-0001',
      merek: 'Toyota',
      tipeModel: 'Kijang Innova Zenix 2.0 G',
      jenis: 'RODA_4',
      tahunProduksi: 2024,
      warna: 'Hitam Metalik',
      nomorRangka: 'MHFAB1EM5R0012345',
      nomorMesin: 'M20A-1988421',
      kondisi: 'BAIK',
      lokasiParkir: 'Basement Gedung Dinas Pendidikan, Gatot Subroto',
      keterangan: 'Digunakan untuk monitoring sekolah wilayah Jakarta Selatan dan Timur.',
      fotos: '[]',
      pajakTahunanJatuhTempo: '2027-06-15',
      pajakLimaTahunanJatuhTempo: '2029-06-15',
      perangkatDaerahId: disdik.id,
      pegawaiId: agus.id,
    },
  })

  const k2 = await client.kendaraanDinas.create({
    data: {
      nomorPolisi: 'B 2189 PQH',
      kodeBarang: '1.3.2.02.01.02.003-0008',
      merek: 'Toyota',
      tipeModel: 'Avanza 1.5 G',
      jenis: 'RODA_4',
      tahunProduksi: 2021,
      warna: 'Putih',
      nomorRangka: 'MHKM5EA3JMK044812',
      nomorMesin: '2NR-F819201',
      kondisi: 'BAIK',
      lokasiParkir: 'Halaman Parkir Sektor Umum Dinas Pendidikan',
      keterangan: 'Operasional tata usaha dan distribusi dokumen kepegawaian.',
      fotos: '[]',
      pajakTahunanJatuhTempo: '2026-11-29',
      pajakLimaTahunanJatuhTempo: '2026-11-29',
      perangkatDaerahId: disdik.id,
      pegawaiId: ratna.id,
    },
  })

  const k3 = await client.kendaraanDinas.create({
    data: {
      nomorPolisi: 'B 3411 PQW',
      kodeBarang: '1.3.2.02.01.04.001-0014',
      merek: 'Honda',
      tipeModel: 'Vario 160 CBS',
      jenis: 'RODA_2',
      tahunProduksi: 2022,
      warna: 'Hitam Doff',
      nomorRangka: 'MH1KF8112NK088123',
      nomorMesin: 'KF81E-1088123',
      kondisi: 'RUSAK_RINGAN',
      lokasiParkir: 'Pool Kendaraan Dinas Pendidikan (Garasi Timur)',
      keterangan: 'Kampas rem depan dan ban belakang perlu penggantian berkala.',
      fotos: '[]',
      pajakTahunanJatuhTempo: '2027-02-18',
      pajakLimaTahunanJatuhTempo: '2027-02-18',
      perangkatDaerahId: disdik.id,
      pegawaiId: null,
    },
  })

  await client.kendaraanDinas.create({
    data: {
      nomorPolisi: 'B 1175 PQB',
      kodeBarang: '1.3.2.02.01.02.002-0003',
      merek: 'Mitsubishi',
      tipeModel: 'Pajero Sport Dakar 4x2',
      jenis: 'RODA_4',
      tahunProduksi: 2023,
      warna: 'Putih Mutiara',
      nomorRangka: 'MMBGUKR10PH019283',
      nomorMesin: '4N15-UJH9921',
      kondisi: 'BAIK',
      lokasiParkir: 'Gedung Parkir Dinas Kesehatan, Petojo Selatan',
      keterangan: 'Unit operasional inspeksi fasilitas layanan kesehatan dan puskesmas.',
      fotos: '[]',
      pajakTahunanJatuhTempo: '2026-12-08',
      pajakLimaTahunanJatuhTempo: '2028-12-08',
      perangkatDaerahId: dinkes.id,
      pegawaiId: farhan.id,
    },
  })

  const k5 = await client.kendaraanDinas.create({
    data: {
      nomorPolisi: 'B 9024 PQX',
      kodeBarang: '1.3.2.02.01.03.005-0002',
      merek: 'Suzuki',
      tipeModel: 'APV Arena GX Ambulans',
      jenis: 'KHUSUS',
      tahunProduksi: 2018,
      warna: 'Putih',
      nomorRangka: 'MHYESL415JJ511209',
      nomorMesin: 'G15A-ID88712',
      kondisi: 'RUSAK_RINGAN',
      lokasiParkir: 'Bengkel Rekanan AC & Ambulans Dinkes, Jakarta Pusat',
      keterangan: 'Kompresor AC kabin belakang kurang dingin, sedang diajukan servis.',
      fotos: '[]',
      pajakTahunanJatuhTempo: '2026-10-30',
      pajakLimaTahunanJatuhTempo: '2028-10-30',
      perangkatDaerahId: dinkes.id,
      pegawaiId: nadia.id,
    },
  })

  const k6 = await client.kendaraanDinas.create({
    data: {
      nomorPolisi: 'B 8821 PQM',
      kodeBarang: '1.3.2.02.01.02.003-0021',
      merek: 'Toyota',
      tipeModel: 'Hilux Double Cabin 4x4',
      jenis: 'KHUSUS',
      tahunProduksi: 2022,
      warna: 'Abu-abu Metalik',
      nomorRangka: 'MROFB8CD0N0992817',
      nomorMesin: '2GD-FTV99281',
      kondisi: 'BAIK',
      lokasiParkir: 'Pool Lapangan Dinas PUPR, Taman Jatibaru',
      keterangan: 'Kendaraan survei lapangan proyek jalan dan drainase.',
      fotos: '[]',
      pajakTahunanJatuhTempo: '2027-04-20',
      pajakLimaTahunanJatuhTempo: '2027-04-20',
      perangkatDaerahId: pupr.id,
      pegawaiId: dimas.id,
    },
  })

  await client.kendaraanDinas.create({
    data: {
      nomorPolisi: 'B 4510 PQP',
      kodeBarang: '1.3.2.02.01.04.001-0029',
      merek: 'Yamaha',
      tipeModel: 'WR 155 R',
      jenis: 'RODA_2',
      tahunProduksi: 2023,
      warna: 'Biru',
      nomorRangka: 'MH3DG3710PK004412',
      nomorMesin: 'G3N1E-004412',
      kondisi: 'BAIK',
      lokasiParkir: 'Dibawa PNS Penanggung Jawab (Unit Lapangan PUPR)',
      keterangan: 'Patroli dan peninjauan titik penataan ruang wilayah sempit.',
      fotos: '[]',
      pajakTahunanJatuhTempo: '2027-08-12',
      pajakLimaTahunanJatuhTempo: '2028-08-12',
      perangkatDaerahId: pupr.id,
      pegawaiId: rizky.id,
    },
  })

  const k8 = await client.kendaraanDinas.create({
    data: {
      nomorPolisi: 'B 9412 PQT',
      kodeBarang: '1.3.2.02.01.03.001-0006',
      merek: 'Isuzu',
      tipeModel: 'ELF NMR 71 Dump Truck',
      jenis: 'KHUSUS',
      tahunProduksi: 2015,
      warna: 'Kuning',
      nomorRangka: 'MHCNMR71HFJ003910',
      nomorMesin: '4HG1-T003910',
      kondisi: 'RUSAK_BERAT',
      lokasiParkir: 'Gudang Pool Alat Berat PUPR Cakung (Area Aset Tidak Aktif)',
      keterangan: 'Kerusakan transmisi dan sistem hidrolik bak; diusulkan penghapusan BMD.',
      fotos: '[]',
      pajakTahunanJatuhTempo: '2026-11-22',
      pajakLimaTahunanJatuhTempo: '2026-11-22',
      perangkatDaerahId: pupr.id,
      pegawaiId: null,
    },
  })

  // 4. Riwayat Kendaraan
  await client.riwayatKendaraan.createMany({
    data: [
      {
        kendaraanId: k1.id,
        pegawaiId: agus.id,
        pegawaiNamaSnapshot: agus.nama,
        perangkatDaerahId: disdik.id,
        perangkatDaerahNamaSnapshot: disdik.nama,
        jenisPerubahan: 'PENDAFTARAN',
        kondisiSaatItu: 'BAIK',
        nomorBast: 'BAST/DISDIK/012/2026',
        catatan: 'Pencatatan awal KDO dan serah terima pemakaian ke Kabid Sarpras.',
        tanggal: new Date('2026-01-15T10:00:00.000Z'),
      },
      {
        kendaraanId: k3.id,
        pegawaiId: null,
        pegawaiNamaSnapshot: null,
        perangkatDaerahId: disdik.id,
        perangkatDaerahNamaSnapshot: disdik.nama,
        jenisPerubahan: 'KONDISI',
        kondisiSaatItu: 'RUSAK_RINGAN',
        nomorBast: 'LHP/DISDIK/041/2026',
        catatan: 'Unit dikembalikan ke pool dinas; dilaporkan perlu penggantian kampas rem dan ban.',
        tanggal: new Date('2026-03-05T14:20:00.000Z'),
      },
      {
        kendaraanId: k5.id,
        pegawaiId: nadia.id,
        pegawaiNamaSnapshot: nadia.nama,
        perangkatDaerahId: dinkes.id,
        perangkatDaerahNamaSnapshot: dinkes.nama,
        jenisPerubahan: 'KONDISI',
        kondisiSaatItu: 'RUSAK_RINGAN',
        nomorBast: 'BAP/DINKES/019/2026',
        catatan: 'Pembaruan hasil cek fisik triwulan: AC kabin belakang memerlukan perbaikan.',
        tanggal: new Date('2026-02-20T15:10:00.000Z'),
      },
      {
        kendaraanId: k8.id,
        pegawaiId: null,
        pegawaiNamaSnapshot: null,
        perangkatDaerahId: pupr.id,
        perangkatDaerahNamaSnapshot: pupr.nama,
        jenisPerubahan: 'KONDISI',
        kondisiSaatItu: 'RUSAK_BERAT',
        nomorBast: 'BAP/PUPR/008/2026',
        catatan: 'Dinyatakan rusak berat oleh tim pemeriksa barang dan ditarik ke pool.',
        tanggal: new Date('2026-03-01T11:00:00.000Z'),
      },
    ],
  })

  // 5. Servis & Pemeliharaan
  await client.servisKendaraan.createMany({
    data: [
      {
        kendaraanId: k1.id,
        tanggalServis: '2026-09-18',
        jenisServis: 'SERVIS_RUTIN',
        status: 'SELESAI',
        bengkel: 'Auto2000 Gatot Subroto',
        kilometer: 18450,
        biaya: 1850000,
        servisBerikutnyaTanggal: '2027-03-18',
        deskripsi: 'Servis berkala 20.000 km: ganti oli mesin, filter oli, balancing & spooring.',
      },
      {
        kendaraanId: k5.id,
        tanggalServis: '2026-11-10',
        jenisServis: 'PERBAIKAN',
        status: 'DALAM_PERBAIKAN',
        bengkel: 'Bengkel Resmi Suzuki Pramuka',
        kilometer: 74200,
        biaya: 3400000,
        servisBerikutnyaTanggal: null,
        deskripsi: 'Perbaikan kompresor AC kabin ambulans belakang dan isi ulang freon.',
      },
      {
        kendaraanId: k3.id,
        tanggalServis: '2026-11-20',
        jenisServis: 'GANTI_BAN_AKI',
        status: 'TERJADWAL',
        bengkel: 'AHASS Kemang Raya',
        kilometer: 29100,
        biaya: 780000,
        servisBerikutnyaTanggal: '2027-05-20',
        deskripsi: 'Penjadwalan penggantian kampas rem depan dan ban belakang.',
      },
      {
        kendaraanId: k6.id,
        tanggalServis: '2026-10-12',
        jenisServis: 'UJI_KIR',
        status: 'SELESAI',
        bengkel: 'UP PKB Ujung Menteng (Dishub DKI)',
        kilometer: 51800,
        biaya: 450000,
        servisBerikutnyaTanggal: '2027-04-12',
        deskripsi: 'Pengujian berkala kendaraan operasional 6 bulanan + cek emisi diesel.',
      },
    ],
  })

  // 6. Peminjaman Kendaraan Dinas
  await client.peminjamanKendaraan.createMany({
    data: [
      {
        kendaraanId: k2.id,
        peminjamPegawaiId: ratna.id,
        peminjamNama: ratna.nama,
        peminjamInstansi: 'Dinas Pendidikan (Subbag Umum & Kepegawaian)',
        tujuanKeperluan:
          'Pengantaran SK kenaikan pangkat dan verifikasi berkas kepegawaian Suku Dinas.',
        lokasiTujuan: 'Kantor Sudin Pendidikan Wilayah I & II Jakarta Selatan',
        tanggalPinjam: '2026-11-13',
        tanggalKembaliRencana: '2026-11-16',
        tanggalKembaliAktual: null,
        status: 'DIPINJAM',
        nomorSuratTugas: 'ST/DISDIK/214/XI/2026',
        kilometerAwal: 31420,
        kilometerAkhir: null,
        kondisiSaatKembali: null,
        catatan: 'Unit kondisi baik dan tangki BBM penuh saat serah terima kunci.',
      },
      {
        kendaraanId: k6.id,
        peminjamPegawaiId: dimas.id,
        peminjamNama: dimas.nama,
        peminjamInstansi: 'Dinas PUPR (Bidang Jalan & Jembatan)',
        tujuanKeperluan:
          'Peninjauan lapangan pengerjaan drainase dan perbaikan jalan arteri.',
        lokasiTujuan: 'Koridor Jalan Daan Mogot & Cengkareng, Jakarta Barat',
        tanggalPinjam: '2026-11-18',
        tanggalKembaliRencana: '2026-11-19',
        tanggalKembaliAktual: null,
        status: 'TERJADWAL',
        nomorSuratTugas: 'SPPD/PUPR/089/XI/2026',
        kilometerAwal: null,
        kilometerAkhir: null,
        kondisiSaatKembali: null,
        catatan: 'Booking terjadwal untuk survei tim teknis PUPR.',
      },
      {
        kendaraanId: k1.id,
        peminjamPegawaiId: agus.id,
        peminjamNama: agus.nama,
        peminjamInstansi: 'Dinas Pendidikan (Bidang Sarana & Prasarana)',
        tujuanKeperluan:
          'Monitoring progres rehabilitasi gedung SDN Jakarta Timur.',
        lokasiTujuan: 'Kecamatan Duren Sawit & Jatinegara',
        tanggalPinjam: '2026-11-05',
        tanggalKembaliRencana: '2026-11-06',
        tanggalKembaliAktual: '2026-11-06',
        status: 'SELESAI',
        nomorSuratTugas: 'ST/DISDIK/198/XI/2026',
        kilometerAwal: 18610,
        kilometerAkhir: 18705,
        kondisiSaatKembali: 'BAIK',
        catatan:
          'Dikembalikan tepat waktu dalam kondisi bersih dan laik jalan.',
      },
    ],
  })

  // 7. Role & Hak Akses Dinamis (RBAC)
  await client.roleDefinition.createMany({
    data: [
      {
        code: 'ADMIN_BPAD',
        name: 'Admin BPAD',
        description:
          'Akses penuh ke seluruh halaman inventaris KDO, peminjaman, servis, dokumen, PNS, SKPD, user, dan role.',
        isSystem: true,
        permissions: JSON.stringify({
          dashboard: { read: true, create: false, update: false, delete: false },
          kendaraan: { read: true, create: true, update: true, delete: true },
          peminjaman: { read: true, create: true, update: true, delete: true },
          servis: { read: true, create: true, update: true, delete: true },
          pajakDokumen: { read: true, create: false, update: false, delete: false },
          pegawai: { read: true, create: true, update: true, delete: true },
          perangkatDaerah: { read: true, create: true, update: true, delete: true },
          users: { read: true, create: true, update: true, delete: true },
          roles: { read: true, create: true, update: true, delete: true },
        }),
      },
      {
        code: 'OPERATOR_SKPD',
        name: 'Operator SKPD',
        description:
          'Mengelola data kendaraan dinas, peminjaman unit, riwayat servis, PNS penanggung jawab, dan profil Perangkat Daerah.',
        isSystem: true,
        permissions: JSON.stringify({
          dashboard: { read: true, create: false, update: false, delete: false },
          kendaraan: { read: true, create: true, update: true, delete: true },
          peminjaman: { read: true, create: true, update: true, delete: true },
          servis: { read: true, create: true, update: true, delete: true },
          pajakDokumen: { read: true, create: false, update: false, delete: false },
          pegawai: { read: true, create: true, update: true, delete: true },
          perangkatDaerah: { read: true, create: true, update: true, delete: false },
          users: { read: false, create: false, update: false, delete: false },
          roles: { read: false, create: false, update: false, delete: false },
        }),
      },
      {
        code: 'VIEWER',
        name: 'Pemantau / Auditor',
        description:
          'Akses lihat-saja (read-only) untuk memantau aset KDO, peminjaman, servis, pajak, PNS, dan SKPD tanpa mengubah data.',
        isSystem: true,
        permissions: JSON.stringify({
          dashboard: { read: true, create: false, update: false, delete: false },
          kendaraan: { read: true, create: false, update: false, delete: false },
          peminjaman: { read: true, create: false, update: false, delete: false },
          servis: { read: true, create: false, update: false, delete: false },
          pajakDokumen: { read: true, create: false, update: false, delete: false },
          pegawai: { read: true, create: false, update: false, delete: false },
          perangkatDaerah: { read: true, create: false, update: false, delete: false },
          users: { read: false, create: false, update: false, delete: false },
          roles: { read: false, create: false, update: false, delete: false },
        }),
      },
    ],
  })

  // 8. Users (password terenkripsi bcrypt)
  const [adminHash, operatorHash, auditorHash] = await Promise.all([
    bcrypt.hash('admin123', 10),
    bcrypt.hash('operator123', 10),
    bcrypt.hash('auditor123', 10),
  ])

  await client.appUser.createMany({
    data: [
      {
        username: 'admin.bpad',
        nama: 'Administrator Pengelola BMD',
        email: 'admin@bpad.jakarta.go.id',
        passwordHash: adminHash,
        role: 'ADMIN_BPAD',
        perangkatDaerahId: null,
        aktif: true,
      },
      {
        username: 'operator.disdik',
        nama: 'Operator Pengurus Barang Disdik',
        email: 'operator.disdik@jakarta.go.id',
        passwordHash: operatorHash,
        role: 'OPERATOR_SKPD',
        perangkatDaerahId: disdik.id,
        aktif: true,
      },
      {
        username: 'auditor.bmd',
        nama: 'Tim Pemeriksa Aset Daerah',
        email: 'auditor@bpad.jakarta.go.id',
        passwordHash: auditorHash,
        role: 'VIEWER',
        perangkatDaerahId: null,
        aktif: true,
      },
    ],
  })
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seed database SI-KDO BMD berhasil dijalankan.')
    })
    .catch((err) => {
      console.error('Gagal melakukan seeding database:', err)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
