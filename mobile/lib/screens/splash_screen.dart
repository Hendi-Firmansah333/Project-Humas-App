import 'package:flutter/material.dart';
import 'package:poli_humas/screens/login_screen.dart';
import 'package:poli_humas/screens/main_shell.dart';
import 'package:poli_humas/services/api_service.dart';
import 'package:poli_humas/services/auth_service.dart';
import 'package:poli_humas/services/live_location_sync_service.dart';
import 'package:poli_humas/services/user_profile_service.dart';

/// Splash animation mengikuti urutan video referensi:
/// 1. Logo H di background putih
/// 2. Teks HUMAS POLINELA muncul
/// 3. Wipe teal naik dari bawah
/// 4. Background bubble teal memenuhi layar
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _logoScale;
  late Animation<double> _logoOpacity;
  late Animation<double> _titleSlide;
  late Animation<double> _titleOpacity;
  late Animation<double> _wipe;
  late Animation<double> _bubbleOpacity;
  late Animation<double> _contentFade;
  late Animation<double> _exitFade;

  bool _navigating = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 5500),
    );

    // Logo muncul cepat di awal (0-1.2s)
    _logoScale = Tween<double>(begin: 0.72, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.0, 0.14, curve: Curves.easeOutCubic)),
    );
    _logoOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.0, 0.1, curve: Curves.easeOut)),
    );

    // Teks muncul setelah logo stabil (1.8-3s)
    _titleSlide = Tween<double>(begin: 22, end: 0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.33, 0.48, curve: Curves.easeOutCubic)),
    );
    _titleOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.33, 0.45, curve: Curves.easeOut)),
    );

    // Wipe teal naik dari bawah (3.2-4.2s)
    _wipe = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.58, 0.76, curve: Curves.easeInOutCubic)),
    );

    // Bubble muncul saat wipe hampir penuh (3.8-5s)
    _bubbleOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.68, 0.9, curve: Curves.easeOutCubic)),
    );

    // Logo + teks hilang saat wipe mulai
    _contentFade = Tween<double>(begin: 1.0, end: 0.0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.56, 0.7, curve: Curves.easeIn)),
    );

    _exitFade = Tween<double>(begin: 1.0, end: 0.0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.92, 1.0, curve: Curves.easeIn)),
    );

    _controller.forward().then((_) {
      Future.delayed(const Duration(milliseconds: 150), _navigateToLogin);
    });
  }

  Future<void> _navigateToLogin() async {
    if (_navigating || !mounted) return;
    _navigating = true;

    if (AuthService.instance.isLoggedInWithApi) {
      try {
        final profile = await ApiService.instance.fetchProfile();
        await UserProfileService.instance.syncFromApi(profile);
        LiveLocationSyncService.instance.start();
      } catch (_) {
        await AuthService.instance.logoutRemote();
      }
    }

    final nextScreen = AuthService.instance.isLoggedIn
        ? const MainShell()
        : const LoginScreen();

    Navigator.of(context).pushReplacement(
      PageRouteBuilder<void>(
        pageBuilder: (context, animation, secondaryAnimation) => nextScreen,
        transitionDuration: const Duration(milliseconds: 500),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(
            opacity: CurvedAnimation(parent: animation, curve: Curves.easeInOut),
            child: child,
          );
        },
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          return Opacity(
            opacity: _exitFade.value,
            child: Stack(
              fit: StackFit.expand,
              children: [
                const ColoredBox(color: Colors.white),

                // Wipe teal + bubble (seperti video)
                Align(
                  alignment: Alignment.bottomCenter,
                  child: ClipRect(
                    child: Align(
                      alignment: Alignment.bottomCenter,
                      heightFactor: _wipe.value.clamp(0.001, 1.0),
                      child: SizedBox(
                        height: MediaQuery.sizeOf(context).height,
                        width: double.infinity,
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            const ColoredBox(color: Color(0xFF0A7A74)),
                            Opacity(
                              opacity: _bubbleOpacity.value,
                              child: Image.asset(
                                'assets/images/splash_bubbles.png',
                                fit: BoxFit.cover,
                                width: double.infinity,
                                height: double.infinity,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),

                // Logo + judul (fase putih)
                Opacity(
                  opacity: _contentFade.value,
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Transform.scale(
                          scale: _logoScale.value,
                          child: Opacity(
                            opacity: _logoOpacity.value,
                            child: Image.asset(
                              'assets/images/splash_logo.png',
                              width: 160,
                              height: 200,
                              fit: BoxFit.contain,
                              filterQuality: FilterQuality.high,
                            ),
                          ),
                        ),
                        const SizedBox(height: 18),
                        Transform.translate(
                          offset: Offset(0, _titleSlide.value),
                          child: Opacity(
                            opacity: _titleOpacity.value,
                            child: const Text(
                              'HUMAS POLINELA',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF8ADCE6),
                                letterSpacing: 2.8,
                              ),
                            ),
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
}