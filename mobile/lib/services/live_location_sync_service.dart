import 'dart:async';

import 'package:poli_humas/config/api_config.dart';
import 'package:poli_humas/services/api_client.dart';
import 'package:poli_humas/services/api_service.dart';
import 'package:poli_humas/services/location_service.dart';

/// Mengirim koordinat GPS anggota humas ke backend agar web admin dapat memantau.
class LiveLocationSyncService {
  LiveLocationSyncService._();

  static final LiveLocationSyncService instance = LiveLocationSyncService._();

  static const _syncInterval = Duration(seconds: 30);

  Timer? _timer;
  bool _syncing = false;

  bool get isRunning => _timer != null;

  void start() {
    if (!ApiConfig.enabled || !ApiClient.instance.hasToken) return;
    stop();
    _pushLocation();
    _timer = Timer.periodic(_syncInterval, (_) => _pushLocation());
  }

  Future<void> stop({bool markOffline = true}) async {
    _timer?.cancel();
    _timer = null;
    if (markOffline && ApiConfig.enabled && ApiClient.instance.hasToken) {
      try {
        await ApiService.instance.syncLocation(
          latitude: -5.3585,
          longitude: 105.2345,
          address: 'Tidak aktif',
          isOnline: false,
        );
      } catch (_) {}
    }
  }

  Future<void> pushNow() => _pushLocation();

  Future<void> _pushLocation() async {
    if (!ApiConfig.enabled || !ApiClient.instance.hasToken || _syncing) return;
    _syncing = true;
    try {
      final position = await LocationService.instance.getCurrentPosition();
      await ApiService.instance.syncLocation(
        latitude: position.latitude,
        longitude: position.longitude,
        address: 'Lokasi lapangan (${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)})',
        isOnline: true,
      );
    } catch (_) {
      // GPS tidak tersedia — tetap tandai online dengan koordinat terakhir dari seed/backend.
    } finally {
      _syncing = false;
    }
  }
}