import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class OfflineCheckInItem {
  final String activityId;
  final String photoUrl;
  final double latitude;
  final double longitude;
  final DateTime timestamp;

  OfflineCheckInItem({
    required this.activityId,
    required this.photoUrl,
    required this.latitude,
    required this.longitude,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
        'activityId': activityId,
        'photoUrl': photoUrl,
        'latitude': latitude,
        'longitude': longitude,
        'timestamp': timestamp.toIso8601String(),
      };

  factory OfflineCheckInItem.fromJson(Map<String, dynamic> json) => OfflineCheckInItem(
        activityId: json['activityId'],
        photoUrl: json['photoUrl'],
        latitude: (json['latitude'] as num).toDouble(),
        longitude: (json['longitude'] as num).toDouble(),
        timestamp: DateTime.parse(json['timestamp']),
      );
}

class OfflineSyncService {
  static const String _keyPendingCheckIns = 'pending_offline_checkins';

  /// Menyimpan check-in ke antrean lokal saat offline
  static Future<void> savePendingCheckIn(OfflineCheckInItem item) async {
    final prefs = await SharedPreferences.getInstance();
    final List<String> list = prefs.getStringList(_keyPendingCheckIns) ?? [];
    list.add(jsonEncode(item.toJson()));
    await prefs.setStringList(_keyPendingCheckIns, list);
  }

  /// Mengambil daftar antrean check-in lokal
  static Future<List<OfflineCheckInItem>> getPendingCheckIns() async {
    final prefs = await SharedPreferences.getInstance();
    final List<String> list = prefs.getStringList(_keyPendingCheckIns) ?? [];
    return list.map((item) => OfflineCheckInItem.fromJson(jsonDecode(item))).toList();
  }

  /// Menghapus antrean lokal setelah berhasil di-sync ke server
  static Future<void> clearPendingCheckIns() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyPendingCheckIns);
  }
}
