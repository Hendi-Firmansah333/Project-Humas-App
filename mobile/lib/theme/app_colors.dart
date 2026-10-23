import 'package:flutter/material.dart';
import 'package:poli_humas/services/app_settings_service.dart';

class AppColors {
  static bool get isDark => AppSettingsService.instance.darkModeEnabled;

  // Brand Teal Palette
  static const brand50 = Color(0xFFF0FDFA);
  static const brand100 = Color(0xFFCCFBF1);
  static const brand200 = Color(0xFF99F6E4);
  static const brand300 = Color(0xFF5EEAD4);
  static const brand400 = Color(0xFF2DD4BF);
  static const brand500 = Color(0xFF14B8A6);
  static const brand600 = Color(0xFF0D9488);
  static const brand700 = Color(0xFF0F766E);
  static const brand800 = Color(0xFF115E59);
  static const brand900 = Color(0xFF134E4A);

  // Polinela Brand Colors
  static const polinelaCyan = Color(0xFF06B6D4);
  static const polinelaSky = Color(0xFF0284C7);
  static const polinelaNavy = Color(0xFF0F172A);

  // Main UI Colors
  static const primary = brand600;
  static const primaryDark = brand800;
  static const primaryLight = brand100;
  static const accent = polinelaCyan;

  // Slate Neutrals
  static const slate50 = Color(0xFFF8FAFC);
  static const slate100 = Color(0xFFF1F5F9);
  static const slate200 = Color(0xFFE2E8F0);
  static const slate300 = Color(0xFFCBD5E1);
  static const slate400 = Color(0xFF94A3B8);
  static const slate500 = Color(0xFF64748B);
  static const slate600 = Color(0xFF475569);
  static const slate700 = Color(0xFF334155);
  static const slate800 = Color(0xFF1E293B);
  static const slate900 = Color(0xFF0F172A);

  // Adaptive Colors
  static Color get background => isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
  static Color get card => isDark ? const Color(0xFF1E293B) : Colors.white;
  static Color get textPrimary => isDark ? Colors.white : const Color(0xFF0F172A);
  static Color get textSecondary => isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
  static Color get border => isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9);

  // Semantic status colors
  static const success = Color(0xFF10B981);
  static const warning = Color(0xFFF59E0B);
  static const danger = Color(0xFFEF4444);
  static const purple = Color(0xFF8B5CF6);
  static const blue = Color(0xFF3B82F6);
  static const emerald = Color(0xFF10B981);
  static const amber = Color(0xFFF59E0B);
  static const rose = Color(0xFFF43F5E);

  static Color get purpleLight => isDark ? const Color(0xFF2E1065) : const Color(0xFFF3E8FF);
  static Color get blueLight => isDark ? const Color(0xFF082F49) : const Color(0xFFE0F2FE);
  static Color get tealLight => isDark ? const Color(0xFF042F2E) : const Color(0xFFF0FDFA);
  static Color get emeraldLight => isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5);
  static Color get roseLight => isDark ? const Color(0xFF4C0519) : const Color(0xFFFFF1F2);
  static Color get amberLight => isDark ? const Color(0xFF451A03) : const Color(0xFFFFFBEB);

  // Standard BoxShadows
  static List<BoxShadow> get shadowSoft => [
        BoxShadow(
          color: const Color(0xFF0D9488).withValues(alpha: 0.08),
          blurRadius: 30,
          offset: const Offset(0, 8),
        ),
        BoxShadow(
          color: const Color(0xFF0F172A).withValues(alpha: 0.04),
          blurRadius: 12,
          offset: const Offset(0, 4),
        ),
      ];

  static List<BoxShadow> get shadowCard => [
        BoxShadow(
          color: const Color(0xFF0F172A).withValues(alpha: 0.05),
          blurRadius: 25,
          offset: const Offset(0, 10),
        ),
        BoxShadow(
          color: const Color(0xFF0F172A).withValues(alpha: 0.02),
          blurRadius: 6,
          offset: const Offset(0, 4),
        ),
      ];

  static List<BoxShadow> get shadowFloating => [
        BoxShadow(
          color: const Color(0xFF0D9488).withValues(alpha: 0.25),
          blurRadius: 35,
          offset: const Offset(0, 20),
        ),
      ];
}