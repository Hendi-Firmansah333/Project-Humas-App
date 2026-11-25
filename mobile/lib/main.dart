import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/login_screen.dart';
import 'package:poli_humas/screens/splash_screen.dart';
import 'package:poli_humas/config/api_config.dart';
import 'package:poli_humas/services/api_client.dart';
import 'package:poli_humas/services/app_settings_service.dart';
import 'package:poli_humas/services/auth_service.dart';
import 'package:poli_humas/services/connectivity_service.dart';
import 'package:poli_humas/services/local_storage.dart';
import 'package:poli_humas/services/live_location_sync_service.dart';
import 'package:poli_humas/services/realtime_sync_service.dart';
import 'package:poli_humas/services/user_profile_service.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/theme/rigid_scroll_behavior.dart';

final GlobalKey<NavigatorState> appNavigatorKey = GlobalKey<NavigatorState>();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await LocalStorage.init();
  if (ApiConfig.enabled) {
    await ApiClient.instance.init();
    ApiClient.instance.onUnauthorized = () async {
      RealtimeSyncService.instance.stop();
      await LiveLocationSyncService.instance.stop(markOffline: false);
      await UserProfileService.instance.clear();
      await AuthService.instance.setLoggedIn(false);
      final nav = appNavigatorKey.currentState;
      if (nav != null) {
        nav.pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
          (_) => false,
        );
      }
      final ctx = appNavigatorKey.currentContext;
      if (ctx != null && ctx.mounted) {
        ScaffoldMessenger.maybeOf(ctx)?.showSnackBar(
          const SnackBar(
            content: Text('Sesi Anda telah berakhir. Silakan masuk kembali.'),
          ),
        );
      }
    };
  }
  await ConnectivityService.instance.init();
  await UserProfileService.instance.load();
  await AppSettingsService.instance.load();
  await AuthService.instance.load();
  if (ApiConfig.enabled && AuthService.instance.isLoggedInWithApi) {
    LiveLocationSyncService.instance.start();
  }
  final appData = AppDataProvider();
  await appData.initCacheOnly();
  RealtimeSyncService.instance.bindProvider(appData);
  runApp(MyApp(appData: appData));
}

ThemeData _buildTheme(Brightness brightness) {
  final isDark = brightness == Brightness.dark;
  final base = ThemeData(
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      brightness: brightness,
    ),
    scaffoldBackgroundColor: isDark ? const Color(0xFF111827) : AppColors.background,
    useMaterial3: true,
    splashFactory: InkRipple.splashFactory,
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.android: ZoomPageTransitionsBuilder(),
        TargetPlatform.iOS: ZoomPageTransitionsBuilder(),
      },
    ),
  );
  // Apply Plus Jakarta Sans globally
  return base.copyWith(
    textTheme: GoogleFonts.plusJakartaSansTextTheme(base.textTheme),
    primaryTextTheme: GoogleFonts.plusJakartaSansTextTheme(base.primaryTextTheme),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key, required this.appData});

  final AppDataProvider appData;

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: appData,
      child: ListenableBuilder(
        listenable: AppSettingsService.instance,
        builder: (context, _) {
          return MaterialApp(
            navigatorKey: appNavigatorKey,
            title: 'HUMAS POLINELA',
            scrollBehavior: const RigidScrollBehavior(),
            debugShowCheckedModeBanner: false,
            themeMode: ThemeMode.light,
            theme: _buildTheme(Brightness.light),
            home: const SplashScreen(),
          );
        },
      ),
    );
  }
}