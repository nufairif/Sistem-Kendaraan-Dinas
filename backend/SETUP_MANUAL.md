# Manual Setup Backend — SI-KDO BMD

Panduan langkah demi langkah untuk menyiapkan, mengonfigurasi, menjalankan, dan menguji backend REST API **SI-KDO BMD** di mesin lokal maupun lingkungan baru.

---

## 1. Prasyarat Sistem

Pastikan perangkat Anda sudah terpasang:
- **Node.js** versi `>= 20` (teruji pada `v24.22.1`) dan **npm** (`>= 10`).
- **Git** (opsional, untuk mengkloning repositori).
- **Python 3** atau **SQLite CLI (`sqlite3`)** (opsional, hanya dibutuhkan jika ingin melakukan restore manual dari file `prisma/dump.sql`).

Cek versi Node.js dan npm di terminal:
```powershell
node -v
npm -v
```

---

## 2. Masuk ke Direktori Proyek & Instal Dependensi

> [!IMPORTANT]
> Perhatikan posisi folder terminal Anda sebelum menjalankan perintah `npm`:
> - Jika di **root proyek** (`d:\1-dev\personal\bpad-dki`), gunakan `npm --prefix backend ...`.
> - Jika di **dalam folder `backend/`**, gunakan `npm ...` langsung tanpa `--prefix backend`.

### Opsi A — Dari Root Proyek
```powershell
cd D:\1-dev\personal\bpad-dki
npm install
npm --prefix backend install
```

### Opsi B — Langsung di Folder `backend/`
```powershell
cd D:\1-dev\personal\bpad-dki\backend
npm install
```

---

## 3. Konfigurasi Variabel Lingkungan (`.env`)

1. Di dalam folder `backend/`, pastikan file `.env` tersedia. Jika belum ada, salin dari `.env.example`:
   ```powershell
   Copy-Item backend\.env.example backend\.env
   ```
   *(Jika terminal sudah di dalam `backend/`, jalankan `Copy-Item .env.example .env`.)*

2. Sesuaikan isi `backend/.env`:
   ```env
   PORT=3001
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="si-kdo-bmd-dev-secret-change-in-production"
   JWT_EXPIRES_IN="12h"
   CORS_ORIGIN="http://localhost:5173"
   ```

   **Penjelasan variabel:**
   - `PORT`: Port HTTP server backend (default `3001`, selaras dengan proxy `/api` pada `frontend/vite.config.ts`).
   - `DATABASE_URL`: Path file SQLite relatif terhadap folder `backend/prisma/`.
   - `JWT_SECRET`: Kunci penandatanganan JWT. **Wajib diganti dengan string acak yang kuat** pada `NODE_ENV=production` (server akan menolak berjalan di production jika kosong).
   - `JWT_EXPIRES_IN`: Masa berlaku token login (misalnya `12h`, `1d`).
   - `CORS_ORIGIN`: Daftar origin frontend yang diizinkan (pisahkan dengan koma tanpa spasi jika lebih dari satu, contoh `http://localhost:5173,http://127.0.0.1:5173`).

---

## 4. Setup Database SQLite

Pilih salah satu dari dua metode berikut:

### Metode 1 — Menggunakan Prisma & Seeder (Direkomendasikan)

Jalankan dari **root proyek**:
```powershell
npm --prefix backend run db:generate
npm --prefix backend run db:push
npm --prefix backend run db:seed
```

Hasil yang diharapkan:
- File `backend/prisma/dev.db` terbentuk otomatis dalam kondisi **bersih tanpa data dummy** (`PerangkatDaerah`, `Pegawai`, `KendaraanDinas`, `RiwayatKendaraan`, `ServisKendaraan`, dan `PeminjamanKendaraan` berjumlah `0`).
- Database hanya berisi **1 role bawaan** `ADMIN_BPAD` (**Super Admin** dengan akses penuh seluruh modul) dan **1 akun Super Admin** (`admin.bpad` / `admin123`, dapat disesuaikan lewat `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_NAMA` saat seeding).

*(Catatan: Untuk keperluan pengujian otomatis, suite test menggunakan fixture terisolasi lalu mereset kembali `dev.db` ke kondisi bersih 1 Super Admin setelah selesai.)*

Jika suatu saat ingin mengulang database dari kondisi bersih:
```powershell
npm --prefix backend run db:reset
```

### Metode 2 — Restore Manual dari SQL Dump (`prisma/dump.sql`)

Jika Anda ingin memulihkan struktur tabel beserta data awal langsung dari file [prisma/dump.sql](./prisma/dump.sql):

