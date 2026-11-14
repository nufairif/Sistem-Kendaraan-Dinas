# AGENTS.md — Panduan Agent untuk SI-KDO BMD (`bpad-dki`)

Dokumen ini menjadi panduan utama bagi coding agent yang bekerja di repositori **Sistem Pengelolaan Kendaraan Dinas Operasional (SI-KDO BMD)** untuk **BPAD DKI Jakarta**.

## Aplkasi ini dibuat menggunakan dengan Antigravity IDE

---

## 1. Gambaran Umum Monorepo

Repositori ini terdiri dari dua aplikasi terpisah tanpa npm workspaces:

- **`backend/`** — REST API TypeScript (`Node.js` + `Express 4` + `Prisma ORM` + `SQLite` + `Zod` + `JWT` + `Swagger OpenAPI 3.0.3`), default berjalan di `http://localhost:3001` (Swagger UI di `/api-docs`).
- **`frontend/`** — SPA React (`React 19` + `TypeScript ~7.0` + `Vite 8` + `Tailwind CSS v4` + `react-router-dom v7` + `lucide-react`), default berjalan di `http://localhost:5173` dengan proxy `/api` ke `http://localhost:3001`.
- **Root (`package.json`)** — Skrip orkestrasi lintas `backend/` dan `frontend/` menggunakan `concurrently`.

---

## 2. Perintah Pengembangan, Build & Pengujian

> [!IMPORTANT]
> Di lingkungan **Windows PowerShell 5.1**, jangan gunakan `&&` sebagai pemisah perintah; gunakan titik koma `;`.
> Jalankan perintah dari root `d:\1-dev\personal\bpad-dki` memakai `--prefix`, atau masuk ke direktori masing-masing terlebih dahulu.

### Perintah Root (`package.json`)

- `npm run dev:all` — Jalankan backend (`:3001`) dan frontend (`:5173`) bersamaan.
- `npm run dev:backend` / `npm run dev:frontend` — Jalankan salah satu service saja.
- `npm run build` — Build produksi `backend` lalu `frontend`.
- `npm run db:push` — Sinkronkan `backend/prisma/schema.prisma` ke SQLite (`backend/prisma/dev.db`).
- `npm run db:seed` — Jalankan `backend/prisma/seed.ts` (reset DB ke kondisi bersih + 1 akun Super Admin).
- `npm run test:backend` — Jalankan integration test backend (`backend/tests/api.test.ts`).

### Perintah Spesifik Package

- **Backend**:
  - `npm --prefix backend run typecheck` (`tsc --noEmit`)
  - `npm --prefix backend run build` (`tsc --noEmit && tsc -p tsconfig.build.json`)
  - `npm --prefix backend run db:generate` (generate Prisma Client)
  - `npm --prefix backend run db:reset` (force-reset SQLite + seed ulang)
  - `npm --prefix backend test` (`tsx --test tests/api.test.ts`)
- **Frontend**:
  - `npm --prefix frontend run lint` (`oxlint`)
  - `npm --prefix frontend run build` (`tsc -b && vite build`)

### Catatan Penting Windows & Prisma

- Jika `npm --prefix backend run db:generate` gagal dengan `EPERM` pada `query_engine-windows.dll.node`, hentikan proses dev server backend (`tsx watch`) terlebih dahulu sebelum menjalankan `db:generate`.
- `backend/tests/api.test.ts` menggunakan database terisolasi (`backend/prisma/test.db`) dan fixture pada `backend/tests/fixtures.ts`, sehingga tidak merusak `backend/prisma/dev.db`.

---

## 3. Arsitektur & Konvensi Backend (`backend/`)

### 3.1 Pola Berlapis (_Layered Architecture_)

Alur eksekusi request:
`app.ts` (Helmet, CORS, `/api` rate limiter, JSON parser `15mb`) → `middleware/auth.middleware.ts` → `routes/*.routes.ts` → `schemas/*.schema.ts` (Zod) → `services/*.service.ts` (Prisma + transaksi) → `lib/apiResponse.ts` / `middleware/error.middleware.ts`.

Aturan setiap layer:

