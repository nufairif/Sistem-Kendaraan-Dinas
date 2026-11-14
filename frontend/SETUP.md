# Manual Setup & Panduan Penggunaan Frontend (`SI-KDO BMD`)

Panduan langkah demi langkah untuk menyiapkan, menjalankan, menguji, dan melakukan *troubleshooting* folder [`frontend/`](./) secara lokal.

---

## 1. Prasyarat Sistem

Pastikan perangkat Anda sudah memasang komponen berikut:

- **Node.js**: disarankan **v20.19+** atau **v22.12+** (Vite v8; proyek ini teruji berjalan pada **Node `v24.22.1`** dan **npm `11.13.0`**).
- **Browser Modern**: Chrome, Edge, atau Firefox versi terbaru yang mendukung HTML5 Canvas WebP encoding dan `localStorage`.
- **Editor Kode** *(opsional)*: VS Code atau editor TypeScript lainnya.

Cek versi Node dan npm melalui terminal:

```bash
node -v
npm -v
```

---

## 2. Langkah Instalasi & Menjalankan Frontend (Manual Setup)

### Opsi A — Menjalankan Backend & Frontend Secara Terpisah

Frontend kini terintegrasi penuh dengan API backend (`backend/`), sehingga server backend perlu berjalan di port **`3001`** saat aplikasi digunakan.

1. **Siapkan & jalankan server Backend:**

   ```bash
   cd backend
   npm install
   npm run db:generate
   npm run db:push
   npm run db:seed
   npm run dev
   ```

2. **Masuk ke direktori `frontend` (terminal baru):**

   ```bash
   cd frontend
   ```

3. **Pasang dependensi & jalankan dev server frontend:**

   ```bash
   npm install
   npm run dev
   ```

4. **Buka aplikasi di browser:**
   Akses URL berikut:

   ```text
   http://localhost:5173/
   ```

> Proxy Vite otomatis meneruskan request `/api/*` ke `http://localhost:3001`. Jika backend berjalan di host/port berbeda, atur environment variable `VITE_API_URL` sebelum menjalankan Vite.

---

### Opsi B — Menjalankan dari Root Repository (Direkomendasikan)

Dari direktori utama proyek (`bpad-dki/`), Anda dapat menggunakan skrip di [`../package.json`](../package.json):

```bash
# Menjalankan backend (:3001) & frontend (:5173) secara bersamaan
npm run dev:all

# Atau menjalankan frontend saja (pastikan backend :3001 sudah berjalan)
npm run dev:frontend
```

> Catatan: pastikan dependensi di root, `backend/`, dan `frontend/` sudah terpasang serta database SQLite backend sudah diinisialisasi (`npm --prefix backend run db:push; npm --prefix backend run db:seed`).

---

## 3. Verifikasi Build & Kualitas Kode

Sebelum melakukan commit atau deployment, jalankan pengecekan linter dan build produksi:

```bash
# Dari direktori frontend/
npm run lint
npm run build
```

Atau dari root repository (Windows PowerShell / bash):

```bash
npm --prefix frontend run lint
npm --prefix frontend run build
```

Output build produksi akan dihasilkan di folder `frontend/dist/`. Untuk menguji hasil build produksi secara lokal:

```bash
npm run preview
```

---

## 4. Akun Default (`backend/prisma/seed.ts`)

Saat database backend di-seed (`npm --prefix backend run db:seed`), database diinisialisasi dalam kondisi bersih (tanpa data dummy operasional) dengan 1 role bawaan dan 1 akun Super Admin yang dapat langsung digunakan pada halaman `/login`:

| Username | Password | Role (`code`) | Cakupan SKPD | Hak Akses Utama |
|---|---|---|---|---|
| `admin.bpad` | `admin123` | `ADMIN_BPAD` | Semua SKPD (`null`) | Akses penuh seluruh modul termasuk Users (`/users`) dan Roles (`/roles`) |

> Anda juga dapat menekan kartu **Admin BPAD (`admin.bpad`)** pada panel akun uji coba di halaman Login untuk mengisi username dan password secara otomatis, lalu menambahkan role/user lain lewat menu **Role & Hak Akses** (`/roles`) dan **Manajemen User** (`/users`).

