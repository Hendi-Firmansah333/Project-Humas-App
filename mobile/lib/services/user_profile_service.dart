import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:poli_humas/models/user_profile.dart';
import 'package:poli_humas/services/api_service.dart';
import 'package:poli_humas/services/cloudinary_service.dart';
import 'package:poli_humas/services/local_storage.dart';

class UserProfileService extends ChangeNotifier {
  UserProfileService._();

  static final UserProfileService instance = UserProfileService._();

  static const _storageKey = 'user_profile';

  UserProfile _profile = const UserProfile(
    name: '',
    role: 'Anggota Humas',
    phone: '',
    email: '',
  );

  UserProfile get profile => _profile;

  Future<void> load() async {
    final raw = await LocalStorage.getString(_storageKey);
    if (raw != null && raw.trim().isNotEmpty) {
      try {
        _profile = UserProfile.fromJson(jsonDecode(raw) as Map<String, dynamic>);
        notifyListeners();
      } catch (e) {
        debugPrint('Error decoding user profile JSON: $e');
      }
    }
  }

  Future<void> refreshFromApi() async {
    if (!ApiService.instance.isAvailable) return;
    try {
      final user = await ApiService.instance.fetchProfile();
      await syncFromApi(user);
    } catch (e) {
      debugPrint('Failed to refresh user profile from API: $e');
    }
  }

  Future<void> syncFromApi(Map<String, dynamic> user) async {
    final role = user['role'] as String? ?? 'USER';
    final roleLabel = user['roleLabel'] as String?;
    _profile = UserProfile(
      id: user['id'] as int?,
      name: user['fullName'] as String? ?? user['username'] as String? ?? '',
      role: roleLabel ?? (role == 'ADMIN' ? 'Admin Humas' : 'Anggota Humas'),
      phone: user['phone'] as String? ?? '',
      email: user['email'] as String? ?? '',
      photoPath: user['avatar'] as String?,
      emailEditable: false,
    );
    await LocalStorage.setString(_storageKey, jsonEncode(_profile.toJson()));
    notifyListeners();
  }

  Future<void> clear() async {
    _profile = const UserProfile(
      name: '',
      role: 'Anggota Humas',
      phone: '',
      email: '',
    );
    await LocalStorage.setString(_storageKey, '');
    notifyListeners();
  }

  Future<void> saveProfile({
    required String name,
    required String phone,
    required String email,
    String? photoPath,
    bool clearPhoto = false,
  }) async {
    if (ApiService.instance.isAvailable) {
      String? resolvedAvatar = _profile.photoPath;
      var includeAvatar = false;

      if (clearPhoto) {
        resolvedAvatar = null;
        includeAvatar = true;
      } else if (photoPath != null && photoPath.trim().isNotEmpty) {
        final trimmedPhoto = photoPath.trim();
        if (trimmedPhoto.startsWith('http://') || trimmedPhoto.startsWith('https://')) {
          resolvedAvatar = trimmedPhoto;
        } else {
          final uploadedUrl = await CloudinaryService.uploadImage(trimmedPhoto);
          if (uploadedUrl == null || uploadedUrl.trim().isEmpty) {
            throw Exception('Gagal mengunggah foto profil ke Cloudinary.');
          }
          resolvedAvatar = uploadedUrl.trim();
        }
        if (resolvedAvatar != _profile.photoPath) {
          includeAvatar = true;
        }
      }

      final updatedUser = await ApiService.instance.updateMyProfile(
        fullName: name.trim(),
        phone: phone.trim(),
        avatar: resolvedAvatar,
        includeAvatar: includeAvatar,
      );
      await syncFromApi(updatedUser);
      return;
    }

    _profile = _profile.copyWith(
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      photoPath: photoPath,
      clearPhoto: clearPhoto,
    );

    await LocalStorage.setString(_storageKey, jsonEncode(_profile.toJson()));
    notifyListeners();
  }
}