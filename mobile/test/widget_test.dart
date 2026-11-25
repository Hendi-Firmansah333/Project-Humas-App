import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:poli_humas/main.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/config/api_config.dart';
import 'package:poli_humas/services/api_client.dart';
import 'package:poli_humas/services/app_settings_service.dart';
import 'package:poli_humas/services/auth_service.dart';
import 'package:poli_humas/services/connectivity_service.dart';
import 'package:poli_humas/services/local_storage.dart';
import 'package:poli_humas/services/user_profile_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('App shows splash then login', (WidgetTester tester) async {
    GoogleFonts.config.allowRuntimeFetching = false;
    SharedPreferences.setMockInitialValues({});

    const connectivityChannel = MethodChannel(
      'dev.fluttercommunity.plus/connectivity',
    );
    tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
      connectivityChannel,
      (MethodCall call) async {
        if (call.method == 'check') {
          return <String>['wifi'];
        }
        return null;
      },
    );

    await LocalStorage.init();
    if (ApiConfig.enabled) {
      await ApiClient.instance.init();
    }
    await ConnectivityService.instance.init();
    await UserProfileService.instance.load();
    await AppSettingsService.instance.load();
    await AuthService.instance.load();
    final appData = AppDataProvider();
    await appData.initCacheOnly();

    await tester.pumpWidget(MyApp(appData: appData));
    expect(find.text('HUMAS POLINELA'), findsOneWidget);

    await tester.pump(const Duration(milliseconds: 5300));
    await tester.pumpAndSettle();

    expect(find.text('Masuk Ke Sistem'), findsOneWidget);
  });
}