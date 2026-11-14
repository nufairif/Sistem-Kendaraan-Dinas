PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE "AppUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "perangkatDaerahId" INTEGER,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AppUser_role_fkey" FOREIGN KEY ("role") REFERENCES "RoleDefinition" ("code") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AppUser_perangkatDaerahId_fkey" FOREIGN KEY ("perangkatDaerahId") REFERENCES "PerangkatDaerah" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "AppUser" VALUES(1,'admin.bpad','Administrator Pengelola BMD','admin@bpad.jakarta.go.id','$2b$10$Gu1tsm/GEQfy0V2EPAx3E.TuGgz8NcgpDAfblw/0TXH1Xz4WRJbka','ADMIN_BPAD',NULL,1,1794635342533,1794635342533);
INSERT INTO "AppUser" VALUES(2,'operator.disdik','Operator Pengurus Barang Disdik','operator.disdik@jakarta.go.id','$2b$10$cOu9Dn.wJeffO7sv6U.mhenf1Jwe4mVyjANPz.bHyfHCUtgHWuYh6','OPERATOR_SKPD',1,1,1794635342533,1794635342533);
INSERT INTO "AppUser" VALUES(3,'auditor.bmd','Tim Pemeriksa Aset Daerah','auditor@bpad.jakarta.go.id','$2b$10$zk4c/DV6yezG3T5cyGUBwuW7ggoexJlzNiuuGlFIT9ukWZTi97Gg2','VIEWER',NULL,1,1794635342533,1794635342533);
CREATE TABLE "KendaraanDinas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nomorPolisi" TEXT NOT NULL,
    "kodeBarang" TEXT NOT NULL DEFAULT '',
    "merek" TEXT NOT NULL,
    "tipeModel" TEXT NOT NULL,
    "jenis" TEXT NOT NULL,
    "tahunProduksi" INTEGER NOT NULL,
    "warna" TEXT NOT NULL,
    "nomorRangka" TEXT NOT NULL DEFAULT '',
    "nomorMesin" TEXT NOT NULL DEFAULT '',
    "kondisi" TEXT NOT NULL,
    "lokasiParkir" TEXT NOT NULL DEFAULT '',
    "keterangan" TEXT NOT NULL DEFAULT '',
    "fotos" TEXT NOT NULL DEFAULT '[]',
    "dokumenStnk" TEXT,
    "dokumenBpkb" TEXT,
    "pajakTahunanJatuhTempo" TEXT,
    "pajakLimaTahunanJatuhTempo" TEXT,
    "perangkatDaerahId" INTEGER NOT NULL,
    "pegawaiId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KendaraanDinas_perangkatDaerahId_fkey" FOREIGN KEY ("perangkatDaerahId") REFERENCES "PerangkatDaerah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "KendaraanDinas_pegawaiId_fkey" FOREIGN KEY ("pegawaiId") REFERENCES "Pegawai" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "KendaraanDinas" VALUES(1,'B 1042 PQA','1.3.2.02.01.02.003-0001','Toyota','Kijang Innova Zenix 2.0 G','RODA_4',2024,'Hitam Metalik','MHFAB1EM5R0012345','M20A-1988421','BAIK','Basement Gedung Dinas Pendidikan, Gatot Subroto','Digunakan untuk monitoring sekolah wilayah Jakarta Selatan dan Timur.','[]',NULL,NULL,'2027-06-15','2029-06-15',1,1,1794635342218,1794635342218);
