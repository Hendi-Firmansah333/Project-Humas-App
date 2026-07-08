import 'package:flutter/foundation.dart';

class ApiConfig {
  ApiConfig._();

  /// true = backend NestJS + PostgreSQL
  static const bool enabled = true;

  static const String devHost = String.fromEnvironment(
    'API_HOST',
    defaultValue: '192.168.117.123',
  );

  static const String devUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: '',
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