- **Menggunakan `sqlite3` CLI**:
  ```powershell
  Remove-Item backend\prisma\dev.db -ErrorAction SilentlyContinue
  sqlite3 backend\prisma\dev.db ".read backend/prisma/dump.sql"
  npm --prefix backend run db:generate
  ```

- **Menggunakan Python (`sqlite3` bawaan)**:
  ```powershell
  Remove-Item backend\prisma\dev.db -ErrorAction SilentlyContinue
  python -c "import sqlite3; c=sqlite3.connect('backend/prisma/dev.db'); c.executescript(open('backend/prisma/dump.sql', encoding='utf-8').read()); c.close()"
  npm --prefix backend run db:generate
  ```

---

## 5. Menjalankan Server Backend

### Mode Development (Auto-Reload)
```powershell
npm --prefix backend run dev
```
*(Atau dari root proyek, jalankan backend + frontend bersamaan dengan `npm run dev:all`.)*

Output normal saat server siap:
```text
SI-KDO BMD REST API berjalan di http://localhost:3001
Swagger UI tersedia di http://localhost:3001/api-docs
OpenAPI JSON tersedia di http://localhost:3001/api-docs.json
```

### Mode Production (Build & Start)
```powershell
npm --prefix backend run build
npm --prefix backend run start
```
Perintah `build` mengompilasi kode TypeScript ke `backend/dist/`, lalu `start` menjalankan `node dist/index.js`.

---

## 6. Verifikasi & Pengujian API

### 6.1 Cek Health Endpoint
Buka browser atau jalankan di PowerShell:
```powershell
Invoke-RestMethod -Uri http://localhost:3001/api/health
```
Status yang diharapkan: `200 OK` dengan `"status": "UP"` dan `"database": "connected"`.

### 6.2 Uji Coba Interaktif via Swagger UI
1. Buka **`http://localhost:3001/api-docs`** di browser.
2. Buka grup **Auth** -> **`POST /api/auth/login`** -> **Try it out** -> **Execute** menggunakan akun Super Admin default:
   - `admin.bpad` / `admin123` (`ADMIN_BPAD` — Super Admin akses penuh)
3. Salin nilai `data.token` dari response JSON.
4. Klik tombol **Authorize** di kanan atas halaman Swagger UI, tempel token pada kolom `Value`, lalu klik **Authorize**.
5. Seluruh endpoint terproteksi kini siap dicoba langsung dari Swagger UI.

### 6.3 Menjalankan Automated Integration Tests
```powershell
npm --prefix backend test
```
Suite test di [tests/api.test.ts](./tests/api.test.ts) akan melakukan seed ulang database dan memverifikasi **10 skenario end-to-end** (health check, Swagger UI/JSON, autentikasi `401`, RBAC `403`, dashboard + `totalSedangDipinjam`, validasi `400`, konflik `409`, `404`, riwayat otomatis KDO, servis, kerahasiaan `passwordHash`, CRUD peminjaman + pengembalian, serta CRUD role & RBAC dinamis).

---

## 7. Troubleshooting Masalah Umum

| Masalah | Penyebab | Solusi |
|---|---|---|
| `npm error code ENOENT ... package.json` | Menjalankan `npm --prefix backend ...` saat terminal sudah berada di dalam `frontend/` atau `backend/` | Pindah ke root `d:\1-dev\personal\bpad-dki` terlebih dahulu, atau masuk ke `backend/` lalu jalankan `npm run dev` tanpa `--prefix backend` |
| `Error: @prisma/client did not initialize yet` | Prisma Client belum di-generate setelah install | Jalankan `npm --prefix backend run db:generate` |
| `EADDRINUSE: address already in use :::3001` | Port `3001` sudah dipakai proses lain | Hentikan proses lama di port `3001` atau ubah `PORT` di `backend/.env` |
| `EPERM` saat `prisma generate` pada Windows | Server `tsx watch` masih berjalan dan mengunci `query_engine-windows.dll.node` | Hentikan server `npm run dev` terlebih dahulu, jalankan `db:generate`, lalu jalankan ulang server |
| `JWT_SECRET wajib dikonfigurasi pada environment production` | Menjalankan `NODE_ENV=production` tanpa `JWT_SECRET` di `.env` | Isi variabel `JWT_SECRET` di `backend/.env` |
| `401 Unauthorized` di Swagger UI | Belum login atau belum mengisi token di tombol **Authorize** | Login via `POST /api/auth/login` lalu masukkan `data.token` ke **Authorize** |
