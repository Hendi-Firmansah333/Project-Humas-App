# HUMAS POLINELA — Mobile App

> Bagian **mobile** dari monorepo [`Project-Humas-App`](../README.md). Jalankan perintah Flutter dari folder `mobile/` ini.

Aplikasi mobile **Flutter** untuk Tim Humas Politeknik Negeri Lampung (POLINELA). Digunakan oleh anggota tim lapangan untuk mengelola kegiatan, konten, notifikasi, check-in lokasi, dan monitoring live location.

| Info | Detail |
|------|--------|
| **Nama paket** | `poli_humas` |
| **Platform** | Android (utama), iOS, Web, Windows |
| **Framework** | Flutter 3.x / Dart 3.11+ |
| **Backend** | NestJS API di `../backend/` |
| **Peta** | OpenStreetMap via `flutter_map` |

---

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Persyaratan](#persyaratan)
- [Instalasi](#instalasi)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Login Demo](#login-demo-offline-mode)
- [Konfigurasi API Backend](#konfigurasi-api-backend)
- [Struktur Proyek](#struktur-proyek)
- [Kolaborasi GitHub](#kolaborasi-github)
- [Build APK](#build-apk)
- [Catatan Pengembangan](#catatan-pengembangan)

---

## Fitur Utama

### Beranda & Navigasi
- Dashboard ringkasan kegiatan dan akses cepat ke modul utama
- Bottom navigation: Beranda, Activities, Content, Alerts, Profile

### Kegiatan (Activities)
- Daftar kegiatan aktif dan riwayat
- Detail kegiatan dengan timeline
- **Check-in kehadiran** dengan validasi geofence (GPS)
- Upload selfie dan dokumentasi kegiatan

### Content Plan
- Daftar rencana konten dengan deadline dan progress
- Detail tugas konten (video, poster, proof upload)

### Notifikasi
- Daftar notifikasi dengan badge unread
- Detail notifikasi terkait kegiatan atau content plan

### Live Location
- Peta lokasi anggota tim secara real-time (marker)
- Filter berdasarkan divisi dan status bertugas
- Detail profil anggota dari peta

### Profil & Pengaturan
- Edit profil, ubah password
- Pengaturan notifikasi, lokasi, dark mode
- Halaman bantuan dan tentang aplikasi

### Mode Offline
- Aplikasi dapat berjalan dengan **data mock lokal** tanpa backend
- Banner offline saat koneksi terputus
- Data terakhir disimpan di perangkat

---

## Tech Stack

| Kategori | Library / Layanan |
|----------|-------------------|
| State management | `provider` |
| HTTP client | `dio` |
| Peta | `flutter_map`, `latlong2`, OpenStreetMap tiles |
| Lokasi | `geolocator` |
| Konektivitas | `connectivity_plus` |
| Penyimpanan lokal | `shared_preferences` |
| Media | `image_picker`, `file_picker` |
| UI/Animasi | `flutter_animate`, `lottie`, `shimmer`, `skeletonizer` |

---

## Persyaratan

Pastikan sudah terinstall:

- [Flutter SDK](https://docs.flutter.dev/get-started/install) (3.11+)
- [Git](https://git-scm.com/)
- Android Studio / VS Code + extension Flutter
- Android SDK (untuk build Android)
- (Opsional) Backend NestJS jika `ApiConfig.enabled = true`

Cek instalasi:

```bash
flutter doctor
```

---

## Instalasi

### 1. Clone repository

```bash
git clone <url-repo-Project-Humas-App>
cd Project-Humas-App/mobile
```

### 2. Install dependensi

```bash
flutter pub get
```

### 3. File yang tidak di-commit

File berikut **tidak** ada di repo dan dibuat otomatis di mesin masing-masing:

- `android/local.properties` — path Android SDK lokal
- `build/`, `.dart_tool/` — hasil build & cache

---

## Menjalankan Aplikasi

### Android (device fisik — disarankan)

```bash
flutter devices
flutter run
```

### Android dengan IP backend custom

```bash
flutter run --dart-define=API_HOST=192.168.x.x
```

### Emulator Android

Untuk backend lokal di PC yang sama, gunakan `10.0.2.2` sebagai host (bukan IP LAN).

---

## Login Demo (Offline Mode)

Secara default aplikasi berjalan di **mode offline** (`ApiConfig.enabled = false`).

| Field | Nilai |
|-------|-------|
| Username | bebas (tidak boleh kosong) |
| Password | `Humas@123` |

> Password default dapat diubah dari menu **Profil → Ubah Password**.

---

## Konfigurasi API Backend

File konfigurasi: `lib/config/api_config.dart`

```dart
static const bool enabled = false;  // ubah ke true untuk pakai backend API
static const String devHost = '192.168.117.123';  // IP PC backend
static const int devPort = 8000;
```

### Endpoint yang digunakan (saat API aktif)

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Profil user |
| GET | `/api/activities` | Daftar kegiatan |
| GET | `/api/activities/history` | Riwayat kegiatan |
| POST | `/api/activities/{id}/check-in` | Check-in |
| GET | `/api/content-plans` | Rencana konten |
| GET | `/api/notifications` | Notifikasi |
| GET | `/api/team-locations` | Lokasi tim |

Backend NestJS berada di folder [`../backend/`](../backend/README.md) dalam monorepo yang sama.

---

## Struktur Proyek

```
mobile/
├── lib/
│   ├── config/          # Konfigurasi API
│   ├── data/            # Mock & seed data
│   ├── models/          # Data models
│   ├── providers/       # State management (Provider)
│   ├── repositories/    # Data layer
│   ├── screens/         # Halaman UI
│   │   ├── activities/  # Kegiatan & check-in
│   │   ├── content/     # Content plan
│   │   └── profile/     # Profil & pengaturan
│   ├── services/        # API, auth, lokasi, storage
│   ├── theme/           # Warna & tema
│   ├── widgets/         # Komponen reusable (peta, dll.)
│   └── main.dart        # Entry point
├── assets/images/       # Logo & aset splash
├── android/             # Konfigurasi Android
├── ios/                 # Konfigurasi iOS
├── gambar/              # Screenshot referensi UI
└── test/                # Unit & widget test
```

---

## Kolaborasi GitHub

### Clone (anggota tim baru)

```bash
git clone <url-repo-Project-Humas-App>
cd Project-Humas-App/mobile
flutter pub get
```

### Workflow harian (monorepo)

```bash
# Dari root monorepo
cd Project-Humas-App
git pull

# Setelah edit mobile
git add mobile/
git commit -m "mobile: deskripsi perubahan"
git push
```

### Menjadi collaborator

1. Owner repo: **Settings → Collaborators → Add people**
2. Masukkan username GitHub teman
3. Teman terima undangan, lalu `git clone` repo

### Tips menghindari conflict

- Selalu `git pull` sebelum mulai edit
- Komunikasikan file yang sedang dikerjakan
- Commit message yang jelas dan spesifik

---

## Build APK

### Debug APK

```bash
flutter build apk --debug
```

Output: `build/app/outputs/flutter-apk/app-debug.apk`

### Release APK

```bash
flutter build apk --release
```

Output: `build/app/outputs/flutter-apk/app-release.apk`

---

## Catatan Pengembangan

### Peta (Maps)
- Tile: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
- Widget utama: `lib/widgets/app_map_view.dart`
- Belum ada polyline/rute — hanya marker lokasi

### Izin Android
Pastikan izin lokasi dan kamera sudah diaktifkan di perangkat untuk fitur check-in dan live location.

### Screenshot UI
Folder `gambar/` berisi referensi desain tiap halaman aplikasi.

---

## Tim

**Tim Humas POLINELA** — Politeknik Negeri Lampung

| Role | Keterangan |
|------|------------|
| Mobile App | Folder `mobile/` |
| Admin Web | Folder `frontend/` |
| Backend API | Folder `backend/` |

---

## Lisensi

Proyek internal Tim Humas POLINELA. Hubungi admin tim untuk keperluan distribusi atau penggunaan di luar lingkungan resmi.