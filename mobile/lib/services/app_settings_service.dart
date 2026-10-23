import 'package:flutter/material.dart';
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
    darkModeEnabled = (await LocalStorage.getString(_keyDarkMode)) == 'true';
    language = await LocalStorage.getString(_keyLanguage) ?? 'Indonesia';
    _loaded = true;
    notifyListeners();
  }

  Future<void> setNotifications(bool value) async {
    notificationsEnabled = value;
    await LocalStorage.setString(_keyNotifications, value.toString());
    notifyListeners();
  }

  Future<void> setLocation(bool value) async {
    locationEnabled = value;
    await LocalStorage.setString(_keyLocation, value.toString());
    notifyListeners();
  }

  Future<void> setDarkMode(bool value) async {
    darkModeEnabled = value;
    await LocalStorage.setString(_keyDarkMode, value.toString());
    notifyListeners();
  }

  Future<void> setLanguage(String value) async {
    language = value;
    await LocalStorage.setString(_keyLanguage, value);
    notifyListeners();
  }
}