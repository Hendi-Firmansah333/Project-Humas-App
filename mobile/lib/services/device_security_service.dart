import 'package:geolocator/geolocator.dart';

class DeviceSecurityService {
  /// Memeriksa apakah lokasi GPS yang didapat berasal dari aplikasi Fake GPS / Mock Location
  static bool isMockLocation(Position position) {
    // Pada Geolocator package (Android & iOS), parameter isMocked menunjukkan apakah koordinat didapat dari mock provider
    return position.isMocked;
  }

  /// Memeriksa akurasi GPS untuk memastikan tidak ada anomali sinyal (akurasi > 100m dianggap mencurigakan)
  static bool isLocationAccuracyValid(Position position, {double maxAccuracyMeters = 100.0}) {
    return position.accuracy <= maxAccuracyMeters;
  }

  /// Memeriksa kelayakan keamanan lokasi sebelum proses check-in
  static SecurityCheckResult validateCheckInLocation(Position position) {
    if (isMockLocation(position)) {
      return SecurityCheckResult(
        isValid: false,
        errorMessage: 'Terdeteksi penggunaan lokasi tiruan (Fake GPS). Harap matikan aplikasi Mock Location untuk melanjutkan check-in.',
      );
    }

    if (!isLocationAccuracyValid(position)) {
      return SecurityCheckResult(
        isValid: false,
        errorMessage: 'Sinyal GPS kurang akurat (${position.accuracy.toStringAsFixed(1)}m). Harap cari area terbuka untuk mendapatkan akurasi lokasi yang lebih baik.',
      );
    }

    return SecurityCheckResult(isValid: true);
  }
}

class SecurityCheckResult {
  final bool isValid;
  final String? errorMessage;

  SecurityCheckResult({required this.isValid, this.errorMessage});
}