- **`src/routes/*.routes.ts`**: Harus tipis. Hanya parse `req.params` (`parseIdParam`), `req.body` / `req.query` (Zod), panggil fungsi service, lalu kirim response melalui `sendSuccess` (`200`) atau `sendCreated` (`201`) dengan `asyncHandler`.
- **`src/schemas/*.schema.ts`**: Semua validasi input dan query parameter menggunakan `zod`. Tanggal memakai string format `YYYY-MM-DD`.
- **`src/services/*.service.ts`**: Simpan seluruh aturan bisnis, pengecekan relasi/konflik, transaksi `prisma.$transaction`, dan lempar `HttpError` (`BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`).
- **`src/lib/serializers.ts`**: Selalu sanitasi user melalui `serializeUser` (jangan pernah mengekspos `passwordHash`) dan parse kolom JSON string SQLite (`fotos`, `dokumenStnk`, `dokumenBpkb`, `buktiNota`, `permissions`) dengan `safeJsonParse`.

### 3.2 Autentikasi & RBAC Dinamis (Wajib Diikuti)

- **Jangan gunakan `requireRoles(...)` untuk endpoint baru.** Seluruh proteksi route menggunakan izin granular per halaman dari `RoleDefinition`:
  - `requirePermission(resource, action)`
  - `requireAnyPermission([resource, action], ...)`
- Daftar `PAGE_PERMISSION_KEYS` di `backend/src/lib/permissions.ts` (`dashboard`, `kendaraan`, `peminjaman`, `servis`, `pajakDokumen`, `pegawai`, `perangkatDaerah`, `users`, `roles`) **harus selalu sinkron** dengan:
  - `frontend/src/types/bmd.ts` (`PagePermissionKey`)
  - `frontend/src/constants/domainOptions.ts` (`PAGE_PERMISSION_META`, `makeDefaultPermissionMap`)
  - `backend/src/docs/components.ts`
- Aturan proteksi Admin:
  - Hak akses role `ADMIN_BPAD` bersifat tetap dan tidak dapat diubah (`403 Forbidden` di `roles.service.ts`).
  - Role sistem (`isSystem: true`) tidak boleh dihapus.
  - Sistem harus selalu menjaga minimal **1 akun `ADMIN_BPAD` aktif** dan user tidak dapat menghapus akunnya sendiri (`users.service.ts`).

### 3.3 Sinkronisasi Dokumentasi OpenAPI / Swagger

- Setiap penambahan, pengubahan, atau penghapusan endpoint/field DTO **wajib** disinkronkan di:
  - `backend/src/docs/paths/*.paths.ts` (`system.paths.ts`, `master.paths.ts`, `fleet.paths.ts`, `users.paths.ts`)
  - `backend/src/docs/components.ts`
  - `backend/API_DOCUMENTATION.md`

### 3.4 Aturan Seeding (`backend/prisma/seed.ts`)

- `seed.ts` sengaja dirancang **bersih tanpa data dummy operasional**: hanya membersihkan seluruh tabel, mereset `sqlite_sequence`, membuat role `ADMIN_BPAD`, dan membuat 1 akun Super Admin (`admin.bpad` / `admin123`, dapat di-override via `SEED_ADMIN_*`).
- Jangan menambahkan data dummy ke `seed.ts` kecuali diminta secara eksplisit; untuk keperluan test gunakan `backend/tests/fixtures.ts`.

---

## 4. Arsitektur & Konvensi Frontend (`frontend/`)

### 4.1 Struktur Modular Berbasis Fitur

- **`src/App.tsx`**: Mengelola state sesi (`getCurrentSession`, `refreshCurrentSession` ke `/api/auth/me`, listener `AUTH_UNAUTHORIZED_EVENT`), state filter global `selectedPdId`, serta route guard berbasis `permissions.<module>.read`.
- **`src/components/layout/AppLayout.tsx`**: Sidebar sticky (`#0a3649`), badge metrik dari `/api/dashboard`, filter global Perangkat Daerah (`selectedPdId`), dan drawer mobile.
- **`src/features/<domain>/`**: Satu folder per domain (`auth`, `dashboard`, `kendaraan`, `monitoring`, `pajak`, `pegawai`, `perangkat-daerah`, `roles`, `servis`, `users`), masing-masing berisi Page orchestrator, Table/Grid, FormModal, dan DetailModal.
- **`src/services/*.service.ts` & `src/lib/apiClient.ts`**: Semua request HTTP wajib melalui `apiRequest<T>()` pada `apiClient.ts` (otomatis menyisipkan `Authorization: Bearer <token>` dari `localStorage` key `si_kdo_bmd_session_v1` dan memicu event logout saat HTTP `401`). `src/services/bmdService.ts` dipertahankan sebagai barrel re-export.