INSERT INTO "KendaraanDinas" VALUES(2,'B 2189 PQH','1.3.2.02.01.02.003-0008','Toyota','Avanza 1.5 G','RODA_4',2021,'Putih','MHKM5EA3JMK044812','2NR-F819201','BAIK','Halaman Parkir Sektor Umum Dinas Pendidikan','Operasional tata usaha dan distribusi dokumen kepegawaian.','[]',NULL,NULL,'2026-11-29','2026-11-29',1,2,1794635342228,1794635342228);
INSERT INTO "KendaraanDinas" VALUES(3,'B 3411 PQW','1.3.2.02.01.04.001-0014','Honda','Vario 160 CBS','RODA_2',2022,'Hitam Doff','MH1KF8112NK088123','KF81E-1088123','RUSAK_RINGAN','Pool Kendaraan Dinas Pendidikan (Garasi Timur)','Kampas rem depan dan ban belakang perlu penggantian berkala.','[]',NULL,NULL,'2027-02-18','2027-02-18',1,NULL,1794635342237,1794635342237);
INSERT INTO "KendaraanDinas" VALUES(4,'B 1175 PQB','1.3.2.02.01.02.002-0003','Mitsubishi','Pajero Sport Dakar 4x2','RODA_4',2023,'Putih Mutiara','MMBGUKR10PH019283','4N15-UJH9921','BAIK','Gedung Parkir Dinas Kesehatan, Petojo Selatan','Unit operasional inspeksi fasilitas layanan kesehatan dan puskesmas.','[]',NULL,NULL,'2026-12-08','2028-12-08',2,3,1794635342247,1794635342247);
INSERT INTO "KendaraanDinas" VALUES(5,'B 9024 PQX','1.3.2.02.01.03.005-0002','Suzuki','APV Arena GX Ambulans','KHUSUS',2018,'Putih','MHYESL415JJ511209','G15A-ID88712','RUSAK_RINGAN','Bengkel Rekanan AC & Ambulans Dinkes, Jakarta Pusat','Kompresor AC kabin belakang kurang dingin, sedang diajukan servis.','[]',NULL,NULL,'2026-10-30','2028-10-30',2,4,1794635342271,1794635342271);
INSERT INTO "KendaraanDinas" VALUES(6,'B 8821 PQM','1.3.2.02.01.02.003-0021','Toyota','Hilux Double Cabin 4x4','KHUSUS',2022,'Abu-abu Metalik','MROFB8CD0N0992817','2GD-FTV99281','BAIK','Pool Lapangan Dinas PUPR, Taman Jatibaru','Kendaraan survei lapangan proyek jalan dan drainase.','[]',NULL,NULL,'2027-04-20','2027-04-20',3,5,1794635342281,1794635342281);
INSERT INTO "KendaraanDinas" VALUES(7,'B 4510 PQP','1.3.2.02.01.04.001-0029','Yamaha','WR 155 R','RODA_2',2023,'Biru','MH3DG3710PK004412','G3N1E-004412','BAIK','Dibawa PNS Penanggung Jawab (Unit Lapangan PUPR)','Patroli dan peninjauan titik penataan ruang wilayah sempit.','[]',NULL,NULL,'2027-08-12','2028-08-12',3,6,1794635342290,1794635342290);
INSERT INTO "KendaraanDinas" VALUES(8,'B 9412 PQT','1.3.2.02.01.03.001-0006','Isuzu','ELF NMR 71 Dump Truck','KHUSUS',2015,'Kuning','MHCNMR71HFJ003910','4HG1-T003910','RUSAK_BERAT','Gudang Pool Alat Berat PUPR Cakung (Area Aset Tidak Aktif)','Kerusakan transmisi dan sistem hidrolik bak; diusulkan penghapusan BMD.','[]',NULL,NULL,'2026-11-22','2026-11-22',3,NULL,1794635342300,1794635342300);
CREATE TABLE "Pegawai" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nip" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "jabatan" TEXT NOT NULL,
    "golongan" TEXT NOT NULL,
    "pangkat" TEXT NOT NULL DEFAULT '',
    "noHp" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "perangkatDaerahId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pegawai_perangkatDaerahId_fkey" FOREIGN KEY ("perangkatDaerahId") REFERENCES "PerangkatDaerah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "Pegawai" VALUES(1,'197804122003121004','Drs. Agus Darmawan, M.Si.','Kepala Bidang Sarana dan Prasarana Pendidikan','IV/b','Pembina Tingkat I','081288901122','agus.darmawan@jakarta.go.id',1,1794635342162,1794635342162);
