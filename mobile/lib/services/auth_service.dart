import 'package:dio/dio.dart';
import 'package:poli_humas/config/api_config.dart';
import 'package:poli_humas/services/api_client.dart';
import 'package:poli_humas/services/api_service.dart';
import 'package:poli_humas/services/live_location_sync_service.dart';
import 'package:poli_humas/services/local_storage.dart';
import 'package:poli_humas/services/user_profile_service.dart';

class PasswordValidationResult {
  const PasswordValidationResult({required this.isValid, this.message});

  final bool isValid;
  final String? message;
}

class AuthService {
  AuthService._();

  static final AuthService instance = AuthService._();

  static const defaultPassword = 'Humas@123';
  static const _passwordKey = 'user_password';
  static const _loggedInKey = 'is_logged_in';

  String _password = defaultPassword;
  bool _isLoggedIn = false;

  Future<void> load() async {
    _password = await LocalStorage.getString(_passwordKey) ?? defaultPassword;
    _isLoggedIn = (await LocalStorage.getString(_loggedInKey)) == 'true';
  }

  bool verifyPassword(String password) => _password == password;

  bool get isLoggedIn {
    if (ApiConfig.enabled) return isLoggedInWithApi;
    return _isLoggedIn;
  }

  bool get isLoggedInWithApi => ApiConfig.enabled && ApiClient.instance.hasToken;

  Future<void> setLoggedIn(bool value) async {
    _isLoggedIn = value;
    await LocalStorage.setString(_loggedInKey, value ? 'true' : 'false');
  }

  Future<String?> loginRemote({
    required String username,
    required String password,
  }) async {
    if (!ApiConfig.enabled) return null;
    try {
      final result = await ApiService.instance.login(username, password);
      final token = (result['token'] ?? result['accessToken']) as String?;
      if (token == null || token.isEmpty) {
        return 'Login gagal. Token tidak diterima.';
      }
      await ApiClient.instance.setToken(token);
      Map<String, dynamic>? user;
      if (result['user'] is Map<String, dynamic>) {
        user = result['user'] as Map<String, dynamic>;
      } else {
        user = await ApiService.instance.fetchProfile();
      }
      final role = user['role'] as String? ?? 'USER';
      if (role == 'ADMIN') {
        await ApiClient.instance.clearToken();
        return 'Akses mobile hanya untuk Anggota Humas. Admin menggunakan aplikasi web.';
      }
      await UserProfileService.instance.syncFromApi(user);
      await setLoggedIn(true);
      await LocalStorage.setString('app_data_cache', '');
      LiveLocationSyncService.instance.start();
      return null;
    } on DioException catch (e) {
      final data = e.response?.data;
      if (data is Map && data['errors'] is Map) {
        final errors = data['errors'] as Map;
        final usernameErrors = errors['username'];
        if (usernameErrors is List && usernameErrors.isNotEmpty) {
          return usernameErrors.first.toString();
        }
      }
      if (data is Map && data['message'] is String) {
        return data['message'] as String;
      }
      return 'Tidak dapat terhubung ke server. Periksa koneksi dan pastikan backend berjalan.';
    } catch (_) {
      return 'Login gagal. Periksa koneksi jaringan.';
    }
  }

  Future<void> logoutRemote() async {
    await LiveLocationSyncService.instance.stop(markOffline: true);
    if (ApiClient.instance.hasToken) {
      try {
        await ApiClient.instance.post('/auth/logout');
      } catch (_) {}
      await ApiClient.instance.clearToken();
    }
    await UserProfileService.instance.clear();
    await setLoggedIn(false);
  }

  PasswordValidationResult validateNewPassword({
    required String oldPassword,
    required String newPassword,
    required String confirmPassword,
  }) {
    if (oldPassword.isEmpty) {
      return const PasswordValidationResult(isValid: false, message: 'Password lama wajib diisi.');
    }
    if (_password != oldPassword) {
      return const PasswordValidationResult(
        isValid: false,
        message: 'Password lama tidak sesuai.',
      );
    }
    if (newPassword.length < 8) {
      return const PasswordValidationResult(
        isValid: false,
        message: 'Password baru minimal 8 karakter.',
      );
    }
    if (!RegExp(r'[A-Z]').hasMatch(newPassword)) {
      return const PasswordValidationResult(
        isValid: false,
        message: 'Password baru harus mengandung huruf besar.',
      );
    }
    if (!RegExp(r'[a-z]').hasMatch(newPassword)) {
      return const PasswordValidationResult(
        isValid: false,
        message: 'Password baru harus mengandung huruf kecil.',
      );
    }
    if (!RegExp(r'[0-9]').hasMatch(newPassword)) {
      return const PasswordValidationResult(
        isValid: false,
        message: 'Password baru harus mengandung angka.',
      );
    }
    if (newPassword == oldPassword) {
      return const PasswordValidationResult(
        isValid: false,
        message: 'Password baru harus berbeda dari password lama.',
      );
    }
    if (newPassword != confirmPassword) {
      return const PasswordValidationResult(
        isValid: false,
        message: 'Konfirmasi password tidak cocok.',
      );
    }
    return const PasswordValidationResult(isValid: true);
  }

  Future<bool> changePassword({
    required String oldPassword,
    required String newPassword,
    required String confirmPassword,
  }) async {
    final validation = validateNewPassword(
      oldPassword: oldPassword,
      newPassword: newPassword,
      confirmPassword: confirmPassword,
    );
    if (!validation.isValid) return false;

    _password = newPassword;
    await LocalStorage.setString(_passwordKey, _password);
    return true;
  }
}