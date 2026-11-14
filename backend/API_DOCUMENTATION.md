# Dokumentasi Backend REST API — SI-KDO BMD

Dokumentasi lengkap backend untuk **Sistem Pengelolaan Kendaraan Dinas Operasional (SI-KDO BMD)** pada **BPAD DKI**. Backend dibangun menggunakan **Node.js, Express, TypeScript, Prisma ORM (SQLite), Zod, JWT, dan Swagger OpenAPI 3.0.3**.

---

## Daftar Isi

1. [Arsitektur & Struktur Direktori](#1-arsitektur--struktur-direktori)
2. [Instalasi, Konfigurasi & Menjalankan Server](#2-instalasi-konfigurasi--menjalankan-server)
3. [Skema Database (SQLite + Prisma)](#3-skema-database-sqlite--prisma)
4. [Keamanan Dasar, Autentikasi & RBAC](#4-keamanan-dasar-autentikasi--rbac)
5. [Standar Format JSON & HTTP Status Code](#5-standar-format-json--http-status-code)
6. [Dokumentasi Interaktif Swagger (OpenAPI 3.0.3)](#6-dokumentasi-interaktif-swagger-openapi-303)
7. [Referensi Lengkap Endpoint REST API](#7-referensi-lengkap-endpoint-rest-api)
   - [Health](#71-health)
   - [Auth](#72-auth)
   - [Dashboard](#73-dashboard)
   - [Perangkat Daerah](#74-perangkat-daerah)
   - [Pegawai (PNS)](#75-pegawai-pns)
   - [Kendaraan Dinas (KDO)](#76-kendaraan-dinas-kdo)
   - [Servis & Pemeliharaan](#77-servis--pemeliharaan)
   - [Users & RBAC](#78-users--rbac)
8. [Pengujian Otomatis](#8-pengujian-otomatis)

---

## 1. Arsitektur & Struktur Direktori

```text
backend/
├── prisma/
│   ├── schema.prisma               # Definisi model SQLite (6 tabel)
│   ├── seed.ts                     # Data awal realistis + password hash bcrypt
│   └── dev.db                      # File database SQLite lokal
├── src/
│   ├── docs/
│   │   ├── paths/
│   │   │   ├── fleet.paths.ts      # OpenAPI /api/kendaraan & /api/servis
│   │   │   ├── master.paths.ts     # OpenAPI /api/perangkat-daerah & /api/pegawai
│   │   │   ├── system.paths.ts     # OpenAPI /api/health, /api/auth, /api/dashboard
│   │   │   └── users.paths.ts      # OpenAPI /api/users
│   │   ├── components.ts           # Skema & response reusable OpenAPI 3.0.3
│   │   ├── helpers.ts              # Builder helper definisi endpoint OpenAPI
│   │   └── swagger.ts              # Perakitan spesifikasi Swagger + UI (/api-docs)
│   ├── lib/
│   │   ├── apiResponse.ts          # Helper envelope JSON sukses (sendSuccess, sendCreated)
│   │   ├── asyncHandler.ts         # Pembungkus async route handler
│   │   ├── db.ts                   # Singleton PrismaClient
│   │   ├── httpError.ts            # Kelas HttpError (400, 401, 403, 404, 409)
│   │   ├── jwt.ts                  # Sign & verify JWT Bearer Token
│   │   ├── password.ts             # Hash & verifikasi password (bcryptjs)
│   │   ├── serializers.ts          # Parse field JSON & sembunyikan passwordHash
│   │   └── tax.ts                  # Kalkulasi status jatuh tempo PKB & plat 5 tahunan
│   ├── middleware/
│   │   ├── auth.middleware.ts      # Middleware authenticate & requireRoles
│   │   ├── error.middleware.ts     # Global error handler & 404 handler
│   │   └── validate.middleware.ts  # Validasi parameter path :id
│   ├── routes/                     # Thin HTTP route handlers
│   │   ├── auth.routes.ts          # /api/auth/*
│   │   ├── dashboard.routes.ts     # /api/dashboard
│   │   ├── health.routes.ts        # /api/health
│   │   ├── kendaraan.routes.ts     # /api/kendaraan/*
│   │   ├── pegawai.routes.ts       # /api/pegawai/*
│   │   ├── perangkat-daerah.routes.ts # /api/perangkat-daerah/*
│   │   ├── servis.routes.ts        # /api/servis/*
│   │   └── users.routes.ts         # /api/users/*
│   ├── schemas/                    # Skema validasi input & query Zod
│   │   ├── auth.schema.ts
│   │   ├── dashboard.schema.ts
│   │   ├── kendaraan.schema.ts
│   │   ├── pegawai.schema.ts
│   │   ├── perangkat-daerah.schema.ts
│   │   ├── servis.schema.ts
│   │   └── user.schema.ts
│   ├── services/                   # Business logic & query/transaksi Prisma
│   │   ├── auth.service.ts
│   │   ├── dashboard.service.ts
│   │   ├── kendaraan.service.ts
│   │   ├── pegawai.service.ts
│   │   ├── perangkat-daerah.service.ts
│   │   ├── servis.service.ts
│   │   └── users.service.ts
│   ├── app.ts                      # Setup Express, Helmet, CORS, Rate Limit, Swagger & Routes
│   └── index.ts                    # Entrypoint HTTP server & graceful shutdown
├── tests/
│   └── api.test.ts                 # Integration test otomatis (node:test)
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 2. Instalasi, Konfigurasi & Menjalankan Server

### Variabel Lingkungan (`.env`)

Salin `backend/.env.example` menjadi `backend/.env`:

| Variabel | Default Development | Keterangan |
|---|---|---|
| `PORT` | `3001` | Port HTTP server Express |
| `DATABASE_URL` | `"file:./dev.db"` | Lokasi database SQLite Prisma |
| `JWT_SECRET` | `"si-kdo-bmd-dev-secret-change-in-production"` | Secret JWT (wajib diisi saat `NODE_ENV=production`) |
| `JWT_EXPIRES_IN` | `"12h"` | Masa berlaku access token JWT |
| `CORS_ORIGIN` | `"http://localhost:5173"` | Origin yang diizinkan (pisahkan koma jika lebih dari satu) |

### Perintah NPM

Jalankan dari **root proyek** (`d:\1-dev\personal\bpad-dki`):

```powershell
# 1. Instal dependensi backend
npm --prefix backend install

# 2. Generate Prisma Client, sinkronkan skema SQLite, dan isi data awal
npm --prefix backend run db:generate
npm --prefix backend run db:push
npm --prefix backend run db:seed

# 3. Jalankan server mode development (auto-reload)
npm --prefix backend run dev

# 4. Build TypeScript ke dist/ dan jalankan mode produksi
npm --prefix backend run build
npm --prefix backend run start
```

> [!TIP]
> Dari root proyek tersedia juga skrip gabungan: `npm run dev:all` (menjalankan backend dan frontend sekaligus), `npm run build`, `npm run db:push`, `npm run db:seed`, dan `npm run test:backend`.

---

## 3. Skema Database (SQLite + Prisma)

Database didefinisikan pada [prisma/schema.prisma](file:///d:/1-dev/personal/bpad-dki/backend/prisma/schema.prisma) dengan 6 model utama:

1. **`PerangkatDaerah`**
   - Kolom: `id`, `kodeSkpd` *(unique)*, `nama`, `singkatan`, `kepalaDinas`, `alamat`, `telepon`, `createdAt`, `updatedAt`.
   - Relasi: menaungi banyak `Pegawai`, `KendaraanDinas`, `RiwayatKendaraan`, dan `AppUser`.
   - **Aturan hapus**: tidak dapat dihapus (`409 Conflict`) jika masih memiliki `Pegawai` atau `KendaraanDinas`.

2. **`Pegawai`**
   - Kolom: `id`, `nip` *(unique, 18 digit)*, `nama`, `jabatan`, `golongan`, `pangkat`, `noHp`, `email`, `perangkatDaerahId` (FK), `createdAt`, `updatedAt`.
   - **Aturan hapus**: berjalan dalam transaksi (`$transaction`), otomatis melepas relasi `pegawaiId` pada seluruh KDO yang dipegang menjadi `null` (kembali ke Pool SKPD) dan mencatat log baru pada `RiwayatKendaraan`.

3. **`KendaraanDinas`**
   - Kolom: `id`, `nomorPolisi` *(unique)*, `kodeBarang`, `merek`, `tipeModel`, `jenis` (`RODA_4 | RODA_2 | KHUSUS`), `tahunProduksi`, `warna`, `nomorRangka`, `nomorMesin`, `kondisi` (`BAIK | RUSAK_RINGAN | RUSAK_BERAT`), `lokasiParkir`, `keterangan`, `fotos` *(JSON array maks. 6 item)*, `dokumenStnk` *(JSON nullable)*, `dokumenBpkb` *(JSON nullable)*, `pajakTahunanJatuhTempo` *(YYYY-MM-DD)*, `pajakLimaTahunanJatuhTempo` *(YYYY-MM-DD)*, `perangkatDaerahId` (FK), `pegawaiId` (FK nullable), `createdAt`, `updatedAt`.
   - **Aturan riwayat otomatis**:
     - Saat `POST /api/kendaraan`: otomatis membuat 1 entri `RiwayatKendaraan` dengan `jenisPerubahan = "PENDAFTARAN"`.
     - Saat `PUT /api/kendaraan/:id`: jika `perangkatDaerahId`, `pegawaiId`, atau `kondisi` berubah, otomatis membuat entri `RiwayatKendaraan` (`MUTASI_SKPD`, `PENUGASAN`, atau `KONDISI`) lengkap dengan snapshot nama SKPD dan pegawai.

4. **`RiwayatKendaraan`**
   - Kolom: `id`, `kendaraanId` (FK cascade), `pegawaiId` (FK nullable), `pegawaiNamaSnapshot`, `perangkatDaerahId` (FK), `perangkatDaerahNamaSnapshot`, `jenisPerubahan` (`PENDAFTARAN | PENUGASAN | KONDISI | MUTASI_SKPD`), `kondisiSaatItu`, `nomorBast`, `catatan`, `tanggal`.

5. **`ServisKendaraan`**
   - Kolom: `id`, `kendaraanId` (FK cascade), `tanggalServis`, `jenisServis` (`SERVIS_RUTIN | PERBAIKAN | GANTI_BAN_AKI | UJI_KIR | LAINNYA`), `status` (`TERJADWAL | DALAM_PERBAIKAN | SELESAI`), `bengkel`, `kilometer`, `biaya`, `servisBerikutnyaTanggal`, `deskripsi`, `buktiNota` *(JSON nullable)*, `createdAt`, `updatedAt`.

6. **`AppUser`**
   - Kolom: `id`, `username` *(unique)*, `nama`, `email` *(unique)*, `passwordHash`, `role` (`ADMIN_BPAD | OPERATOR_SKPD | VIEWER`), `perangkatDaerahId` (FK nullable), `aktif`, `createdAt`, `updatedAt`.

---

## 4. Keamanan Dasar, Autentikasi & RBAC

- **Password Hashing**: `bcryptjs` (salt rounds `10`). Field `passwordHash` disaring via `serializeUser()` sehingga tidak pernah dikirim ke response API.
- **Autentikasi JWT**: `Authorization: Bearer <token>` diverifikasi oleh middleware `authenticate`. Pada `NODE_ENV=production`, `JWT_SECRET` wajib terkonfigurasi.
- **Role-Based Access Control (RBAC)**:
  - `ADMIN_BPAD`: akses penuh seluruh endpoint (`GET`, `POST`, `PUT`, `DELETE`) termasuk manajemen akun `/api/users`.
  - `OPERATOR_SKPD`: `GET` semua data operasional serta `POST`/`PUT`/`DELETE` untuk Perangkat Daerah, Pegawai, KDO, dan Servis (ditolak `403` pada `/api/users`).
  - `VIEWER`: hanya dapat melakukan `GET` (`403 Forbidden` pada seluruh operasi `POST`/`PUT`/`DELETE` dan `/api/users`).
- **HTTP Security Headers**: `helmet` aktif dengan `app.disable('x-powered-by')`.
- **Rate Limiting**:
  - Umum `/api/*`: maks. `300` request per `15` menit per IP (`429 RATE_LIMIT_EXCEEDED`).
  - Khusus `POST /api/auth/login`: maks. `20` percobaan per `15` menit per IP (`429 TOO_MANY_LOGIN_ATTEMPTS`).
- **Batas Payload & Proteksi SQL Injection**:
  - Batas JSON body `15mb` (mendukung foto WebP & PDF dokumen base64) dengan error `413 PAYLOAD_TOO_LARGE` jika terlampaui.
  - Seluruh query database menggunakan Prisma ORM terparameterisasi.

### Akun Uji Coba Hasil Seeding (`db:seed`)

| Role | Username | Email | Password |
|---|---|---|---|
| `ADMIN_BPAD` | `admin.bpad` | `admin@bpad.jakarta.go.id` | `admin123` |
| `OPERATOR_SKPD` | `operator.disdik` | `operator.disdik@jakarta.go.id` | `operator123` |
| `VIEWER` | `auditor.bmd` | `auditor@bpad.jakarta.go.id` | `auditor123` |

---

## 5. Standar Format JSON & HTTP Status Code

### Format Sukses

```json
{
  "success": true,
  "message": "Daftar Kendaraan Dinas Operasional (KDO) berhasil dimuat.",
  "data": [],
  "meta": {
    "total": 8
  }
}
```

### Format Error

```json
{
  "success": false,
  "message": "NIP PNS harus terdiri dari tepat 18 digit angka.",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "nip",
        "message": "NIP PNS harus terdiri dari tepat 18 digit angka."
      }
    ]
  }
}
```

### Daftar HTTP Status Code

| Status Code | Error Code / Makna | Kapan Terjadi |
|---|---|---|
| `200 OK` | Sukses baca/ubah/hapus | Request `GET`, `PUT`, `DELETE`, `POST /api/auth/login`, `POST /api/auth/logout` berhasil |
| `201 Created` | Sukses membuat resource | Request `POST` pembuatan data baru berhasil |
| `400 Bad Request` | `BAD_REQUEST`, `VALIDATION_ERROR`, `INVALID_JSON`, `FOREIGN_KEY_VIOLATION` | Input Zod tidak valid, parameter `:id` bukan bilangan bulat positif, JSON rusak, atau referensi FK tidak valid |
| `401 Unauthorized` | `UNAUTHORIZED` | Token Bearer tidak ada/kedaluwarsa/salah, atau kredensial login tidak cocok |
| `403 Forbidden` | `FORBIDDEN` | Role pengguna tidak punya izin, atau akun dinonaktifkan (`aktif: false`) |
| `404 Not Found` | `NOT_FOUND`, `ENDPOINT_NOT_FOUND` | ID record tidak ditemukan atau URL endpoint tidak terdaftar |
| `409 Conflict` | `CONFLICT`, `DUPLICATE_ENTRY` | Duplikasi `kodeSkpd`, `nip`, `nomorPolisi`, `username`, `email`, atau gagal hapus SKPD yang masih memiliki PNS/KDO |
| `413 Payload Too Large` | `PAYLOAD_TOO_LARGE` | Ukuran body JSON melebihi `15 MB` |
| `429 Too Many Requests` | `RATE_LIMIT_EXCEEDED`, `TOO_MANY_LOGIN_ATTEMPTS` | Melebihi batas rate limiter |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Kesalahan tak terduga pada server |

---

## 6. Dokumentasi Interaktif Swagger (OpenAPI 3.0.3)

- **Swagger UI**: `http://localhost:3001/api-docs`
- **Spesifikasi OpenAPI JSON**: `http://localhost:3001/api-docs.json`

Cara menguji endpoint terproteksi di Swagger UI:
1. Buka `POST /api/auth/login` -> **Try it out** -> **Execute** (default memakai `admin.bpad` / `admin123`).
2. Salin nilai `data.token` dari response JSON.
3. Klik tombol **Authorize** di kanan atas halaman Swagger UI, tempel token, lalu klik **Authorize**.

---

## 7. Referensi Lengkap Endpoint REST API

### 7.1 Health

#### `GET /api/health`
- **Auth**: Publik (tanpa token)
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Server REST API SI-KDO BMD berjalan normal.",
  "data": {
    "status": "UP",
    "service": "si-kdo-bmd-api",
    "database": "connected",
    "timestamp": "2026-11-14T05:26:27.039Z"
  }
}
```

---

### 7.2 Auth

#### `POST /api/auth/login`
- **Auth**: Publik
- **Request JSON**:
```json
{
  "identifier": "admin.bpad",
  "password": "admin123"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Login berhasil.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "user": {
      "userId": 1,
      "username": "admin.bpad",
      "nama": "Administrator Pengelola BMD",
      "email": "admin@bpad.jakarta.go.id",
      "role": "ADMIN_BPAD",
      "perangkatDaerahId": null,
      "loggedInAt": "2026-11-14T05:00:00.000Z"
    }
  }
}
```
- **Kemungkinan Status**: `200`, `400`, `401`, `403`, `429`, `500`.

#### `GET /api/auth/me`
- **Auth**: Bearer Token (`ADMIN_BPAD | OPERATOR_SKPD | VIEWER`)
- **Kemungkinan Status**: `200`, `401`, `404`, `500`.

#### `POST /api/auth/logout`
- **Auth**: Bearer Token
- **Kemungkinan Status**: `200`, `401`.

---

### 7.3 Dashboard

#### `GET /api/dashboard`
- **Auth**: Bearer Token
- **Query Opsional**: `perangkatDaerahId` (integer positif)
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Ringkasan dashboard BMD berhasil dimuat.",
  "data": {
    "totalKendaraan": 8,
    "totalBaik": 5,
    "totalRusakRingan": 2,
    "totalRusakBerat": 1,
    "totalBerpenanggungJawab": 6,
    "totalPoolDinas": 2,
    "totalPegawai": 6,
    "totalPerangkatDaerah": 3,
    "totalRoda4": 3,
    "totalRoda2": 2,
    "totalKhusus": 3,
    "pajakPerluPerhatian": 4,
    "totalServisAktif": 2,
    "totalBiayaServis": 6480000,
    "daftarPengingatPajak": [],
    "perPerangkatDaerah": [],
    "riwayatTerbaru": []
  }
}
```
- **Kemungkinan Status**: `200`, `400`, `401`, `500`.

---

### 7.4 Perangkat Daerah

| Method & Path | Role | Keterangan | Status Code |
|---|---|---|---|
| `GET /api/perangkat-daerah` | Semua role login | Daftar SKPD + `_count` (`?search=`) | `200`, `401`, `500` |
| `GET /api/perangkat-daerah/:id` | Semua role login | Detail SKPD + daftar `pegawai` & `kendaraan` | `200`, `400`, `401`, `404`, `500` |
| `POST /api/perangkat-daerah` | `ADMIN_BPAD`, `OPERATOR_SKPD` | Tambah SKPD baru | `201`, `400`, `401`, `403`, `409`, `500` |
| `PUT /api/perangkat-daerah/:id` | `ADMIN_BPAD`, `OPERATOR_SKPD` | Ubah data SKPD | `200`, `400`, `401`, `403`, `404`, `409`, `500` |
| `DELETE /api/perangkat-daerah/:id` | `ADMIN_BPAD`, `OPERATOR_SKPD` | Hapus SKPD (ditolak `409` jika punya PNS/KDO) | `200`, `400`, `401`, `403`, `404`, `409`, `500` |

**Contoh Request JSON (`POST` / `PUT`)**:
```json
{
  "kodeSkpd": "1.04.01.01",
  "nama": "Dinas Perhubungan",
  "singkatan": "DISHUB",
  "kepalaDinas": "Dr. Syafrin Liputo, M.T.",
  "alamat": "Jl. Taman Jatibaru No. 1, Jakarta Pusat",
  "telepon": "(021) 3501349"
}
```

---

### 7.5 Pegawai (PNS)

| Method & Path | Role | Keterangan | Status Code |
|---|---|---|---|
| `GET /api/pegawai` | Semua role login | Filter `?perangkatDaerahId=&golongan=&search=` | `200`, `400`, `401`, `500` |
| `GET /api/pegawai/:id` | Semua role login | Detail PNS + daftar KDO yang dipegang | `200`, `400`, `401`, `404`, `500` |
| `POST /api/pegawai` | `ADMIN_BPAD`, `OPERATOR_SKPD` | Tambah PNS (validasi NIP 18 digit) | `201`, `400`, `401`, `403`, `409`, `500` |
| `PUT /api/pegawai/:id` | `ADMIN_BPAD`, `OPERATOR_SKPD` | Ubah data PNS | `200`, `400`, `401`, `403`, `404`, `409`, `500` |
| `DELETE /api/pegawai/:id` | `ADMIN_BPAD`, `OPERATOR_SKPD` | Hapus PNS + lepas KDO ke Pool & catat riwayat | `200`, `400`, `401`, `403`, `404`, `500` |

**Contoh Request JSON (`POST` / `PUT`)**:
```json
{
  "nip": "198605142011011002",
  "nama": "Bambang Pamungkas, S.Kom.",
  "jabatan": "Analis Aset Daerah",
  "golongan": "III/c",
  "pangkat": "Penata",
  "noHp": "081299001122",
  "email": "bambang.p@jakarta.go.id",
  "perangkatDaerahId": 1
}
```

---

### 7.6 Kendaraan Dinas (KDO)

| Method & Path | Role | Keterangan | Status Code |
|---|---|---|---|
| `GET /api/kendaraan` | Semua role login | Filter `?kondisi=&jenis=&perangkatDaerahId=&pegawaiId=&penugasan=ASSIGNED\|POOL&search=` | `200`, `400`, `401`, `500` |
| `GET /api/kendaraan/:id` | Semua role login | Detail KDO + relasi SKPD, PNS, `riwayat`, `servis` | `200`, `400`, `401`, `404`, `500` |
| `GET /api/kendaraan/:id/riwayat` | Semua role login | Daftar log riwayat perubahan KDO | `200`, `400`, `401`, `404`, `500` |
| `POST /api/kendaraan` | `ADMIN_BPAD`, `OPERATOR_SKPD` | Tambah KDO + log riwayat `PENDAFTARAN` | `201`, `400`, `401`, `403`, `409`, `500` |
| `PUT /api/kendaraan/:id` | `ADMIN_BPAD`, `OPERATOR_SKPD` | Update KDO + log otomatis jika SKPD/PJ/kondisi berubah | `200`, `400`, `401`, `403`, `404`, `409`, `500` |
| `DELETE /api/kendaraan/:id` | `ADMIN_BPAD`, `OPERATOR_SKPD` | Hapus KDO (cascade riwayat & servis) | `200`, `400`, `401`, `403`, `404`, `500` |

**Contoh Request JSON (`POST` / `PUT`)**:
```json
{
  "nomorPolisi": "B 1502 PQR",
  "kodeBarang": "1.3.2.02.01.02.003-0015",
  "merek": "Toyota",
  "tipeModel": "Veloz 1.5 Q CVT",
  "jenis": "RODA_4",
  "tahunProduksi": 2024,
  "warna": "Hitam",
  "nomorRangka": "MHKAA1BA0RJ001122",
  "nomorMesin": "2NR-VE998811",
  "kondisi": "BAIK",
  "lokasiParkir": "Basement Gedung Dinas Pendidikan",
  "keterangan": "Unit operasional pengawasan sekolah.",
  "fotos": [],
  "dokumenStnk": null,
  "dokumenBpkb": null,
  "pajakTahunanJatuhTempo": "2027-08-20",
  "pajakLimaTahunanJatuhTempo": "2030-08-20",
  "perangkatDaerahId": 1,
  "pegawaiId": 1,
  "nomorBast": "BAST/DISDIK/099/2026",
  "catatanPerubahan": "Serah terima kendaraan operasional baru."
}
```

---

### 7.7 Servis & Pemeliharaan

| Method & Path | Role | Keterangan | Status Code |
|---|---|---|---|
| `GET /api/servis` | Semua role login | Filter `?kendaraanId=&perangkatDaerahId=&status=&jenisServis=&search=` | `200`, `400`, `401`, `500` |
| `GET /api/servis/:id` | Semua role login | Detail catatan servis | `200`, `400`, `401`, `404`, `500` |
| `POST /api/servis` | `ADMIN_BPAD`, `OPERATOR_SKPD` | Tambah catatan servis/uji KIR | `201`, `400`, `401`, `403`, `500` |
| `PUT /api/servis/:id` | `ADMIN_BPAD`, `OPERATOR_SKPD` | Ubah catatan servis | `200`, `400`, `401`, `403`, `404`, `500` |
| `DELETE /api/servis/:id` | `ADMIN_BPAD`, `OPERATOR_SKPD` | Hapus catatan servis | `200`, `400`, `401`, `403`, `404`, `500` |

**Contoh Request JSON (`POST` / `PUT`)**:
```json
{
  "kendaraanId": 1,
  "tanggalServis": "2026-11-14",
  "jenisServis": "SERVIS_RUTIN",
  "status": "SELESAI",
  "bengkel": "Auto2000 Gatot Subroto",
  "kilometer": 22500,
  "biaya": 1450000,
  "servisBerikutnyaTanggal": "2027-05-14",
  "deskripsi": "Ganti oli mesin, filter AC, dan pengecekan rem.",
  "buktiNota": null
}
```

---

### 7.8 Users & RBAC

| Method & Path | Role | Keterangan | Status Code |
|---|---|---|---|
| `GET /api/users` | `ADMIN_BPAD` | Filter `?role=&aktif=true\|false&search=` | `200`, `401`, `403`, `500` |
| `GET /api/users/:id` | `ADMIN_BPAD` | Detail akun pengguna (tanpa `passwordHash`) | `200`, `400`, `401`, `403`, `404`, `500` |
| `POST /api/users` | `ADMIN_BPAD` | Buat akun baru (min. 6 karakter password) | `201`, `400`, `401`, `403`, `409`, `500` |
| `PUT /api/users/:id` | `ADMIN_BPAD` | Ubah akun (password opsional; jaga min. 1 Admin aktif) | `200`, `400`, `401`, `403`, `404`, `409`, `500` |
| `DELETE /api/users/:id` | `ADMIN_BPAD` | Hapus akun (tidak bisa hapus akun sendiri / admin terakhir) | `200`, `400`, `401`, `403`, `404`, `500` |

**Contoh Request JSON (`POST`)**:
```json
{
  "username": "operator.dinkes",
  "nama": "Operator Pengurus Barang Dinkes",
  "email": "operator.dinkes@jakarta.go.id",
  "password": "rahasia123",
  "role": "OPERATOR_SKPD",
  "perangkatDaerahId": 2,
  "aktif": true
}
```

---

## 8. Pengujian Otomatis

Suite integration test tersedia di [tests/api.test.ts](file:///d:/1-dev/personal/bpad-dki/backend/tests/api.test.ts) dan mencakup pemeriksaan health check, Swagger/OpenAPI spec, autentikasi `401`, otorisasi RBAC `403`, dashboard, validasi `400`, konflik `409`, `404`, auto-logging `RiwayatKendaraan`, servis, dan kerahasiaan `passwordHash`.

```powershell
npm --prefix backend test
```
