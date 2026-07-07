# 🎓 HUMASS — Sistem Administrasi Tim Humas Polinela

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
</p>

> **HUMASS** adalah sistem informasi manajemen kehumasan berbasis web & mobile untuk **Politeknik Negeri Lampung (Polinela)**. Sistem ini memudahkan Admin Humas dalam mengelola kegiatan liputan, jadwal tim, dokumentasi, peminjaman alat, dan pelaporan secara terpusat dan real-time.

---

## 📁 Struktur Repositori

```
Project-Humas-App/
├── backend/          # REST API — NestJS + Prisma + PostgreSQL
├── frontend/         # Admin Panel — Next.js 14 (App Router)
├── mobile/           # Aplikasi Anggota Tim — Flutter
└── docker-compose.yml
```

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────┐       REST API        ┌──────────────────────────┐
│   Admin Panel Web   │ ◄───────────────────► │    NestJS Backend API    │
│   (Next.js 14)      │       JWT Auth         │    Port :3001            │
└─────────────────────┘                        └────────────┬─────────────┘
                                                            │ Prisma ORM
┌─────────────────────┐       REST API         ┌────────────▼─────────────┐
│   Aplikasi Mobile   │ ◄───────────────────► │    PostgreSQL Database   │
│   (Flutter)         │       JWT Auth         │    Port :5432            │
└─────────────────────┘                        └──────────────────────────┘
```

---

## ✅ Progress Pengembangan

### Backend (NestJS)

| Modul               | Status        | Keterangan |
|---------------------|---------------|------------|
| Auth (JWT)          | ✅ Selesai    | Login, refresh token, role-based access |
| Users               | ✅ Selesai    | CRUD pengguna, ganti password, profil |
| Activities          | ✅ Selesai    | Manajemen kegiatan, check-in GPS, validasi admin |
| Content Plans       | ✅ Selesai    | Perencanaan konten tim humas |
| Equipment Loans     | ✅ Selesai    | Peminjaman & pengembalian alat |
| Live Location       | ✅ Selesai    | Tracking posisi tim real-time |
| Schedules (Piket)   | ✅ Selesai    | Jadwal piket harian (dipakai oleh Android) |
| Reports             | ✅ Selesai    | Laporan kegiatan & peminjaman |
| Notifications       | ✅ Selesai    | Notifikasi push ke anggota tim |
| Dashboard           | ✅ Selesai    | Statistik & ringkasan data |
| Swagger API Docs    | ✅ Selesai    | `GET /api/docs` |

### Frontend Admin Panel (Next.js 14)

| Halaman                   | Status        | Keterangan |
|---------------------------|---------------|------------|
| Login                     | ✅ Selesai    | Auth dengan JWT |
| Dashboard                 | ✅ Selesai    | Statistik, grafik, ringkasan |
| Kegiatan (list)           | ✅ Selesai    | List, filter, status badge |
| Kegiatan (detail)         | ✅ Selesai    | Detail lengkap, check-in anggota, dokumentasi, validasi |
| Content Plan              | ✅ Selesai    | Manajemen rencana konten |
| Live Location Tim         | ✅ Selesai    | Peta posisi tim real-time |
| Peminjaman Alat           | ✅ Selesai    | Manajemen peminjaman & pengembalian alat |
| Pengguna                  | ✅ Selesai    | CRUD anggota & admin |
| Riwayat Kegiatan          | ✅ Selesai    | Kegiatan selesai/dibatalkan |
| Riwayat Content Plan      | ✅ Selesai    | History content plan |
| Riwayat Peminjaman        | ✅ Selesai    | History peminjaman alat |
| Laporan                   | ✅ Selesai    | Cetak & export laporan |
| Profil                    | ✅ Selesai    | Edit profil & ganti password |
| Jadwal Piket              | ✅ Selesai    | Terintegrasi dengan Android |
| Sidebar (Revisi)          | ✅ Selesai    | Collapsible Riwayat, section header, responsive |

### Aplikasi Mobile (Flutter)

| Fitur                     | Status        | Keterangan |
|---------------------------|---------------|------------|
| Login & Auth              | ✅ Selesai    | JWT token, persist session |
| Home Screen               | ✅ Selesai    | Daftar kegiatan & jadwal |
| Check-In Kegiatan         | ✅ Selesai    | Selfie + validasi GPS otomatis |
| Upload Dokumentasi        | ✅ Selesai    | Link Google Drive |
| Live Location             | ✅ Selesai    | Kirim & lihat posisi tim |
| Notifikasi                | ✅ Selesai    | Terima notifikasi kegiatan |
| Profil Anggota            | ✅ Selesai    | Edit profil, foto |
| Riwayat Kegiatan          | ✅ Selesai    | History kegiatan anggota |
| Global Search             | ✅ Selesai    | Cari kegiatan & konten |

---

## 🔄 Alur Bisnis Sistem — Kegiatan

```
1. Admin membuat kegiatan
       ↓
2. Admin memilih PIC & anggota tim
       ↓
3. Kegiatan muncul di aplikasi Android anggota
       ↓
