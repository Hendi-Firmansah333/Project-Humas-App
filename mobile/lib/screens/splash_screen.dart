import 'dart:math' as math;
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/login_screen.dart';
import 'package:poli_humas/screens/main_shell.dart';
import 'package:poli_humas/services/api_client.dart';
import 'package:poli_humas/services/api_service.dart';
import 'package:poli_humas/services/auth_service.dart';
import 'package:poli_humas/services/live_location_sync_service.dart';
import 'package:poli_humas/services/realtime_sync_service.dart';
import 'package:poli_humas/services/user_profile_service.dart';
import 'package:poli_humas/theme/app_colors.dart';

const _logoAsset = 'assets/images/logo.png';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with TickerProviderStateMixin {
  late AnimationController _mainController;
  late Future<void> _initFuture;
  bool _navigating = false;

  // ── Animasi Tahap 1: Kemunculan Layar & Logo Awal (Figma 4001:301) ──
  late Animation<double> _bgOpacity;
  late Animation<double> _logoScaleIn;
  late Animation<double> _logoOpacityIn;

  // ── Animasi Tahap 2 & 3: Ripple Circles Burst (Figma 4001:308 & 4001:315) ──
  late Animation<double> _rippleScale;
  late Animation<double> _rippleOpacity;
  late Animation<double> _rippleRotation;

  // ── Animasi Tahap 4 & 5: Ripple Shrink & Logo Re-center/Shift (Figma 4001:322 & 4001:331) ──
  late Animation<double> _logoShiftY;
  late Animation<double> _logoSizeScale;

  // ── Animasi Tahap 6: Teks Branding HUMAS POLINELA (Figma 4001:340) ──
  late Animation<double> _textOpacity;
  late Animation<double> _textSlideY;
  late Animation<double> _footerOpacity;

  @override
  void initState() {
    super.initState();

    // Jalankan pre-inisialisasi data di background
    _initFuture = _preInitApp();

    // Total durasi sekuens animasi adalah 3200ms
    _mainController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3200),
    );

    // ── 1. Background Fade In (0 - 300 ms -> 0.0 s/d 0.09) ──
    _bgOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.0, 0.09, curve: Curves.easeIn),
      ),
    );

    // ── 2. Logo H Pop In Elastis (200 - 900 ms -> 0.06 s/d 0.28) ──
    _logoScaleIn = Tween<double>(begin: 0.2, end: 1.0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.06, 0.28, curve: Curves.easeOutBack),
      ),
    );
    _logoOpacityIn = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.06, 0.22, curve: Curves.easeIn),
      ),
    );

    // ── 3. Ripple Circles Burst (700 - 1700 ms -> 0.22 s/d 0.53) ──
    _rippleScale = Tween<double>(begin: 0.1, end: 1.15).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.22, 0.50, curve: Curves.easeOutCubic),
      ),
    );
    _rippleRotation = Tween<double>(begin: -0.15, end: 0.2).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.22, 0.53, curve: Curves.easeOut),
      ),
    );
    // Ripple mekar lalu fade out
    _rippleOpacity = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.0, end: 0.95).chain(CurveTween(curve: Curves.easeIn)),
        weight: 35,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.95, end: 0.0).chain(CurveTween(curve: Curves.easeOut)),
        weight: 65,
      ),
    ]).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.22, 0.58),
      ),
    );

    // ── 4 & 5. Logo Menyusut & Naik Sedikit (1600 - 2200 ms -> 0.50 s/d 0.69) ──
    _logoShiftY = Tween<double>(begin: 0.0, end: -30.0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.52, 0.70, curve: Curves.easeInOutCubic),
      ),
    );
    _logoSizeScale = Tween<double>(begin: 1.0, end: 0.88).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.52, 0.70, curve: Curves.easeInOutCubic),
      ),
    );

    // ── 6. Teks Branding HUMAS POLINELA Muncul di Bawah Logo (2200 - 2800 ms -> 0.68 s/d 0.88) ──
    _textOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.68, 0.86, curve: Curves.easeIn),
      ),
    );
    _textSlideY = Tween<double>(begin: 24.0, end: 0.0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.68, 0.88, curve: Curves.easeOutCubic),
      ),
    );
    _footerOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.78, 0.94, curve: Curves.easeIn),
      ),
    );

    // Jalankan controller dan navigasi setelah selesai
    _mainController.forward().then((_) {
      _navigateToNextScreen();
    });
  }

  Future<void> _preInitApp() async {
    if (!AuthService.instance.isLoggedInWithApi) return;
    final appData = context.read<AppDataProvider>();
    RealtimeSyncService.instance.bindProvider(appData);
    try {
      await Future.wait([
        ApiService.instance.fetchProfile().then(
          (profile) => UserProfileService.instance.syncFromApi(profile),
        ),
        appData.refreshAll(simulateNetwork: false),
      ]);
      LiveLocationSyncService.instance.start();
      await RealtimeSyncService.instance.start();
    } catch (e) {
      final isUnauthorized =
          (e is DioException &&
              e.error is ApiException &&
              (e.error as ApiException).type == ApiErrorType.unauthorized) ||
          !ApiClient.instance.hasToken;
      if (isUnauthorized) {
        await AuthService.instance.logoutRemote();
      } else {
        LiveLocationSyncService.instance.start();
        await RealtimeSyncService.instance.start();
      }
    }
  }

  Future<void> _navigateToNextScreen() async {
    if (_navigating || !mounted) return;
    _navigating = true;

    await _initFuture;

    final nextScreen = AuthService.instance.isLoggedIn
        ? const MainShell()
        : const LoginScreen();

    if (!mounted) return;

    Navigator.of(context).pushReplacement(
      PageRouteBuilder<void>(
        pageBuilder: (context, animation, secondaryAnimation) => nextScreen,
        transitionDuration: const Duration(milliseconds: 600),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          final fade = FadeTransition(
            opacity: animation,
            child: child,
          );
          return SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(0.0, 0.03),
              end: Offset.zero,
            ).animate(
              CurvedAnimation(parent: animation, curve: Curves.easeInOutCubic),
            ),
            child: fade,
          );
        },
      ),
    );
  }

  @override
  void dispose() {
    _mainController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const isDark = false;
    const bgColor = Colors.white;

    return Scaffold(
      backgroundColor: bgColor,
      body: AnimatedBuilder(
        animation: _mainController,
        builder: (context, child) {
          return Opacity(
            opacity: _bgOpacity.value,
            child: Stack(
              children: [
                // ── LAYER BACKGROUND RIPPLE CIRCLES (Figma 4001:308 & 4001:315) ──
                if (_rippleOpacity.value > 0.01)
                  Center(
                    child: Transform.translate(
                      offset: Offset(0, _logoShiftY.value),
                      child: Transform.rotate(
                        angle: _rippleRotation.value,
                        child: Transform.scale(
                          scale: _rippleScale.value,
                          child: Opacity(
                            opacity: _rippleOpacity.value.clamp(0.0, 1.0),
                            child: CustomPaint(
                              size: const Size(320, 320),
                              painter: _FigmaGeometricRipplePainter(isDark: isDark),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),

                // ── KONTEN TENGAH (LOGO & BRANDING TEKS) ──
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Logo PoliHumas (Logo P)
                      Transform.translate(
                        offset: Offset(0, _logoShiftY.value + _getFloatingOffset()),
                        child: Transform.scale(
                          scale: _logoScaleIn.value * _logoSizeScale.value,
                          child: Opacity(
                            opacity: _logoOpacityIn.value,
                            child: Hero(
                              tag: 'app_logo',
                              flightShuttleBuilder: _flightShuttleBuilder,
                              child: Container(
                                width: 130,
                                height: 130,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: isDark
                                          ? AppColors.primary.withValues(alpha: 0.25)
                                          : const Color(0xFF003D58).withValues(alpha: 0.12),
                                      blurRadius: 28,
                                      offset: const Offset(0, 10),
                                    ),
                                  ],
                                ),
                                child: Image.asset(
                                  _logoAsset,
                                  width: 130,
                                  height: 130,
                                  fit: BoxFit.contain,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),

                      // Teks Branding di Bawah Logo (Figma 4001:340)
                      Transform.translate(
                        offset: Offset(0, _textSlideY.value + _logoShiftY.value),
                        child: Opacity(
                          opacity: _textOpacity.value,
                          child: Padding(
                            padding: const EdgeInsets.only(top: 18),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  'HUMAS POLINELA',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w900,
                                    color: isDark ? Colors.white : const Color(0xFF003D58),
                                    letterSpacing: 2.2,
                                    height: 1.15,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Politeknik Negeri Lampung',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w600,
                                    color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // ── FOOTER VERSION & STATUS (Figma Subtle Branding) ──
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 34,
                  child: Opacity(
                    opacity: _footerOpacity.value,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Subtle animated dots loader
                        SizedBox(
                          width: 48,
                          height: 6,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: List.generate(3, (i) {
                              final delay = i * 0.2;
                              final val = (_mainController.value * 3 - delay) % 1.0;
                              final active = val > 0.0 && val < 0.6;
                              return AnimatedContainer(
                                duration: const Duration(milliseconds: 250),
                                width: active ? 16 : 6,
                                height: 5,
                                decoration: BoxDecoration(
                                  color: active
                                      ? AppColors.primary
                                      : (isDark ? Colors.white24 : const Color(0xFFCBD5E1)),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              );
                            }),
                          ),
                        ),
                        const SizedBox(height: 14),
                        Text(
                          'Sistem Informasi Manajemen Kehumasan',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
                            letterSpacing: 0.2,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  // Floating offset halus saat teks sudah muncul
  double _getFloatingOffset() {
    final progress = _mainController.value;
    if (progress >= 0.70) {
      final t = (progress - 0.70) / 0.30;
      return math.sin(t * math.pi * 2) * 3.5;
    }
    return 0.0;
  }
}

/// CustomPainter untuk menggambar kelopak lingkaran geometris (Figma 4001:308 & 4001:315)
class _FigmaGeometricRipplePainter extends CustomPainter {
  _FigmaGeometricRipplePainter({required this.isDark});

  final bool isDark;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);

    // Palet warna lingkaran sesuai frame Figma
    final circles = [
      // Lingkaran 1: belakang kanan atas
      _CircleItem(
        offset: const Offset(42, -35),
        radius: 96,
        color: isDark ? const Color(0xFF003D58) : const Color(0xFF004D6D),
        opacity: 0.45,
      ),
      // Lingkaran 2: belakang kiri
      _CircleItem(
        offset: const Offset(-55, 15),
        radius: 88,
        color: isDark ? const Color(0xFF026D8F) : const Color(0xFF00668F),
        opacity: 0.55,
      ),
      // Lingkaran 3: bawah kiri
      _CircleItem(
        offset: const Offset(-25, 58),
        radius: 92,
        color: isDark ? const Color(0xFF008AA8) : const Color(0xFF008EB2),
        opacity: 0.65,
      ),
      // Lingkaran 4: tengah bawah
      _CircleItem(
        offset: const Offset(28, 42),
        radius: 86,
        color: isDark ? const Color(0xFF00A7C4) : const Color(0xFF00AEC9),
        opacity: 0.75,
      ),
      // Lingkaran 5: depan utama (cyan cerah seperti di frame 3)
      _CircleItem(
        offset: const Offset(-8, -4),
        radius: 104,
        color: isDark ? const Color(0xFF22D3EE) : const Color(0xFF0284C7),
        opacity: 0.88,
      ),
    ];

    for (final c in circles) {
      final circleCenter = center + c.offset;

      // Soft shadow
      final shadowPaint = Paint()
        ..color = Colors.black.withValues(alpha: isDark ? 0.2 : 0.08)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 16);
      canvas.drawCircle(circleCenter + const Offset(0, 8), c.radius, shadowPaint);

      // Circle Fill
      final fillPaint = Paint()
        ..color = c.color.withValues(alpha: c.opacity)
        ..style = PaintingStyle.fill;
      canvas.drawCircle(circleCenter, c.radius, fillPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _FigmaGeometricRipplePainter oldDelegate) =>
      oldDelegate.isDark != isDark;
}

class _CircleItem {
  const _CircleItem({
    required this.offset,
    required this.radius,
    required this.color,
    required this.opacity,
  });

  final Offset offset;
  final double radius;
  final Color color;
  final double opacity;
}

Widget _flightShuttleBuilder(
  BuildContext flightContext,
  Animation<double> animation,
  HeroFlightDirection flightDirection,
  BuildContext fromHeroContext,
  BuildContext toHeroContext,
) {
  return Image.asset(
    _logoAsset,
    width: 130,
    height: 130,
    fit: BoxFit.contain,
  );
}
