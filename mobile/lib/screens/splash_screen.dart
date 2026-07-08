import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:poli_humas/screens/login_screen.dart';
import 'package:poli_humas/screens/main_shell.dart';
import 'package:poli_humas/services/api_service.dart';
import 'package:poli_humas/services/auth_service.dart';
import 'package:poli_humas/services/live_location_sync_service.dart';
import 'package:poli_humas/services/user_profile_service.dart';

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

  // Animasi Background (Tahap 1)
  late Animation<double> _bgOpacity;

  // Animasi Logo (Tahap 2)
  late Animation<double> _logoScale;
  late Animation<double> _logoOpacity;

  // Animasi Logo (Tahap 4)
  late Animation<double> _logoShrink;

  // Animasi Logo & Teks (Tahap 5)
  late Animation<double> _logoSlide;
  late Animation<double> _textOpacity;
  late Animation<double> _textSlide;

  @override
  void initState() {
    super.initState();

    // Jalankan pre-init API di background agar tidak menghentikan animasi
    _initFuture = _preInitApp();

    // Total durasi splash animation di luar transisi adalah 3500 ms
    _mainController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3500),
    );

    // Tahap 1: Background fade in (0 - 300 ms -> Interval 0.0 s/d 0.086)
    _bgOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.0, 0.086, curve: Curves.easeIn),
      ),
    );

    // Tahap 2: Logo muncul (300 - 1000 ms -> Interval 0.086 s/d 0.286)
    // Menggunakan overshoot / Curves.easeOutBack untuk efek Elastic Out
    _logoScale = Tween<double>(begin: 0.4, end: 1.15).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.086, 0.286, curve: Curves.easeOutBack),
      ),
    );
    _logoOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.086, 0.200, curve: Curves.easeIn),
      ),
    );

    // Tahap 4: Logo menyusut (1800 - 2400 ms -> Interval 0.514 s/d 0.686)
    _logoShrink = Tween<double>(begin: 1.0, end: 0.365).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.514, 0.686, curve: Curves.easeInOutCubic),
      ),
    );

    // Tahap 5: Logo bergeser kiri, Teks muncul (2400 - 3000 ms -> Interval 0.686 s/d 0.857)
    _logoSlide = Tween<double>(begin: 0.0, end: -64.0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.686, 0.857, curve: Curves.easeInOutCubic),
      ),
    );
    _textOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.686, 0.820, curve: Curves.easeIn),
      ),
    );
    _textSlide = Tween<double>(begin: 40.0, end: 0.0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.686, 0.857, curve: Curves.easeOutExpo),
      ),
    );

    // Jalankan timeline animasi
    _mainController.forward().then((_) {
      _navigateToNextScreen();
    });
  }

  Future<void> _preInitApp() async {
    if (AuthService.instance.isLoggedInWithApi) {
      try {
        final profile = await ApiService.instance.fetchProfile();
        await UserProfileService.instance.syncFromApi(profile);
        LiveLocationSyncService.instance.start();
      } catch (_) {
        await AuthService.instance.logoutRemote();
      }
    }
  }

  Future<void> _navigateToNextScreen() async {
    if (_navigating || !mounted) return;
    _navigating = true;

    // Pastikan inisialisasi API selesai sebelum pindah
    await _initFuture;

    final nextScreen = AuthService.instance.isLoggedIn
        ? const MainShell()
        : const LoginScreen();

    if (!mounted) return;

    // Tahap 7: Transisi halus menggunakan Hero & PageRouteBuilder (transform transition)
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
              begin: const Offset(0.0, 0.04),
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
    final brightness = Theme.of(context).brightness;
    final isDark = brightness == Brightness.dark;
    final bgColor = isDark ? const Color(0xFF121212) : Colors.white;

    return Scaffold(
      backgroundColor: bgColor,
      body: AnimatedBuilder(
        animation: _mainController,
        builder: (context, child) {
          return Opacity(
            opacity: _bgOpacity.value,
            child: SafeArea(
              child: Center(
                child: RepaintBoundary(
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Area Logo + Teks Pendukung
                      SizedBox(
                        width: double.infinity,
                        height: 200,
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            // Logo PNG dengan Hero
                            Transform.translate(
                              offset: Offset(_logoSlide.value, _getFloatingOffset()),
                              child: Transform.scale(
                                scale: _logoScale.value * _logoShrink.value,
                                child: Opacity(
                                  opacity: _logoOpacity.value,
                                  child: Hero(
                                    tag: 'app_logo',
                                    flightShuttleBuilder: _flightShuttleBuilder,
                                    child: Image.asset(
                                      _logoAsset,
                                      width: 1594000,
                                      height: 1594000,
                                      fit: BoxFit.contain,
                                    ),
                                  ),
                                ),
                              ),
                            ),

                            // Teks HUMAS POLINELA
                            Transform.translate(
                              offset: Offset(_logoSlide.value + 80.0 + _textSlide.value, 0),
                              child: Opacity(
                                opacity: _textOpacity.value,
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'HUMAS',
                                      style: TextStyle(
                                        fontSize: 22,
                                        fontWeight: FontWeight.w900,
                                        color: isDark ? Colors.white : const Color(0xFF1F2937),
                                        letterSpacing: 2.0,
                                        height: 1.1,
                                      ),
                                    ),
                                    Text(
                                      'POLINELA',
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: isDark ? const Color(0xFF00B4D8) : const Color(0xFF0D9488),
                                        letterSpacing: 3.5,
                                        height: 1.2,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  // Tahap 3: Floating Animation naik turun ±4 px halus (1000 - 1800 ms)
  double _getFloatingOffset() {
    final progress = _mainController.value;
    // Interval mengambang: 1000ms s/d 1800ms -> t = 0.2857 s/d 0.5143
    const startFloat = 0.2857;
    const endFloat = 0.5143;

    if (progress >= startFloat && progress <= endFloat) {
      final t = (progress - startFloat) / (endFloat - startFloat);
      // Gunakan gelombang sinus penuh (0 -> pi -> 2pi) untuk kembali ke posisi awal
      return math.sin(t * 2 * math.pi) * 4.0;
    }
    return 0.0;
  }
}

// Handler khusus untuk menjaga Hero transition tidak patah / tetap tajam saat transisi
Widget _flightShuttleBuilder(
  BuildContext flightContext,
  Animation<double> animation,
  HeroFlightDirection flightDirection,
  BuildContext fromHeroContext,
  BuildContext toHeroContext,
) {
  return Image.asset(
    _logoAsset,
    width: 1594000,
    height: 1594000,
    fit: BoxFit.fitHeight,
  );
}
    