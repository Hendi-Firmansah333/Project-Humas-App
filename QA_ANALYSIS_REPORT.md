# 🛡️ QA Audit & System Architecture Report: HUMASS Polinela

> **Analisis Objektif, Penilaian Risk/Celah Sistem, dan Roadmap Arsitektur Enterprise**  
> **Tanggal Audit**: 26 Juli 2026  
> **Target System**: HUMASS — Sistem Informasi Manajemen Kehumasan (Web Admin, Backend API, Mobile App)

---

## 📌 Ringkasan Eksekutif

Aplikasi **HUMASS (Sistem Administrasi Tim Humas Polinela)** dikembangkan dengan fondasi teknologi modern:
- **Backend**: NestJS + Prisma ORM + PostgreSQL
- **Frontend Admin Panel**: Next.js 14 (App Router) + Tailwind CSS
- **Mobile Application**: Flutter + Provider + Dio + Geolocator

Sistem saat ini sudah memenuhi kebutuhan tingkat **MVP (Minimum Viable Product)** hingga **Internal Tool**. Namun, untuk mencapai skala **Enterprise-Grade / System Scale-Up (Kompleksitas Tinggi & High Reliability)**, hasil analisis QA mengidentifikasi beberapa celah krusial terkait kecurangan (*fraud*), efisiensi real-time, penanganan kondisi *offline*, dan otomatisasi pengujian.

---

## 🔍 PART 1: Analisis Objektif Kekurangan & Risiko Sistem

### 1. 📱 Mobile Application (Flutter)
- **Risiko GPS Spoofing & Fake Attendance**:
  - *Masalah*: Check-in berbasis `Geolocator` rentan terhadap penggunaan aplikasi *Fake GPS* atau *Location Mocking* di Android.
  - *Dampak*: Anggota tim dapat memanipulasi lokasi check-in seolah-olah sudah di lokasi liputan.
- **Ketergantungan Media pada Link Manual (Google Drive)**:
  - *Masalah*: Dokumentasi diunggah dengan menempelkan link Google Drive secara manual.
  - *Dampak*: Rentan terhadap link salah/privat, link mati, serta membebankan verifikasi manual pada admin.
- **Absensi Fitur Offline-First**:
  - *Masalah*: Belum ada *Offline Storage Queue* (misal: Hive / Isar).
  - *Dampak*: Saat petugas liputan berada di lokasi minim sinyal, check-in dan unggah bukti akan gagal.
- **Batas Performa State Management & Background Tracking**:
  - *Masalah*: Penggunaan `Provider` dan polling lokasi belum mengoptimalkan *Isolate* background service OS Android secara konsisten saat mode hemat baterai aktif.

### 2. ⚙️ Backend REST API (NestJS + Prisma)
- **High Server Load akibat HTTP Polling pada Live Location**:
  - *Masalah*: Pemantauan lokasi tim menggunakan metode REST polling berkala.
  - *Dampak*: Overhead request HTTP tinggi, memicu pemborosan CPU server dan baterai perangkat mobile.
- **Potensi Race Condition pada Peminjaman Alat & Check-in**:
  - *Masalah*: Belum diterapkan *Atomic Transactions* atau *Pessimistic/Optimistic Locking* yang ketat saat status peminjaman alat atau kuota alat diakses bersamaan.
- **Kurangnya Rate Limiting & Protection Guard**:
  - *Masalah*: Throttling pada endpoint sensitif (login, upload, update koordinat) belum dikonfigurasi secara ketat.
  - *Dampak*: Rentan terhadap serangan *Brute Force* dan *Denial of Service (DoS)*.
- **Audit Logging Belum Menyimpan State Delta**:
  - *Masalah*: Model `AuditLog` hanya menyimpan meta aksi dasar, belum merekam *JSON Diff* data sebelum dan sesudah perubahan untuk forensik audit.

### 3. 🖥️ Web Admin Panel (Next.js 14)
- **Export Laporan Berbasis Synchronous Request**:
  - *Masalah*: Pembuatan PDF/Excel dilakukan secara langsung pada HTTP thread utama.
  - *Dampak*: Berpotensi *HTTP Timeout* atau UI *freeze* jika data transaksi/riwayat mencapai puluhan ribu baris.
- **Client-Side Error Recovery & Boundaries**:
  - *Masalah*: Penanganan *Error Boundary* komponen UI belum terisolasi penuh jika terjadi *partial API outage*.

### 4. 🧪 QA & DevOps Infrastructure
- **Cakupan Testing Masih Minimal**:
  - Belum ada pengujian otomatis *Widget Test*, *Integration Test*, maupun *E2E Test* (Playwright/Cypress untuk web, Patrol untuk mobile).
- **Belum Ada Automated CI/CD & Load Testing**:
  - Belum ada pipeline pengujian beban (*Load Testing* dengan k6/Locust) untuk menguji ketahanan server saat puluhan petugas check-in bersamaan.

---

