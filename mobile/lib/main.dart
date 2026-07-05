import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/splash_screen.dart';
import 'package:poli_humas/config/api_config.dart';
import 'package:poli_humas/services/api_client.dart';
import 'package:poli_humas/services/app_settings_service.dart';
import 'package:poli_humas/services/auth_service.dart';
import 'package:poli_humas/services/connectivity_service.dart';
import 'package:poli_humas/services/local_storage.dart';
import 'package:poli_humas/services/live_location_sync_service.dart';
import 'package:poli_humas/services/user_profile_service.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/theme/rigid_scroll_behavior.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await LocalStorage.init();
  if (ApiConfig.enabled) {
    await ApiClient.instance.init();
  }
  await ConnectivityService.instance.init();
  await UserProfileService.instance.load();
  await AppSettingsService.instance.load();
  await AuthService.instance.load();
  if (ApiConfig.enabled && AuthService.instance.isLoggedInWithApi) {
    LiveLocationSyncService.instance.start();
  }
  final appData = AppDataProvider();
  await appData.init();
  runApp(MyApp(appData: appData));
}

ThemeData _buildTheme(Brightness brightness) {
  final isDark = brightness == Brightness.dark;
  return ThemeData(
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      brightness: brightness,
    ),
    scaffoldBackgroundColor: isDark ? const Color(0xFF111827) : AppColors.background,
    useMaterial3: true,
    fontFamily: 'Roboto',
    splashFactory: InkRipple.splashFactory,
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.android: ZoomPageTransitionsBuilder(),
        TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
      },
    ),
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
          final settings = AppSettingsService.instance;
          return MaterialApp(
            title: 'HUMAS POLINELA',
            scrollBehavior: const RigidScrollBehavior(),
            debugShowCheckedModeBanner: false,
            themeMode: settings.darkModeEnabled ? ThemeMode.dark : ThemeMode.light,
            theme: _buildTheme(Brightness.light),
            darkTheme: _buildTheme(Brightness.dark),
            home: const SplashScreen(),
          );
        },
      ),
    );
  }
}