### 4.2 Konvensi UI & Media

- **Dropdown**: Selalu gunakan komponen `CustomSelect` (`src/components/common/CustomSelect.tsx`) alih-alih `<select>` bawaan browser agar tampilan konsisten, mendukung pencarian (`>= 7` opsi), dan tidak terpotong di dalam modal.
- **Komponen Bersama**: Gunakan ulang `Modal`, `ConfirmDialog`, `DocumentViewerModal`, `FeedbackBanner`, `KondisiBadge`, `StatusBadges`, `StateViews` (`LoadingState`, `EmptyState`, `ErrorState`), serta hooks `useAsyncData` dan `useConfirmDelete`.
- **Upload Foto & Dokumen (`src/utils/imageUpload.ts`)**:
  - Foto KDO (`compressVehicleImage`): `JPG`/`JPEG`/`PNG`/`WebP`, maks `5 MB`, otomatis di-resize maks `960px` dan dikonversi ke `.webp` (kualitas `0.8`), maksimal 6 foto per kendaraan.
  - Dokumen STNK/BPKB/Nota (`readVehicleDocument`): gambar (dikonversi ke `.webp`) atau `PDF` maks `1.5 MB` (dikirim sebagai Base64 data URI dalam batas payload JSON backend `15 MB`).
- **Linter**: Pastikan tidak melanggar aturan `oxlint` di `frontend/.oxlintrc.json` (`react/rules-of-hooks`, `react/only-export-components`).

---

## 5. Invarian Bisnis Domain (Wajib Dijaga Konsistensinya)

1. **Riwayat KDO Otomatis (`RiwayatKendaraan`)**:
   - `POST /api/kendaraan` otomatis mencatat `PENDAFTARAN`.
   - `PUT /api/kendaraan/:id` otomatis mencatat `MUTASI_SKPD`, `PENUGASAN`, atau `KONDISI` jika `perangkatDaerahId`, `pegawaiId`, atau `kondisi` berubah.
   - `DELETE /api/pegawai/:id` melepas `pegawaiId` KDO menjadi `null` (Pool) dan mencatat riwayat dalam transaksi.
   - `POST /api/peminjaman/:id/complete` mengubah status peminjaman menjadi `SELESAI` dan menyinkronkan `kondisi` KDO + mencatat riwayat `KONDISI` jika kondisi berubah saat pengembalian.
2. **Kelayakan Peminjaman KDO (Backend & Frontend Harus Selaras)**:
   - Diatur di `backend/src/services/peminjaman.service.ts` dan `frontend/src/utils/vehicleRules.ts` (`evaluateVehicleBorrowStatus`).
   - Kendaraan hanya boleh dipinjam/dijadwalkan (`DIPINJAM` / `TERJADWAL`) jika:
     1. `kondisi === 'BAIK'`
     2. Tidak ada catatan servis berstatus `DALAM_PERBAIKAN`
     3. Pajak tahunan (PKB) dan pajak 5 tahunan (TNKB) tidak berstatus `OVERDUE` (`getTaxStatus` di `backend/src/lib/tax.ts` & `frontend/src/utils/vehicleRules.ts`)
     4. Tidak ada bentrok rentang tanggal (`tanggalPinjam <= existing.tanggalKembaliRencana && existing.tanggalPinjam <= tanggalKembaliRencana`) dengan peminjaman aktif/terjadwal lain (`409 Conflict`).
3. **Integritas Hapus Master Data**:
   - `DELETE /api/perangkat-daerah/:id` ditolak (`409 Conflict`) jika masih memiliki `Pegawai`, `KendaraanDinas`, atau riwayat/user terkait.

---

## 6. Checklist Verifikasi Sebelum Menyelesaikan Tugas

Setelah mengubah kode:

1. Jika mengubah skema/route/logic backend: jalankan `npm --prefix backend run typecheck`, `npm --prefix backend run build`, dan `npm --prefix backend test`.
2. Jika mengubah kode frontend: jalankan `npm --prefix frontend run lint` dan `npm --prefix frontend run build`.
3. Jika kontrak API, env, atau modul berubah, perbarui `DOCUMENTATION.md`, `backend/API_DOCUMENTATION.md`, dan dokumen terkait di `backend/` atau `frontend/`.
