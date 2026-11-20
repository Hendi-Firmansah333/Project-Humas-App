import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/services/realtime_sync_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test('AppDataProvider.initCacheOnly initializes state without blocking', () async {
    final provider = AppDataProvider();
    await provider.initCacheOnly();

    expect(provider.isInitialized, isTrue);
    expect(provider.activitiesState.isLoading, isFalse);
    expect(provider.historyState.isLoading, isFalse);
    expect(provider.contentPlansState.isLoading, isFalse);
    expect(provider.notificationsState.isLoading, isFalse);
  });

  test('AppDataProvider.refreshAll deduplicates concurrent calls', () async {
    final provider = AppDataProvider();
    await provider.initCacheOnly();

    final f1 = provider.refreshAll(simulateNetwork: false);
    final f2 = provider.refreshAll(simulateNetwork: false);

    expect(identical(f1, f2), isTrue);
    await f1;
    expect(provider.isRefreshingAll, isFalse);
  });

  test('RealtimeSyncService lifecycle methods handle unauthenticated state safely', () async {
    final provider = AppDataProvider();
    await provider.initCacheOnly();

    final sync = RealtimeSyncService.instance;
    sync.bindProvider(provider);
    await sync.start();
    sync.onTabChanged();
    sync.onAppPaused();
    sync.onAppResumed();
    sync.stop();
  });
}

