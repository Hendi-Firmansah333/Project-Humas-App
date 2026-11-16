import 'package:flutter_test/flutter_test.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/services/app_settings_service.dart';
import 'package:poli_humas/services/auth_service.dart';
import 'package:poli_humas/services/live_location_sync_service.dart';
import 'package:poli_humas/services/local_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() async {
    SharedPreferences.setMockInitialValues({});
    await AppSettingsService.instance.load();
  });

  group('Remember Me & AppSettings integration', () {
    test('saveRememberedCredentials persists and clears username without password', () async {
      await AuthService.instance.saveRememberedCredentials(
        rememberMe: true,
        username: ' humas_staff ',
      );

      final saved = await AuthService.instance.getRememberedCredentials();
      expect(saved.rememberMe, isTrue);
      expect(saved.username, equals('humas_staff'));

      await AuthService.instance.saveRememberedCredentials(
        rememberMe: false,
        username: 'humas_staff',
      );

      final cleared = await AuthService.instance.getRememberedCredentials();
      expect(cleared.rememberMe, isFalse);
      expect(cleared.username, isEmpty);
    });

    test('setNotifications toggles unread badge count while keeping cached notifications', () async {
      await AppSettingsService.instance.setNotifications(true);
      final provider = AppDataProvider();
      addTearDown(provider.dispose);

      await provider.initCacheOnly();
      final baselineUnread = provider.unreadNotificationCount;
      expect(baselineUnread, greaterThan(0));
      expect(provider.notificationsState.items, isNotEmpty);

      await AppSettingsService.instance.setNotifications(false);
      expect(AppSettingsService.instance.notificationsEnabled, isFalse);
      expect(provider.unreadNotificationCount, equals(0));
      expect(provider.notificationsState.items, isNotEmpty);

      await AppSettingsService.instance.setNotifications(true);
      expect(AppSettingsService.instance.notificationsEnabled, isTrue);
      expect(provider.unreadNotificationCount, equals(baselineUnread));
    });

    test('setLocation(false) persists setting and keeps LiveLocationSyncService stopped', () async {
      await AppSettingsService.instance.setLocation(true);
      await AppSettingsService.instance.setLocation(false);

      expect(AppSettingsService.instance.locationEnabled, isFalse);
      expect(await LocalStorage.getString('settings_location'), equals('false'));

      await LiveLocationSyncService.instance.start();
      expect(LiveLocationSyncService.instance.isRunning, isFalse);
    });
  });
}