4. PIC & anggota melakukan Check-in
   (selfie + validasi GPS otomatis)
       ↓
5. Anggota/PIC upload Link Dokumentasi (Google Drive)
       ↓
6. Data check-in & dokumentasi masuk ke Admin Panel
       ↓
7. Admin memonitor detail kegiatan
       ↓
8. Admin melakukan Validasi Kegiatan
   (cek semua syarat terpenuhi)
       ↓
9. Status → SELESAI
       ↓
10. Data otomatis pindah ke Riwayat Kegiatan
```

---

## 🗂️ Fitur Utama

### 🔐 Autentikasi & Otorisasi
- JWT Authentication dengan refresh token
- Role-Based Access Control: `ADMIN` dan `ANGGOTA`
- Guard middleware di seluruh endpoint API

### 📋 Manajemen Kegiatan
- Buat, edit, dan hapus kegiatan liputan
- Penugasan **PIC** (Penanggung Jawab) & anggota tim
- Status tracking: `UPCOMING` → `ONGOING` → `SELESAI` / `DIBATALKAN`
- Monitoring check-in anggota: waktu, koordinat GPS, foto selfie
- Upload link dokumentasi Google Drive
- **Validasi Admin** dengan checklist verifikasi
- Status keterlambatan check-in (tepat waktu / terlambat)

### 📅 Content Plan
- Perencanaan konten kehumasan
- Manajemen status, platform, dan penanggung jawab
- Riwayat content plan yang sudah selesai

### 📍 Live Location Tim
- Tracking posisi anggota tim secara real-time
- Tampilan peta interaktif (Flutter Map)
- Riwayat pergerakan

### 🔧 Peminjaman Alat
- Manajemen inventaris alat kehumasan
- Proses peminjaman & pengembalian
- Riwayat peminjaman per anggota

### 🗓️ Jadwal Piket
- Penjadwalan piket harian anggota tim
- Terintegrasi dengan aplikasi Android
- Notifikasi pengingat

### 📊 Dashboard & Laporan
- Statistik kegiatan, anggota aktif, peminjaman
- Grafik aktivitas bulanan
- Export laporan kegiatan & peminjaman

### 👥 Manajemen Pengguna
- CRUD admin dan anggota
- Ganti password sendiri
- Edit profil & foto

---

## 🛠️ Tech Stack

### Backend
| Teknologi     | Versi   | Kegunaan |
|---------------|---------|----------|
| NestJS        | v10+    | Framework REST API |
| Prisma ORM    | v5+     | Database query & migration |
| PostgreSQL    | v16     | Database utama |
| JWT / Passport| -       | Autentikasi & otorisasi |
| Swagger       | -       | Dokumentasi API otomatis |
| Docker        | -       | Containerisasi database |

### Frontend (Admin Panel)
| Teknologi     | Versi   | Kegunaan |
|---------------|---------|----------|
| Next.js       | v14     | Framework React (App Router) |
| TypeScript    | v5+     | Type-safe development |
| Tailwind CSS  | v3+     | Styling komponen |
| Axios         | -       | HTTP client |

### Mobile
| Teknologi              | Versi   | Kegunaan |
|------------------------|---------|----------|
| Flutter / Dart         | SDK ^3.11.1 | Framework mobile cross-platform |
| Provider               | ^6.1.5  | State management |
| Dio                    | ^5.8.0  | HTTP client |
| Geolocator             | ^14.0.2 | Validasi GPS check-in |
| Flutter Map            | ^8.1.1  | Peta interaktif live location |
| Image Picker           | ^1.1.2  | Selfie check-in |
| Shared Preferences     | ^2.5.3  | Persist session |
| Flutter Animate        | ^4.5.2  | Animasi UI |
| Cached Network Image   | ^3.4.1  | Optimasi gambar |
| Lottie                 | ^3.3.3  | Animasi Lottie |

---

## 🚀 Cara Menjalankan Lokal

### Prasyarat
- Node.js ≥ 18
- Flutter SDK ≥ 3.11
- Docker Desktop
- PostgreSQL (via Docker)

### 1. Jalankan Database
```bash
docker-compose up -d
```

### 2. Backend (NestJS)
```bash
cd backend
npm install
cp .env.example .env          # sesuaikan DATABASE_URL & JWT_SECRET
npx prisma migrate dev
npx prisma generate
npm run start:dev             # berjalan di http://localhost:3001
```

**API Documentation:** `http://localhost:3001/api/docs`

### 3. Frontend Admin Panel (Next.js)
```bash
cd frontend
npm install
cp .env.example .env.local    # sesuaikan NEXT_PUBLIC_API_URL
npm run dev                   # berjalan di http://localhost:3000
```

### 4. Mobile (Flutter)
```bash
cd mobile
flutter pub get
# Sesuaikan base URL API di lib/config/
flutter run
```

---

## 📡 API Endpoints Utama