## 🚀 PART 2: Persyaratan Modul untuk Menjadikan Sistem "Kompleks" (Enterprise-Grade)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      ARSITEK SISTEM HUMASS ENTERPRISE                           │
├─────────────────────────┬─────────────────────────┬─────────────────────────────┤
│   REAL-TIME & ASYNC     │    SECURITY & FRAUD     │     ADVANCED ENGINE         │
│ ┌─────────────────────┐ │ ┌─────────────────────┐ │ ┌─────────────────────────┐ │
│ │ Socket.io WebSocket │ │ │ Anti-Mock Location  │ │ │ Offline-First Sync Engine│ │
│ │ BullMQ + Redis Queue│ │ │ Exif Metadata Check │ │ │ Automated Approval Engine│ │
│ │ MinIO / S3 Storage  │ │ │ Strict RBAC & Diff  │ │ │ Micro-Services / Worker  │ │
│ └─────────────────────┘ │ └─────────────────────┘ │ └─────────────────────────┘ │
└─────────────────────────┴─────────────────────────┴─────────────────────────────┘
```

### 1. Arsitektur Real-Time & Asynchronous Task Processing
1. **WebSocket Gateway (Socket.io / NestJS WebSockets)**:
   - Streaming koordinat tim secara real-time tanpa overhead polling HTTP.
2. **Background Job Queue (BullMQ + Redis)**:
   - Pengiriman *Push Notification* massal dan pembuatan laporan PDF/Excel secara *asynchronous* melalui background worker.
3. **Direct S3 / MinIO Storage + Presigned URL**:
   - Pengunggahan media foto/video langsung dari mobile ke S3 Object Storage tanpa perantara link manual.

### 2. Keamanan & Integrity Guard (Anti-Kecurangan)
1. **Anti-Mock Location & Integrity Check**:
   - Deteksi perangkat *rooted*, *jailbroken*, atau yang menggunakan *Developer Mock Location App*.
2. **Ekstraksi EXIF Metadata Foto**:
   - Server memverifikasi metadata timestamp dan lokasi GPS asli yang tertanam pada file image EXIF.
3. **Biometric Authentication**:
   - Autentikasi sidik jari/FaceID untuk konfirmasi serah-terima alat dan validasi kegiatan penting.

### 3. Dynamic Workflow Engine & Enterprise Features
1. **Dynamic Approval Engine**:
   - Alur persetujuan peminjaman alat & kegiatan multi-level (Anggota ➔ PIC ➔ Admin Humas ➔ Validator).
2. **Offline-First Sync Engine (Flutter)**:
   - Penyimpanan data check-in lokal (Hive/Isar) saat sinyal terputus, dengan fitur auto-sync saat jaringan kembali normal.
3. **Inventory Condition & Depreciation Tracking**:
   - Pencatatan riwayat kerusakan dan perawatan inventaris alat humas.

### 4. QA Automation & Monitoring Framework
1. **Load & Stress Testing (k6 / Locust)**:
   - Pengujian kekuatan server menampung spike trafik saat puncak kegiatan liputan.
2. **Automated E2E Testing (Playwright & Patrol)**:
   - Pengujian alur bisnis penuh dari registrasi, check-in, hingga persetujuan laporan secara otomatis.
3. **Centralized APM & Crash Reporting (Sentry & OpenTelemetry)**:
   - Pelacakan bug dan crash di perangkat pengguna secara real-time.

---

## 📊 PART 3: QA Readiness Scorecard (Matriks Kesiapan)

| Kategori Evaluasi | Status Saat Ini (MVP) | Target Enterprise | Priority Level |
| :--- | :---: | :---: | :---: |
| **Autentikasi & RBAC** | ✅ JWT + Role | 🔶 Permissions + Device Binding | Medium |
| **Validasi Lokasi (GPS)** | ⚠️ Basic GPS (Rentan Mock) | 🛑 Anti-Mock Location + EXIF Extractor | **HIGH (Urgent)** |
| **Manajemen Media** | ⚠️ Link Google Drive Manual | 🛑 Direct Upload S3 / MinIO + Presigned URL | **HIGH (Urgent)** |
| **Real-time Tracking** | ⚠️ HTTP Polling | 🛑 Socket.io WebSocket Gateway | **HIGH (Urgent)** |
| **Resiliensi Jaringan** | ❌ Online Only | 🛑 Offline-First + Background Sync Engine | Medium |
| **Job Queue & Export** | ⚠️ Synchronous | 🛑 BullMQ + Redis Queue Worker | Medium |
| **QA Automation** | ⚠️ Unit Test Dasar | 🛑 Full E2E (Playwright & Patrol) + k6 | **HIGH (Urgent)** |
| **Monitoring System** | ❌ Belum Ada | 🛑 Sentry + APM Dashboard (Grafana) | Low |

---

## 🎯 PART 4: Roadmap Rencana Aksi (Action Plan)

1. **Fase 1 — Hardening Keamanan & Media Pipeline**:
   - Tambahkan package `safe_device` pada aplikasi Flutter.
   - Integrasikan MinIO / Cloudinary / AWS S3 Direct Upload.
2. **Fase 2 — Performa & Asynchronous Engine**:
   - Implementasikan NestJS WebSocket Gateway.
   - Pasang Redis + BullMQ untuk antrean laporan dan notifikasi.
3. **Fase 3 — QA Automation & Testing**:
   - Susun test suite E2E Playwright untuk Web Admin.
   - Jalankan script k6 untuk load testing backend NestJS.

---
