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

### Opsi A — Menjalankan Frontend Saja (Mode Stand-Alone / `localStorage`)

Secara default, frontend SI-KDO BMD sudah dilengkapi seed data dan persistensi `localStorage` lengkap sehingga dapat langsung dijalankan tanpa menunggu setup database eksternal.

1. **Masuk ke direktori `frontend`:**

   ```bash
   cd frontend
   ```

2. **Pasang dependensi:**

   ```bash
   npm install
   ```

3. **Jalankan server development:**

   ```bash
   npm run dev
   ```

4. **Buka aplikasi di browser:**
   Akses URL berikut:

   ```text
   http://localhost:5173/
   ```

---

### Opsi B — Menjalankan dari Root Repository

Dari direktori utama proyek (`bpad-dki/`), Anda dapat menggunakan skrip di [`../package.json`](../package.json):

```bash
# Menjalankan frontend saja
npm run dev:frontend

# Menjalankan backend (:3001) & frontend (:5173) secara bersamaan
npm run dev:all
```

> Catatan: jika menjalankan backend bersamaan, pastikan dependensi root & backend sudah terpasang (`npm install` di root serta konfigurasi database di folder `backend/`).

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

## 4. Akun Demo Bawaan (`seedData.ts`)

Saat aplikasi dibuka pertama kali, data awal dari [`src/data/seedData.ts`](./src/data/seedData.ts) dimuat ke `localStorage`. Berikut akun yang dapat langsung digunakan pada halaman `/login`:

| Username | Password | Role (`code`) | Cakupan SKPD | Hak Akses Utama |
|---|---|---|---|---|
| `admin.bpad` | `admin123` | `ADMIN_BPAD` | Semua SKPD (`null`) | Akses penuh seluruh modul termasuk Users (`/users`) dan Roles (`/roles`) |
| `operator.disdik` | `operator123` | `OPERATOR_SKPD` | Dinas Pendidikan (`id: 1`) | CRUD KDO, Peminjaman, Servis, PNS, & profil SKPD terkait (tanpa Users/Roles) |
| `auditor.bmd` | `auditor123` | `VIEWER` | Semua SKPD (`null`) | Lihat-saja (*read-only*) pada Dashboard, KDO, Peminjaman, Servis, Pajak, PNS, & SKPD |

> Anda juga dapat menekan kartu/tombol **Isi Cepat Akun Demo** di halaman Login untuk mengisi username dan password secara otomatis.

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
5. **Reset Data Demo ke Kondisi Awal**
   - Klik tombol **Reset Data Demo** di bagian bawah sidebar untuk mengembalikan isi `localStorage` ke data awal `INITIAL_SEED_DATA`.

---

## 6. Troubleshooting

| Masalah | Penyebab Umum | Solusi |
|---|---|---|
| Port `5173` sudah digunakan aplikasi lain | Ada instance Vite lain yang masih berjalan | Hentikan proses lama, atau jalankan `npx vite --port 5174` di folder `frontend/`. |
| Perubahan fitur / skema tidak muncul setelah update kode | Data `localStorage` lama tersimpan di browser | Klik **Reset Data Demo** di sidebar, atau hapus key `si_kdo_bmd_db_v1` & `si_kdo_bmd_session_v1` lewat DevTools → *Application* → *Local Storage*. |
| Gagal unggah PDF STNK/BPKB atau banyak foto | Melebihi batas `1.5 MB` (PDF) / `5 MB` (foto) atau kuota `localStorage` penuh (~5 MB per origin) | Kompres file PDF di bawah `1.5 MB`, gunakan foto yang lebih ringkas (foto otomatis dikompres ke WebP ≤ 960px), atau hapus data lama yang tidak terpakai. |
| `npm run build` gagal saat `tsc -b` | Ada ketidaksesuaian tipe TypeScript | Periksa error yang dicetak `tsc -b` di terminal dan pastikan seluruh field di `src/types/bmd.ts` konsisten. |
| PowerShell error saat menggabungkan perintah dengan `&&` | Windows PowerShell 5.1 tidak mendukung operator `&&` | Gunakan tanda titik koma `;` sebagai pemisah perintah, contoh: `npm run lint; npm run build`. |
