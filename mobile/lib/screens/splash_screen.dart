import 'dart:math' as math;
import 'dart:ui' as ui;
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

const _logoAsset = 'assets/images/logo.png';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _mainController;
  late Future<void> _initFuture;
  bool _navigating = false;

  // ── Portal Oval Animation (Figma 4001:301 -> 4001:308) ──
  late Animation<double> _portalScale;
  late Animation<double> _portalOpacity;

  // ── Logo Kinematics (Figma 4001:301 -> 4001:340) ──
  late Animation<double> _logoDx;
  late Animation<double> _logoDy;
  late Animation<double> _logoSize;

  // ── Brand Text Horizontal Wipe (Figma 4001:322 -> 4001:331 -> 4001:340) ──
  late Animation<double> _textRevealFactor;
  late Animation<double> _textOpacity;

  @override
  void initState() {
    super.initState();

    // Jalankan pre-inisialisasi data di background
    _initFuture = _preInitApp();

    // Total durasi 6 tahap animasi adalah 4200ms mengikuti pacing video referensi
    _mainController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 4200),
    );

    // ── Portal Oval (Muncul -> Tahan saat logo melompat -> Menyusut hilang) ──
    _portalScale = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.55, end: 1.0)
            .chain(CurveTween(curve: Curves.easeOutCubic)),
        weight: 11,
      ),
      TweenSequenceItem(
        tween: ConstantTween<double>(1.0),
        weight: 11,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.0, end: 0.01)
            .chain(CurveTween(curve: Curves.easeInCubic)),
        weight: 12,
      ),
      TweenSequenceItem(
        tween: ConstantTween<double>(0.0),
        weight: 66,
      ),
    ]).animate(_mainController);

    _portalOpacity = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.0, end: 1.0)
            .chain(CurveTween(curve: Curves.easeOut)),
        weight: 9,
      ),
      TweenSequenceItem(
        tween: ConstantTween<double>(1.0),
        weight: 16,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.0, end: 0.0)
            .chain(CurveTween(curve: Curves.easeInCubic)),
        weight: 9,
      ),
      TweenSequenceItem(
        tween: ConstantTween<double>(0.0),
        weight: 66,
      ),
    ]).animate(_mainController);

    // ── Logo Horizontal Offset (Figma 430x932 center relative) ──
    _logoDx = TweenSequence<double>([
      TweenSequenceItem(
        tween: ConstantTween<double>(0.0),
        weight: 50,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.0, end: -116.5)
            .chain(CurveTween(curve: Curves.easeInOutCubic)),
        weight: 14,
      ),
      TweenSequenceItem(
        tween: ConstantTween<double>(-116.5),
        weight: 22,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: -116.5, end: 0.0)
            .chain(CurveTween(curve: Curves.easeInOutCubic)),
        weight: 14,
      ),
    ]).animate(_mainController);

    // ── Logo Vertical Offset (Hidden in portal -> Peak -> Center -> Hero Top) ──
    _logoDy = TweenSequence<double>([
      TweenSequenceItem(
        tween: ConstantTween<double>(180.5),
        weight: 16,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 180.5, end: -120.5)
            .chain(CurveTween(curve: Curves.easeOutCubic)),
        weight: 18,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: -120.5, end: 0.0)
            .chain(CurveTween(curve: Curves.easeInOutCubic)),
        weight: 14,
      ),
      TweenSequenceItem(
        tween: ConstantTween<double>(0.0),
        weight: 38,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.0, end: -217.5)
            .chain(CurveTween(curve: Curves.easeInOutCubic)),
        weight: 14,
      ),
    ]).animate(_mainController);

    // ── Logo Size (69 -> 113 -> 93 -> 235) ──
    _logoSize = TweenSequence<double>([
      TweenSequenceItem(
        tween: ConstantTween<double>(69.0),
        weight: 16,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 69.0, end: 113.0)
            .chain(CurveTween(curve: Curves.easeOutCubic)),
        weight: 18,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 113.0, end: 93.0)
            .chain(CurveTween(curve: Curves.easeInOutCubic)),
        weight: 14,
      ),
      TweenSequenceItem(
        tween: ConstantTween<double>(93.0),
        weight: 38,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 93.0, end: 235.0)
            .chain(CurveTween(curve: Curves.easeInOutCubic)),
        weight: 14,
      ),
    ]).animate(_mainController);

    // ── Teks Branding HUMAS POLINELA Wipe Kiri ke Kanan ──
    _textRevealFactor = TweenSequence<double>([
      TweenSequenceItem(
        tween: ConstantTween<double>(0.0),
        weight: 64,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.0, end: 1.0)
            .chain(CurveTween(curve: Curves.easeOutCubic)),
        weight: 16,
      ),
      TweenSequenceItem(
        tween: ConstantTween<double>(1.0),
        weight: 6,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.0, end: 0.0)
            .chain(CurveTween(curve: Curves.easeInCubic)),
        weight: 6,
      ),
      TweenSequenceItem(
        tween: ConstantTween<double>(0.0),
        weight: 8,
      ),
    ]).animate(_mainController);

    _textOpacity = TweenSequence<double>([
      TweenSequenceItem(
        tween: ConstantTween<double>(0.0),
        weight: 64,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.0, end: 1.0)
            .chain(CurveTween(curve: Curves.easeIn)),
        weight: 5,
      ),
      TweenSequenceItem(
        tween: ConstantTween<double>(1.0),
        weight: 17,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.0, end: 0.0)
            .chain(CurveTween(curve: Curves.easeOut)),
        weight: 5,
      ),
      TweenSequenceItem(
        tween: ConstantTween<double>(0.0),
        weight: 9,
      ),
    ]).animate(_mainController);

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
    final screenSize = MediaQuery.sizeOf(context);
    final widthScale = screenSize.width / 430.0;
    final heightScale = screenSize.height / 760.0;
    final scale = math.min(widthScale, heightScale).clamp(0.72, 1.15);
    final centerX = screenSize.width / 2;
    final centerY = screenSize.height / 2;

    return Scaffold(
      backgroundColor: Colors.white,
      body: AnimatedBuilder(
        animation: _mainController,
        builder: (context, child) {
          final portalScale = _portalScale.value;
          final portalOpacity = _portalOpacity.value.clamp(0.0, 1.0);
          final portalCenter = Offset(centerX, centerY + 46.0 * scale);
          final portalWidth = 297.0 * scale * portalScale;
          final portalHeight = 92.0 * scale * portalScale;

          final logoSize = _logoSize.value * scale;
          final logoCenterX = centerX + _logoDx.value * scale;
          final logoCenterY = centerY + _logoDy.value * scale;
          final applyPortalMask = _mainController.value < 0.35;

          final logoStack = SizedBox.expand(
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Positioned(
                  left: logoCenterX - logoSize / 2,
                  top: logoCenterY - logoSize / 2,
                  width: logoSize,
                  height: logoSize,
                  child: _LogoWithShadow(
                    size: logoSize,
                    scale: scale,
                  ),
                ),
              ],
            ),
          );

          final textLeft = centerX - 67.0 * scale;
          final maxTextWidth = math.max(
            100.0,
            screenSize.width - textLeft - 16.0 * scale,
          );

          return Stack(
            fit: StackFit.expand,
            children: [
              // ── 1. PORTAL OVAL ABU-ABU (Figma 4001:306 -> 4001:313) ──
              if (portalOpacity > 0.005 && portalScale > 0.005)
                Positioned(
                  left: portalCenter.dx - portalWidth / 2,
                  top: portalCenter.dy - portalHeight / 2,
                  width: portalWidth,
                  height: portalHeight,
                  child: Opacity(
                    opacity: portalOpacity,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        color: const Color(0xFFE5E5E5),
                        borderRadius: BorderRadius.all(
                          Radius.elliptical(portalWidth / 2, portalHeight / 2),
                        ),
                      ),
                    ),
                  ),
                ),

              // ── 2. LOGO POLIHUMAS (Dipotong mask portal saat tahap 1-2) ──
              if (applyPortalMask)
                ClipPath(
                  clipper: _PortalUnionClipper(
                    portalRect: Rect.fromCenter(
                      center: portalCenter,
                      width: math.max(portalWidth, 297.0 * scale),
                      height: math.max(portalHeight, 92.0 * scale),
                    ),
                    portalCenterY: portalCenter.dy,
                  ),
                  child: logoStack,
                )
              else
                logoStack,

              // ── 3. TEKS BRANDING "HUMAS POLINELA" (Figma 4001:338) ──
              Positioned(
                left: textLeft,
                top: centerY - 22.0 * scale,
                child: Opacity(
                  opacity: _textOpacity.value.clamp(0.0, 1.0),
                  child: ClipRect(
                    child: Align(
                      alignment: Alignment.centerLeft,
                      widthFactor: _textRevealFactor.value.clamp(0.0, 1.0),
                      child: ConstrainedBox(
                        constraints: BoxConstraints(
                          maxWidth: maxTextWidth,
                          minHeight: 44.0 * scale,
                          maxHeight: 44.0 * scale,
                        ),
                        child: FittedBox(
                          fit: BoxFit.scaleDown,
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'HUMAS POLINELA',
                            maxLines: 1,
                            softWrap: false,
                            style: GoogleFonts.poppins(
                              fontSize: 27.0 * scale,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF003D58),
                              height: 1.2,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _LogoWithShadow extends StatelessWidget {
  const _LogoWithShadow({
    required this.size,
    required this.scale,
  });

  final double size;
  final double scale;

  @override
  Widget build(BuildContext context) {
    final blurPadding = 16.0 * scale;

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            left: 4.0 * scale - blurPadding,
            top: 6.0 * scale - blurPadding,
            width: size + blurPadding * 2,
            height: size + blurPadding * 2,
            child: ImageFiltered(
              imageFilter: ui.ImageFilter.blur(
                sigmaX: 5.0 * scale,
                sigmaY: 5.0 * scale,
              ),
              child: Padding(
                padding: EdgeInsets.all(blurPadding),
                child: ColorFiltered(
                  colorFilter: ColorFilter.mode(
                    Colors.black.withValues(alpha: 0.22),
                    BlendMode.srcIn,
                  ),
                  child: Image.asset(
                    _logoAsset,
                    width: size,
                    height: size,
                    fit: BoxFit.contain,
                  ),
                ),
              ),
            ),
          ),
          Hero(
            tag: 'app_logo',
            flightShuttleBuilder: _flightShuttleBuilder,
            child: Image.asset(
              _logoAsset,
              width: size,
              height: size,
              fit: BoxFit.contain,
            ),
          ),
        ],
      ),
    );
  }
}

/// Union mask matching Figma 4001:303: upper viewport down to portal midline
/// unioned with the elliptical portal opening so the rising logo emerges out of it.
class _PortalUnionClipper extends CustomClipper<Path> {
  const _PortalUnionClipper({
    required this.portalRect,
    required this.portalCenterY,
  });

  final Rect portalRect;
  final double portalCenterY;

  @override
  Path getClip(Size size) {
    final upperRect = Path()
      ..addRect(Rect.fromLTWH(0, 0, size.width, portalCenterY));
    final oval = Path()..addOval(portalRect);
    return Path.combine(PathOperation.union, upperRect, oval);
  }

  @override
  bool shouldReclip(covariant _PortalUnionClipper oldClipper) =>
      oldClipper.portalRect != portalRect ||
      oldClipper.portalCenterY != portalCenterY;
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
    width: 100,
    height: 100,
    fit: BoxFit.contain,
  );
}