| Endpoint                          | Method | Role  | Keterangan |
|-----------------------------------|--------|-------|------------|
| `/api/auth/login`                 | POST   | All   | Login & dapatkan JWT |
| `/api/activities`                 | GET    | All   | Daftar kegiatan |
| `/api/activities`                 | POST   | Admin | Buat kegiatan baru |
| `/api/activities/:id`             | GET    | All   | Detail kegiatan |
| `/api/activities/:id/check-in`    | POST   | Mobile| Check-in anggota |
| `/api/activities/:id/documentation`| POST  | Mobile| Upload dokumentasi |
| `/api/activities/:id/validate`    | PATCH  | Admin | Validasi kegiatan |
| `/api/activities/history`         | GET    | All   | Riwayat kegiatan |
| `/api/content-plans`              | GET    | All   | Daftar content plan |
| `/api/equipment-loans`            | GET    | All   | Daftar peminjaman |
| `/api/live-location`              | GET    | All   | Posisi tim real-time |
| `/api/schedules`                  | GET    | All   | Jadwal piket |
| `/api/reports`                    | GET    | Admin | Laporan |
| `/api/dashboard`                  | GET    | Admin | Statistik dashboard |
| `/api/users`                      | GET    | Admin | Daftar pengguna |
| `/api/notifications`              | GET    | All   | Daftar notifikasi |

---

## 📂 Struktur Frontend (Halaman)

```
frontend/src/app/
├── dashboard/              # Statistik & ringkasan
├── kegiatan/               # Daftar kegiatan
│   └── [id]/               # Detail & monitoring kegiatan
├── content-plan/           # Manajemen content plan
├── live-location/          # Peta posisi tim
├── peminjaman-alat/        # Peminjaman alat
├── pengguna/               # Manajemen anggota & admin
├── jadwal-piket/           # Jadwal piket (terhubung ke Android)
├── riwayat-kegiatan/       # Kegiatan selesai
├── riwayat-content-plan/   # History content plan
├── riwayat-peminjaman/     # History peminjaman alat
├── laporan/                # Export laporan
├── profil/                 # Profil & ganti password
└── login/                  # Halaman login
```

---

## 📂 Struktur Backend (Modul)

```
backend/src/
├── auth/                   # Autentikasi JWT
├── users/                  # Manajemen pengguna & password
├── activities/             # Kegiatan + check-in + validasi
├── content-plans/          # Perencanaan konten
├── equipment-loans/        # Peminjaman alat
├── live-location/          # Tracking posisi real-time
├── schedules/              # Jadwal piket
├── reports/                # Laporan & export
├── notifications/          # Notifikasi push
├── dashboard/              # Statistik & agregasi data
├── prisma/                 # Koneksi database
└── common/                 # Guards, filters, interceptors
```

---

## 🔧 Variabel Environment

### Backend (`.env`)
```env
DATABASE_URL="postgresql://humas:yuda@localhost:5432/Polihumas?schema=public"
JWT_SECRET="your-jwt-secret-key"
PORT=3001
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 🗒️ Changelog

### v1.2.0 — Juli 2026 (Update Terkini)
- **[NEW]** Revisi total halaman Detail Kegiatan sesuai alur bisnis sistem
- **[NEW]** Monitoring check-in anggota: selfie, koordinat GPS, status keterlambatan
- **[NEW]** Fitur Validasi Kegiatan oleh Admin dengan modal konfirmasi checklist
- **[NEW]** Tombol upload & tampilan link dokumentasi Google Drive
- **[NEW]** Halaman Riwayat Content Plan (`/riwayat-content-plan`)
- **[NEW]** Halaman Riwayat Peminjaman (`/riwayat-peminjaman`)
- **[NEW]** DTO `UpdatePasswordDto` untuk fitur ganti password
- **[REVISI]** Sidebar direkonstruksi: section header OPERASIONAL / MANAJEMEN / AKUN
- **[REVISI]** Menu Riwayat menjadi collapsible dengan 3 sub-menu
- **[REVISI]** Icon seluruh menu sidebar konsisten & tombol Keluar pakai icon logout
- **[FIX]** TypeScript error pada `setSelectedPhoto` dan `CustomButton` prop
- **[FIX]** Perbaikan spacing, active state highlight, dan responsivitas sidebar

### v1.1.0 — Juni 2026
- Integrasi modul Live Location Tim dengan Flutter Map
- Modul Peminjaman Alat (CRUD + status pengembalian)
- Modul Content Plan
- Jadwal Piket (terintegrasi Android)

### v1.0.0 — Mei 2026
- Inisialisasi project (NestJS + Next.js + Flutter)
- Modul Auth JWT + Role-based access
- Modul Dashboard & Kegiatan dasar
- Setup Prisma ORM + PostgreSQL + Docker

---

## 👨‍💻 Tim Pengembang

| Nama              | Peran |
|-------------------|-------|
| Hendi Firmansah   | Fullstack Developer (Web + Mobile + Backend) |

---

## 📄 Lisensi

Proyek ini dikembangkan untuk keperluan internal **Tim Humas Politeknik Negeri Lampung**.  
Hak cipta © 2026 — Politeknik Negeri Lampung.