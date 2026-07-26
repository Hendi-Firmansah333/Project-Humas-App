import 'package:flutter/foundation.dart';

class ApiConfig {
  ApiConfig._();

  /// true = backend NestJS + PostgreSQL
  static const bool enabled = true;

  /// Ganti IP ini dengan IP Laptop Anda jika via Wi-Fi, 
  /// atau gunakan '10.0.2.2' jika menggunakan Android Emulator,
  /// atau gunakan '127.0.0.1' jika menggunakan HP Fisik + perintah `adb reverse tcp:3001 tcp:3001`
  static const String devHost = String.fromEnvironment(
    'API_HOST',
    defaultValue: '192.168.1.2', // IP Wi-Fi Laptop Yuda
  );

  static const String devUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'https://cranky-annemarie-ditzily.ngrok-free.dev',
  );

  static const int devPort = 3001;

  static String get baseUrl {
    if (devUrl.isNotEmpty) {
      return devUrl.endsWith('/api') ? devUrl : '$devUrl/api';
    }
    if (kIsWeb) return 'http://localhost:$devPort/api';
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://$devHost:$devPort/api';
    }
    return 'http://127.0.0.1:$devPort/api';
  }
}