INSERT INTO "Pegawai" VALUES(2,'198509232010012011','Ratna Kusuma Dewi, S.E.','Kepala Subbagian Umum dan Kepegawaian','III/d','Penata Tingkat I','081311445566','ratna.kusuma@jakarta.go.id',1,1794635342171,1794635342171);
INSERT INTO "Pegawai" VALUES(3,'198102152006041008','dr. Farhan Pratama, M.K.M.','Kepala Bidang Pelayanan Kesehatan','IV/a','Pembina','081190223344','farhan.pratama@jakarta.go.id',2,1794635342181,1794635342181);
INSERT INTO "Pegawai" VALUES(4,'199006172015032005','Nadia Kartika, S.K.M.','Pengurus Barang Pengguna','III/b','Penata Muda Tingkat I','085677889900','nadia.kartika@jakarta.go.id',2,1794635342190,1794635342190);
INSERT INTO "Pegawai" VALUES(5,'197911032005011009','Ir. Dimas Nugroho, S.T., M.T.','Kepala Seksi Pengawasan Infrastruktur Jalan','III/d','Penata Tingkat I','081234567890','dimas.nugroho@jakarta.go.id',3,1794635342199,1794635342199);
INSERT INTO "Pegawai" VALUES(6,'199203282019031003','Rizky Maulana, A.Md.T.','Pengawas Lapangan Penataan Ruang','II/d','Pengatur Tingkat I','082144559988','rizky.maulana@jakarta.go.id',3,1794635342208,1794635342208);
CREATE TABLE "PeminjamanKendaraan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kendaraanId" INTEGER NOT NULL,
    "peminjamPegawaiId" INTEGER,
    "peminjamNama" TEXT NOT NULL,
    "peminjamInstansi" TEXT NOT NULL DEFAULT '',
    "tujuanKeperluan" TEXT NOT NULL,
    "lokasiTujuan" TEXT NOT NULL DEFAULT '',
    "tanggalPinjam" TEXT NOT NULL,
    "tanggalKembaliRencana" TEXT NOT NULL,
    "tanggalKembaliAktual" TEXT,
    "status" TEXT NOT NULL,
    "nomorSuratTugas" TEXT NOT NULL DEFAULT '',
    "kilometerAwal" INTEGER,
    "kilometerAkhir" INTEGER,
    "kondisiSaatKembali" TEXT,
    "catatan" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PeminjamanKendaraan_kendaraanId_fkey" FOREIGN KEY ("kendaraanId") REFERENCES "KendaraanDinas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PeminjamanKendaraan_peminjamPegawaiId_fkey" FOREIGN KEY ("peminjamPegawaiId") REFERENCES "Pegawai" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "PeminjamanKendaraan" VALUES(1,2,2,'Ratna Kusuma Dewi, S.E.','Dinas Pendidikan (Subbag Umum & Kepegawaian)','Pengantaran SK kenaikan pangkat dan verifikasi berkas kepegawaian Suku Dinas.','Kantor Sudin Pendidikan Wilayah I & II Jakarta Selatan','2026-11-13','2026-11-16',NULL,'DIPINJAM','ST/DISDIK/214/XI/2026',31420,NULL,NULL,'Unit kondisi baik dan tangki BBM penuh saat serah terima kunci.',1794635342329,1794635342329);
