import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'web_storage_stub.dart' if (dart.library.html) 'web_storage.dart';

class LocalStorage {
  LocalStorage._();

  static SharedPreferences? _prefs;
  static final Map<String, String> _memory = {};
  static bool _useWebStorage = false;
  static bool _initialized = false;

  static Future<void> init() async {
    if (_initialized) return;

    try {
      _prefs = await SharedPreferences.getInstance();
    } catch (_) {
      if (kIsWeb) _useWebStorage = true;
    }

    _initialized = true;
  }

  static Future<String?> getString(String key) async {
    await init();
    if (_prefs != null) return _prefs!.getString(key);
    if (_useWebStorage) return readWebStorage(key);
    return _memory[key];
  }

  static Future<bool> setString(String key, String value) async {
    await init();
    if (_prefs != null) return _prefs!.setString(key, value);
    if (_useWebStorage) {
      writeWebStorage(key, value);
      return true;
    }
    _memory[key] = value;
    return true;
  }

  static Future<bool?> getBool(String key) async {
    await init();
    if (_prefs != null) return _prefs!.getBool(key);
    final val = await getString(key);
    if (val == null) return null;
    return val == 'true';
  }

  static Future<bool> setBool(String key, bool value) async {
    await init();
    if (_prefs != null) return _prefs!.setBool(key, value);
    return setString(key, value.toString());
  }
}