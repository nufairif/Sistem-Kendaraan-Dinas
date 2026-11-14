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
INSERT INTO "AppUser" VALUES(1,'admin.bpad','Super Admin Pengelola BMD','admin@bpad.jakarta.go.id','$2b$10$swuVqAUZGoe3I43/6saADOWwyzxRVHOJgp7B9qtdGCBAihaKgmOzm','ADMIN_BPAD',NULL,1,1794635939275,1794635939275);
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
INSERT INTO "RoleDefinition" VALUES(1,'ADMIN_BPAD','Super Admin','Akses penuh (Super Admin) ke seluruh modul sistem: Dashboard, KDO, Monitoring/Peminjaman, Servis, Dokumen/Pajak, PNS, Perangkat Daerah, User, dan Role.',1,'{"dashboard":{"read":true,"create":false,"update":false,"delete":false},"kendaraan":{"read":true,"create":true,"update":true,"delete":true},"peminjaman":{"read":true,"create":true,"update":true,"delete":true},"servis":{"read":true,"create":true,"update":true,"delete":true},"pajakDokumen":{"read":true,"create":false,"update":false,"delete":false},"pegawai":{"read":true,"create":true,"update":true,"delete":true},"perangkatDaerah":{"read":true,"create":true,"update":true,"delete":true},"users":{"read":true,"create":true,"update":true,"delete":true},"roles":{"read":true,"create":true,"update":true,"delete":true}}',1794635939203,1794635939203);
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
INSERT INTO "sqlite_sequence" VALUES('RoleDefinition',1);
INSERT INTO "sqlite_sequence" VALUES('AppUser',1);
COMMIT;