INSERT INTO "PeminjamanKendaraan" VALUES(2,6,5,'Ir. Dimas Nugroho, S.T., M.T.','Dinas PUPR (Bidang Jalan & Jembatan)','Peninjauan lapangan pengerjaan drainase dan perbaikan jalan arteri.','Koridor Jalan Daan Mogot & Cengkareng, Jakarta Barat','2026-11-18','2026-11-19',NULL,'TERJADWAL','SPPD/PUPR/089/XI/2026',NULL,NULL,NULL,'Booking terjadwal untuk survei tim teknis PUPR.',1794635342329,1794635342329);
INSERT INTO "PeminjamanKendaraan" VALUES(3,1,1,'Drs. Agus Darmawan, M.Si.','Dinas Pendidikan (Bidang Sarana & Prasarana)','Monitoring progres rehabilitasi gedung SDN Jakarta Timur.','Kecamatan Duren Sawit & Jatinegara','2026-11-05','2026-11-06','2026-11-06','SELESAI','ST/DISDIK/198/XI/2026',18610,18705,'BAIK','Dikembalikan tepat waktu dalam kondisi bersih dan laik jalan.',1794635342329,1794635342329);
CREATE TABLE "PerangkatDaerah" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kodeSkpd" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "singkatan" TEXT NOT NULL,
    "kepalaDinas" TEXT NOT NULL DEFAULT '',
    "alamat" TEXT NOT NULL DEFAULT '',
    "telepon" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "PerangkatDaerah" VALUES(1,'1.01.01.01','Dinas Pendidikan','DISDIK','Dr. H. Budi Santoso, M.Pd.','Jl. Jenderal Gatot Subroto Kav. 40-41, Jakarta Selatan','(021) 39504027',1794635342134,1794635342134);
INSERT INTO "PerangkatDaerah" VALUES(2,'1.02.01.01','Dinas Kesehatan','DINKES','drg. Siti Rahmawati, M.Kes.','Jl. Kesehatan No. 10, Petojo Selatan, Jakarta Pusat','(021) 3440751',1794635342144,1794635342144);
INSERT INTO "PerangkatDaerah" VALUES(3,'1.03.01.01','Dinas Pekerjaan Umum dan Penataan Ruang','PUPR','Ir. Hendra Wijaya, M.T.','Jl. Taman Jatibaru No. 1, Cideng, Jakarta Pusat','(021) 3844382',1794635342153,1794635342153);
CREATE TABLE "RiwayatKendaraan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kendaraanId" INTEGER NOT NULL,
    "pegawaiId" INTEGER,
    "pegawaiNamaSnapshot" TEXT,
    "perangkatDaerahId" INTEGER NOT NULL,
    "perangkatDaerahNamaSnapshot" TEXT NOT NULL,
    "jenisPerubahan" TEXT NOT NULL,
    "kondisiSaatItu" TEXT NOT NULL,
    "nomorBast" TEXT NOT NULL DEFAULT '-',
    "catatan" TEXT NOT NULL DEFAULT '',
    "tanggal" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RiwayatKendaraan_kendaraanId_fkey" FOREIGN KEY ("kendaraanId") REFERENCES "KendaraanDinas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RiwayatKendaraan_pegawaiId_fkey" FOREIGN KEY ("pegawaiId") REFERENCES "Pegawai" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RiwayatKendaraan_perangkatDaerahId_fkey" FOREIGN KEY ("perangkatDaerahId") REFERENCES "PerangkatDaerah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "RiwayatKendaraan" VALUES(1,1,1,'Drs. Agus Darmawan, M.Si.',1,'Dinas Pendidikan','PENDAFTARAN','BAIK','BAST/DISDIK/012/2026','Pencatatan awal KDO dan serah terima pemakaian ke Kabid Sarpras.',1768471200000);
