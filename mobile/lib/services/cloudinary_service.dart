import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';

class CloudinaryService {
  static const String cloudName = 'dcpne6otf';
  static const String uploadPreset = 'humas_checkin';

  /// Mengunggah gambar ke Cloudinary secara lintas-platform (Android, iOS, & Web) dan mengembalikan URL publik HTTPS.
  static Future<String?> uploadImage(String filePath) async {
    try {
      final file = XFile(filePath);
      final rawName = file.name.isNotEmpty
          ? file.name
          : filePath.split(RegExp(r'[/\\]')).last;
      final fileName = rawName.isNotEmpty ? rawName : 'upload.jpg';

      final MultipartFile multipartFile;
      if (kIsWeb) {
        final bytes = await file.readAsBytes();
        if (bytes.isEmpty) {
          throw Exception('File gambar kosong atau tidak ditemukan di perangkat.');
        }
        multipartFile = MultipartFile.fromBytes(bytes, filename: fileName);
      } else {
        final length = await file.length();
        if (length <= 0) {
          throw Exception('File gambar kosong atau tidak ditemukan di perangkat.');
        }
        multipartFile = await MultipartFile.fromFile(filePath, filename: fileName);
      }

      final dio = Dio(
        BaseOptions(
          connectTimeout: const Duration(seconds: 15),
          sendTimeout: const Duration(seconds: 45),
          receiveTimeout: const Duration(seconds: 30),
        ),
      );
      final formData = FormData.fromMap({
        'file': multipartFile,
        'upload_preset': uploadPreset,
      });

      final response = await dio.post(
        'https://api.cloudinary.com/v1_1/$cloudName/image/upload',
        data: formData,
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return response.data['secure_url'] as String?;
      } else {
        throw Exception('Gagal mengunggah ke Cloudinary (Status: ${response.statusCode})');
      }
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        throw Exception(
          'Koneksi timeout saat mengunggah foto. Periksa sinyal internet Anda.',
        );
      }
      throw Exception('Gagal mengunggah foto ke Cloud: ${e.message ?? e}');
    } catch (e) {
      throw Exception('Gagal mengunggah foto ke Cloud: $e');
    }
  }
}
