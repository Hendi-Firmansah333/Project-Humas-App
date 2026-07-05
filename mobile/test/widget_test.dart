import 'package:flutter_test/flutter_test.dart';
import 'package:poli_humas/main.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/config/api_config.dart';
import 'package:poli_humas/services/api_client.dart';
import 'package:poli_humas/services/connectivity_service.dart';
import 'package:poli_humas/services/local_storage.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('App shows splash then login', (WidgetTester tester) async {
    await LocalStorage.init();
    if (ApiConfig.enabled) {
      await ApiClient.instance.init();
    }
    await ConnectivityService.instance.init();
    final appData = AppDataProvider();
    await appData.init();

    await tester.pumpWidget(MyApp(appData: appData));
    expect(find.text('HUMAS POLINELA'), findsOneWidget);

    await tester.pump(const Duration(milliseconds: 5300));
    await tester.pumpAndSettle();

    expect(find.text('Masuk Ke Sistem'), findsOneWidget);
  });
}