INSERT INTO "RiwayatKendaraan" VALUES(2,3,NULL,NULL,1,'Dinas Pendidikan','KONDISI','RUSAK_RINGAN','LHP/DISDIK/041/2026','Unit dikembalikan ke pool dinas; dilaporkan perlu penggantian kampas rem dan ban.',1772720400000);
INSERT INTO "RiwayatKendaraan" VALUES(3,5,4,'Nadia Kartika, S.K.M.',2,'Dinas Kesehatan','KONDISI','RUSAK_RINGAN','BAP/DINKES/019/2026','Pembaruan hasil cek fisik triwulan: AC kabin belakang memerlukan perbaikan.',1771600200000);
INSERT INTO "RiwayatKendaraan" VALUES(4,8,NULL,NULL,3,'Dinas Pekerjaan Umum dan Penataan Ruang','KONDISI','RUSAK_BERAT','BAP/PUPR/008/2026','Dinyatakan rusak berat oleh tim pemeriksa barang dan ditarik ke pool.',1772362800000);
CREATE TABLE "RoleDefinition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "permissions" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "RoleDefinition" VALUES(1,'ADMIN_BPAD','Admin BPAD','Akses penuh ke seluruh halaman inventaris KDO, peminjaman, servis, dokumen, PNS, SKPD, user, dan role.',1,'{"dashboard":{"read":true,"create":false,"update":false,"delete":false},"kendaraan":{"read":true,"create":true,"update":true,"delete":true},"peminjaman":{"read":true,"create":true,"update":true,"delete":true},"servis":{"read":true,"create":true,"update":true,"delete":true},"pajakDokumen":{"read":true,"create":false,"update":false,"delete":false},"pegawai":{"read":true,"create":true,"update":true,"delete":true},"perangkatDaerah":{"read":true,"create":true,"update":true,"delete":true},"users":{"read":true,"create":true,"update":true,"delete":true},"roles":{"read":true,"create":true,"update":true,"delete":true}}',1794635342339,1794635342339);
INSERT INTO "RoleDefinition" VALUES(2,'OPERATOR_SKPD','Operator SKPD','Mengelola data kendaraan dinas, peminjaman unit, riwayat servis, PNS penanggung jawab, dan profil Perangkat Daerah.',1,'{"dashboard":{"read":true,"create":false,"update":false,"delete":false},"kendaraan":{"read":true,"create":true,"update":true,"delete":true},"peminjaman":{"read":true,"create":true,"update":true,"delete":true},"servis":{"read":true,"create":true,"update":true,"delete":true},"pajakDokumen":{"read":true,"create":false,"update":false,"delete":false},"pegawai":{"read":true,"create":true,"update":true,"delete":true},"perangkatDaerah":{"read":true,"create":true,"update":true,"delete":false},"users":{"read":false,"create":false,"update":false,"delete":false},"roles":{"read":false,"create":false,"update":false,"delete":false}}',1794635342339,1794635342339);
INSERT INTO "RoleDefinition" VALUES(3,'VIEWER','Pemantau / Auditor','Akses lihat-saja (read-only) untuk memantau aset KDO, peminjaman, servis, pajak, PNS, dan SKPD tanpa mengubah data.',1,'{"dashboard":{"read":true,"create":false,"update":false,"delete":false},"kendaraan":{"read":true,"create":false,"update":false,"delete":false},"peminjaman":{"read":true,"create":false,"update":false,"delete":false},"servis":{"read":true,"create":false,"update":false,"delete":false},"pajakDokumen":{"read":true,"create":false,"update":false,"delete":false},"pegawai":{"read":true,"create":false,"update":false,"delete":false},"perangkatDaerah":{"read":true,"create":false,"update":false,"delete":false},"users":{"read":false,"create":false,"update":false,"delete":false},"roles":{"read":false,"create":false,"update":false,"delete":false}}',1794635342339,1794635342339);
CREATE TABLE "ServisKendaraan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kendaraanId" INTEGER NOT NULL,
    "tanggalServis" TEXT NOT NULL,
    "jenisServis" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "bengkel" TEXT NOT NULL,
    "kilometer" INTEGER,
    "biaya" INTEGER NOT NULL DEFAULT 0,
    "servisBerikutnyaTanggal" TEXT,
    "deskripsi" TEXT NOT NULL,
    "buktiNota" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ServisKendaraan_kendaraanId_fkey" FOREIGN KEY ("kendaraanId") REFERENCES "KendaraanDinas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "ServisKendaraan" VALUES(1,1,'2026-09-18','SERVIS_RUTIN','SELESAI','Auto2000 Gatot Subroto',18450,1850000,'2027-03-18','Servis berkala 20.000 km: ganti oli mesin, filter oli, balancing & spooring.',NULL,1794635342318,1794635342318);