---

## 5. Panduan Singkat Alur Penggunaan Penting

1. **Filter Perangkat Daerah Global (Sidebar)**
   - Admin/Auditor dapat memfilter seluruh angka dashboard, tabel kendaraan, peminjaman, servis, pajak, dan PNS per SKPD melalui dropdown gelap **Filter Perangkat Daerah** di sidebar kiri.
   - Akun `OPERATOR_SKPD` otomatis terkunci ke SKPD miliknya.
2. **Melihat Detail KDO, Foto, & Dokumen STNK/BPKB (`/kendaraan`)**
   - Klik langsung **plat nomor** pada tabel atau kartu kendaraan untuk membuka modal detail (berisi nomor rangka, nomor mesin, lokasi parkir terpisah, galeri foto WebP, riwayat, serta tombol pratinjau/unduh STNK & BPKB).
   - Foto kendaraan `.jpg`, `.jpeg`, `.png` yang diunggah otomatis dikonversi menjadi `.webp`.
3. **Peminjaman & Pengembalian Kendaraan (`/monitoring`)**
   - Hanya unit berkondisi **`BAIK`**, tidak sedang **`DALAM_PERBAIKAN`**, dan pajaknya tidak **`OVERDUE`** yang muncul sebagai pilihan layak pinjam.
   - Unit rusak (`RUSAK_RINGAN` / `RUSAK_BERAT`), sedang diservis, atau telat pajak otomatis diblokir sistem.
   - Gunakan tombol **Kembalikan** pada transaksi `DIPINJAM` untuk mencatat tanggal kembali aktual, odometer akhir, dan kondisi fisik saat kembali.
4. **Pengelolaan User & Role (`/users`, `/roles`)**
   - Status aktif/nonaktif akun pada halaman Users dapat diubah langsung memakai tombol toggle di tabel maupun modal edit.
   - Pada halaman Roles, Admin BPAD dapat menambah role baru dan mencentang izin `Lihat`, `Tambah`, `Ubah`, `Hapus` di tiap halaman.
5. **Reset Database Backend ke Kondisi Seed Awal**
   - Untuk mengembalikan seluruh isi database ke data demo awal, jalankan dari terminal:
     `npm --prefix backend run db:reset`

---

## 6. Troubleshooting

| Masalah | Penyebab Umum | Solusi |
|---|---|---|
| Port `5173` sudah digunakan aplikasi lain | Ada instance Vite lain yang masih berjalan | Hentikan proses lama, atau jalankan `npx vite --port 5174` di folder `frontend/`. |
| Login / fetch API gagal (`ECONNREFUSED` atau `500` proxy error) | Server backend (`:3001`) belum dijalankan atau DB belum di-seed | Jalankan backend (`npm --prefix backend run db:push; npm --prefix backend run db:seed; npm --prefix backend run dev`) atau pakai `npm run dev:all` dari root. |
| Sesi login tidak valid / izin role berubah | Token JWT kedaluwarsa atau sesi lama di browser masih tersimpan | Logout lalu login kembali, atau hapus key `si_kdo_bmd_session_v1` lewat DevTools → *Application* → *Local Storage*. |
| Gagal unggah PDF STNK/BPKB atau banyak foto | Melebihi batas `1.5 MB` (PDF) / `5 MB` (foto) | Kompres file PDF di bawah `1.5 MB` atau gunakan gambar yang lebih ringkas (foto otomatis dikompres ke WebP ≤ 960px). |
| `npm run build` gagal saat `tsc -b` | Ada ketidaksesuaian tipe TypeScript | Periksa error yang dicetak `tsc -b` di terminal dan pastikan seluruh field di `src/types/bmd.ts` konsisten. |
| PowerShell error saat menggabungkan perintah dengan `&&` | Windows PowerShell 5.1 tidak mendukung operator `&&` | Gunakan tanda titik koma `;` sebagai pemisah perintah, contoh: `npm run lint; npm run build`. |
