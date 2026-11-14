import 'dart:async';
import 'package:flutter/material.dart';
import 'package:poli_humas/config/api_config.dart';
import 'package:poli_humas/services/api_client.dart';
import 'package:poli_humas/services/api_service.dart';
import 'package:poli_humas/services/location_service.dart';
import 'package:poli_humas/services/local_storage.dart';
import 'package:poli_humas/theme/app_colors.dart';

/// Mengirim koordinat GPS anggota humas ke backend agar web admin dapat memantau.
/// Sesuai dengan UU PDP No. 27/2022 Pasal 20: Mewajibkan persetujuan eksplisit (consent) pengguna.
class LiveLocationSyncService {
  LiveLocationSyncService._();

  static final LiveLocationSyncService instance = LiveLocationSyncService._();

  static const _syncInterval = Duration(seconds: 30);
  static const _consentKey = 'user_location_consent_pdp';

  Timer? _timer;
  bool _syncing = false;
  double? _lastLatitude;
  double? _lastLongitude;
  String? _lastAddress;

  bool get isRunning => _timer != null;

  /// Memeriksa status persetujuan pelacakan lokasi (UU PDP)
  Future<bool> hasConsent() async {
    final consent = await LocalStorage.getBool(_consentKey);
    return consent == true;
  }

  /// Menyimpan status persetujuan pengguna
  Future<void> setConsent(bool consent) async {
    await LocalStorage.setBool(_consentKey, consent);
    if (!consent) {
      await stop(markOffline: true);
    }
  }

  /// Menampilkan dialog persetujuan (Consent) resmi UU PDP jika belum pernah disetujui
  Future<bool> ensureConsent(BuildContext context) async {
    final existing = await LocalStorage.getBool(_consentKey);
    if (existing != null) return existing;

    if (!context.mounted) return false;

    final agreed = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.security, color: AppColors.primary),
            SizedBox(width: 8),
            Expanded(
              child: Text(
                'Persetujuan Privasi Lokasi',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Berdasarkan UU Perlindungan Data Pribadi (UU PDP No. 27/2022 Pasal 20):',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87),
            ),
            SizedBox(height: 8),
            Text(
              'Aplikasi HUMAS POLINELA membutuhkan izin Anda untuk memantau koordinat lokasi tim secara berkala (tiap 30 detik) secara real-time.\n\n'
              'Tujuan Pemrosesan:\n'
              '• Monitoring keamanan & koordinasi tugas liputan aktif.\n'
              '• Validasi kehadiran saat penugasan lapangan di lingkungan kampus.\n\n'
              'Data lokasi hanya dapat diakses oleh Admin Humas & Kepala Humas Polinela selama penugasan dan tidak dibagikan ke pihak ketiga.',
              style: TextStyle(fontSize: 12, color: Colors.black54, height: 1.4),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Tolak', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Setuju & Izinkan', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    final result = agreed ?? false;
    await setConsent(result);
    return result;
  }

  /// Memulai sinkronisasi lokasi dengan validasi consent
  Future<void> start() async {
    if (!ApiConfig.enabled || !ApiClient.instance.hasToken) return;

    final consent = await hasConsent();
    if (!consent) {
      // Pelacakan tidak aktif jika pengguna belum memberikan persetujuan (UU PDP)
      return;
    }

    stop();
    _pushLocation();
    _timer = Timer.periodic(_syncInterval, (_) => _pushLocation());
  }

  Future<void> stop({bool markOffline = true}) async {
    _timer?.cancel();
    _timer = null;
    if (markOffline &&
        ApiConfig.enabled &&
        ApiClient.instance.hasToken &&
        _lastLatitude != null &&
        _lastLongitude != null) {
      try {
        await ApiService.instance.syncLocation(
          latitude: _lastLatitude!,
          longitude: _lastLongitude!,
          address: _lastAddress ?? 'Tidak aktif',
          isOnline: false,
        );
      } catch (_) {}
    }
  }

  Future<void> pushNow() async {
    final consent = await hasConsent();
    if (!consent) return;
    await _pushLocation();
  }

  Future<void> _pushLocation() async {
    if (!ApiConfig.enabled || !ApiClient.instance.hasToken || _syncing) return;
    final consent = await hasConsent();
    if (!consent) return;

    _syncing = true;
    try {
      final position = await LocationService.instance.getCurrentPosition();
      final address =
          'Lokasi lapangan (${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)})';
      _lastLatitude = position.latitude;
      _lastLongitude = position.longitude;
      _lastAddress = address;

      await ApiService.instance.syncLocation(
        latitude: position.latitude,
        longitude: position.longitude,
        address: address,
        isOnline: true,
      );
    } catch (_) {
      // GPS tidak tersedia — biarkan lokasi terakhir tetap tersimpan.
    } finally {
      _syncing = false;
    }
  }
}