import 'package:flutter/material.dart';
import 'package:poli_humas/services/fcm_service.dart';
import 'package:poli_humas/services/local_storage.dart';

class AppSettingsService extends ChangeNotifier {
  AppSettingsService._();
  static final AppSettingsService instance = AppSettingsService._();

  static const _keyNotifications = 'settings_notifications';
  static const _keyLocation = 'settings_location';
  static const _keyDarkMode = 'settings_dark_mode';
  static const _keyLanguage = 'settings_language';

  bool notificationsEnabled = true;
  bool locationEnabled = true;
  bool darkModeEnabled = false;
  String language = 'Indonesia';

  bool _loaded = false;

  Future<void> load() async {
    if (_loaded) return;
    notificationsEnabled = (await LocalStorage.getString(_keyNotifications)) != 'false';
    locationEnabled = (await LocalStorage.getString(_keyLocation)) != 'false';
    darkModeEnabled = false;
    await LocalStorage.setString(_keyDarkMode, 'false');
    language = 'Indonesia';
    await LocalStorage.setString(_keyLanguage, 'Indonesia');
    _loaded = true;
    notifyListeners();
  }

  Future<void> setNotifications(bool value) async {
    notificationsEnabled = value;
    await LocalStorage.setString(_keyNotifications, value.toString());
    notifyListeners();
    if (value) {
      await FcmService.instance.syncTokenWithBackend();
    } else {
      await FcmService.instance.unregisterTokenFromBackend();
    }
  }

  Future<void> setLocation(bool value) async {
    locationEnabled = value;
    await LocalStorage.setString(_keyLocation, value.toString());
    notifyListeners();
  }

  Future<void> setDarkMode(bool value) async {
    darkModeEnabled = false;
    await LocalStorage.setString(_keyDarkMode, 'false');
    notifyListeners();
  }

  Future<void> setLanguage(String value) async {
    language = 'Indonesia';
    await LocalStorage.setString(_keyLanguage, 'Indonesia');
    notifyListeners();
  }
}