INSERT INTO "ServisKendaraan" VALUES(2,5,'2026-11-10','PERBAIKAN','DALAM_PERBAIKAN','Bengkel Resmi Suzuki Pramuka',74200,3400000,NULL,'Perbaikan kompresor AC kabin ambulans belakang dan isi ulang freon.',NULL,1794635342318,1794635342318);
INSERT INTO "ServisKendaraan" VALUES(3,3,'2026-11-20','GANTI_BAN_AKI','TERJADWAL','AHASS Kemang Raya',29100,780000,'2027-05-20','Penjadwalan penggantian kampas rem depan dan ban belakang.',NULL,1794635342318,1794635342318);
INSERT INTO "ServisKendaraan" VALUES(4,6,'2026-10-12','UJI_KIR','SELESAI','UP PKB Ujung Menteng (Dishub DKI)',51800,450000,'2027-04-12','Pengujian berkala kendaraan operasional 6 bulanan + cek emisi diesel.',NULL,1794635342318,1794635342318);
CREATE UNIQUE INDEX "PerangkatDaerah_kodeSkpd_key" ON "PerangkatDaerah"("kodeSkpd");
CREATE UNIQUE INDEX "Pegawai_nip_key" ON "Pegawai"("nip");
CREATE INDEX "Pegawai_perangkatDaerahId_idx" ON "Pegawai"("perangkatDaerahId");
CREATE UNIQUE INDEX "KendaraanDinas_nomorPolisi_key" ON "KendaraanDinas"("nomorPolisi");
CREATE INDEX "KendaraanDinas_perangkatDaerahId_idx" ON "KendaraanDinas"("perangkatDaerahId");
CREATE INDEX "KendaraanDinas_pegawaiId_idx" ON "KendaraanDinas"("pegawaiId");
CREATE INDEX "KendaraanDinas_kondisi_idx" ON "KendaraanDinas"("kondisi");
CREATE INDEX "KendaraanDinas_jenis_idx" ON "KendaraanDinas"("jenis");
CREATE INDEX "RiwayatKendaraan_kendaraanId_idx" ON "RiwayatKendaraan"("kendaraanId");
CREATE INDEX "RiwayatKendaraan_perangkatDaerahId_idx" ON "RiwayatKendaraan"("perangkatDaerahId");
CREATE INDEX "RiwayatKendaraan_tanggal_idx" ON "RiwayatKendaraan"("tanggal");
CREATE INDEX "ServisKendaraan_kendaraanId_idx" ON "ServisKendaraan"("kendaraanId");
CREATE INDEX "ServisKendaraan_status_idx" ON "ServisKendaraan"("status");
CREATE INDEX "PeminjamanKendaraan_kendaraanId_idx" ON "PeminjamanKendaraan"("kendaraanId");
CREATE INDEX "PeminjamanKendaraan_peminjamPegawaiId_idx" ON "PeminjamanKendaraan"("peminjamPegawaiId");
CREATE INDEX "PeminjamanKendaraan_status_idx" ON "PeminjamanKendaraan"("status");
CREATE INDEX "PeminjamanKendaraan_tanggalPinjam_idx" ON "PeminjamanKendaraan"("tanggalPinjam");
CREATE UNIQUE INDEX "RoleDefinition_code_key" ON "RoleDefinition"("code");
CREATE UNIQUE INDEX "AppUser_username_key" ON "AppUser"("username");
CREATE UNIQUE INDEX "AppUser_email_key" ON "AppUser"("email");
CREATE INDEX "AppUser_role_idx" ON "AppUser"("role");
CREATE INDEX "AppUser_perangkatDaerahId_idx" ON "AppUser"("perangkatDaerahId");
DELETE FROM "sqlite_sequence";
INSERT INTO "sqlite_sequence" VALUES('PerangkatDaerah',3);
INSERT INTO "sqlite_sequence" VALUES('Pegawai',6);
INSERT INTO "sqlite_sequence" VALUES('KendaraanDinas',8);
INSERT INTO "sqlite_sequence" VALUES('RiwayatKendaraan',4);
INSERT INTO "sqlite_sequence" VALUES('ServisKendaraan',4);
INSERT INTO "sqlite_sequence" VALUES('PeminjamanKendaraan',3);
INSERT INTO "sqlite_sequence" VALUES('RoleDefinition',3);
INSERT INTO "sqlite_sequence" VALUES('AppUser',3);
COMMIT;
