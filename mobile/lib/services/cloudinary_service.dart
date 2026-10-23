import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';

class CloudinaryService {
  // TODO: Silakan ganti 'YOUR_CLOUD_NAME' dengan Cloud Name dari Dashboard Cloudinary Anda
  static const String cloudName = 'dcpne6otf';
  static const String uploadPreset = 'humas_checkin';

  /// Fungsi untuk mengunggah gambar ke Cloudinary dan mengembalikan URL publik HTTPS
  static Future<String?> uploadImage(String filePath) async {
    try {
      final file = File(filePath);
      if (!await file.exists()) {
        throw Exception('File gambar tidak ditemukan di perangkat.');
      }

      final bytes = await file.readAsBytes();
      final base64Image = base64Encode(bytes);
      final ext = filePath.split('.').last.toLowerCase();
      final mimeType = ext == 'png' ? 'image/png' : 'image/jpeg';

      final dio = Dio();
      final response = await dio.post(
        'https://api.cloudinary.com/v1_1/$cloudName/image/upload',
        data: {
          'file': 'data:$mimeType;base64,$base64Image',
          'upload_preset': uploadPreset,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return response.data['secure_url'] as String?;
      } else {
        throw Exception('Gagal mengunggah ke Cloudinary (Status: ${response.statusCode})');
      }
    } catch (e) {
      throw Exception('Gagal mengunggah foto ke Cloud: $e');
    }
  }
}
