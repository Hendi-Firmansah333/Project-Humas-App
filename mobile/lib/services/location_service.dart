import 'package:geolocator/geolocator.dart';
import 'package:poli_humas/services/device_security_service.dart';

class LocationValidationResult {
  const LocationValidationResult({
    required this.isValid,
    required this.latitude,
    required this.longitude,
    required this.distanceMeters,
    this.errorMessage,
    this.isMocked = false,
  });

  final bool isValid;
  final double latitude;
  final double longitude;
  final double distanceMeters;
  final String? errorMessage;
  final bool isMocked;
}

class LocationService {
  LocationService._();

  static final LocationService instance = LocationService._();

  Future<bool> ensurePermission() async {
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.deniedForever) return false;
    return permission == LocationPermission.always || permission == LocationPermission.whileInUse;
  }

  Future<Position> getCurrentPosition() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw Exception('Layanan lokasi tidak aktif. Aktifkan GPS terlebih dahulu.');
    }
    final hasPermission = await ensurePermission();
    if (!hasPermission) {
      throw Exception('Izin lokasi ditolak. Berikan izin lokasi pada aplikasi.');
    }
    return Geolocator.getCurrentPosition(locationSettings: const LocationSettings(
      accuracy: LocationAccuracy.high,
      timeLimit: Duration(seconds: 15),
    ));
  }

  Future<LocationValidationResult> validateGeofence({
    required double targetLat,
    required double targetLng,
    required double radiusMeters,
  }) async {
    try {
      final position = await getCurrentPosition();

      // Periksa integritas perangkat & Anti Fake GPS
      final secResult = DeviceSecurityService.validateCheckInLocation(position);
      if (!secResult.isValid) {
        return LocationValidationResult(
          isValid: false,
          latitude: position.latitude,
          longitude: position.longitude,
          distanceMeters: -1,
          isMocked: position.isMocked,
          errorMessage: secResult.errorMessage,
        );
      }

      final distance = Geolocator.distanceBetween(
        position.latitude,
        position.longitude,
        targetLat,
        targetLng,
      );
      return LocationValidationResult(
        isValid: distance <= radiusMeters,
        latitude: position.latitude,
        longitude: position.longitude,
        distanceMeters: distance,
        isMocked: position.isMocked,
        errorMessage: distance <= radiusMeters
            ? null
            : 'Anda berada ${distance.round()}m dari lokasi kegiatan (maks ${radiusMeters.round()}m).',
      );
    } catch (e) {
      return LocationValidationResult(
        isValid: false,
        latitude: 0,
        longitude: 0,
        distanceMeters: -1,
        errorMessage: e.toString().replaceFirst('Exception: ', ''),
      );
    }
  }
}