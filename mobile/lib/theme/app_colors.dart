import 'package:flutter/material.dart';
import 'package:poli_humas/services/app_settings_service.dart';

class AppColors {
  static bool get isDark => AppSettingsService.instance.darkModeEnabled;

  static const primary = Color(0xFF0D9488);
  static const primaryDark = Color(0xFF1A5C5C);
  static const primaryLight = Color(0xFFB2DFDB);
  static const accent = Color(0xFF00B4D8);

  static Color get background => isDark ? const Color(0xFF111827) : const Color(0xFFF5F7FA);
  static Color get card => isDark ? const Color(0xFF1F2937) : Colors.white;
  static Color get textPrimary => isDark ? Colors.white : const Color(0xFF1A1A1A);
  static Color get textSecondary => isDark ? const Color(0xFF9CA3AF) : const Color(0xFF6B7280);

  static const success = Color(0xFF22C55E);
  static const warning = Color(0xFFF59E0B);
  static const danger = Color(0xFFEF4444);
  static const purple = Color(0xFF8B5CF6);

  static Color get purpleLight => isDark ? const Color(0xFF2E1065) : const Color(0xFFEDE9FE);
  static Color get blueLight => isDark ? const Color(0xFF082F49) : const Color(0xFFE0F2FE);
  static Color get tealLight => isDark ? const Color(0xFF042F2E) : const Color(0xFFE6F7F5);
}