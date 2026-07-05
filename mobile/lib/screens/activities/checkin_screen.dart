import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:latlong2/latlong.dart' show LatLng;
import 'package:provider/provider.dart';
import 'package:poli_humas/models/activity.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/activities/checkin_preview_screen.dart';
import 'package:poli_humas/services/location_service.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/widgets/app_map_view.dart';
import 'package:poli_humas/widgets/local_image_preview.dart';

class CheckinScreen extends StatefulWidget {
  const CheckinScreen({super.key, required this.activity});

  final ActivityItem activity;

  @override
  State<CheckinScreen> createState() => _CheckinScreenState();
}

class _CheckinScreenState extends State<CheckinScreen> {
  final _picker = ImagePicker();

  LocationValidationResult? _locationResult;
  bool _isValidatingLocation = true;
  String? _selfiePath;
  String? _submitError;

  LatLng _activityPoint(ActivityItem activity) => LatLng(activity.latitude, activity.longitude);

  bool get _isLocationValid => _locationResult?.isValid ?? false;

  bool _canContinue(ActivityItem activity) =>
      _isLocationValid && _selfiePath != null && !activity.hasCheckedIn;

  @override
  void initState() {
    super.initState();
    _validateLocation();
  }

  Future<void> _validateLocation() async {
    setState(() {
      _isValidatingLocation = true;
      _submitError = null;
    });
    final result = await LocationService.instance.validateGeofence(
      targetLat: widget.activity.latitude,
      targetLng: widget.activity.longitude,
      radiusMeters: widget.activity.geofenceRadiusMeters,
    );
    if (!mounted) return;
    setState(() {
      _locationResult = result;
      _isValidatingLocation = false;
    });
  }

  Future<void> _takeSelfie() async {
    try {
      final picked = await _picker.pickImage(
        source: ImageSource.camera,
        preferredCameraDevice: CameraDevice.front,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );
      if (picked != null) {
        setState(() {
          _selfiePath = picked.path;
          _submitError = null;
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gagal mengambil selfie: $e')),
      );
    }
  }

  void _openPreview(ActivityItem activity) {
    if (!_canContinue(activity) || _selfiePath == null || _locationResult == null) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CheckinPreviewScreen(
          activity: activity,
          selfiePath: _selfiePath!,
          locationResult: _locationResult!,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final activity =
        context.watch<AppDataProvider>().activityById(widget.activity.id) ?? widget.activity;
    final userPoint = _locationResult != null && _locationResult!.distanceMeters >= 0
        ? LatLng(_locationResult!.latitude, _locationResult!.longitude)
        : null;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Check-in Kehadiran',
          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            onPressed: _isValidatingLocation ? null : _validateLocation,
            icon: const Icon(Icons.refresh, color: AppColors.textPrimary),
            tooltip: 'Perbarui lokasi',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.location_on, color: AppColors.textPrimary),
                SizedBox(width: 8),
                Text('Lokasi Saat Ini', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
              ),
              child: _isValidatingLocation
                  ? const Row(
                      children: [
                        SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        SizedBox(width: 12),
                        Text('Memvalidasi lokasi GPS...'),
                      ],
                    )
                  : Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                activity.location,
                                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                              ),
                              const SizedBox(height: 4),
                              if (userPoint != null)
                                Text(
                                  '${userPoint.latitude.toStringAsFixed(4)}, ${userPoint.longitude.toStringAsFixed(4)}',
                                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                                ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: (_isLocationValid ? AppColors.success : AppColors.danger)
                                .withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                _isLocationValid ? Icons.check_circle : Icons.gps_off,
                                color: _isLocationValid ? AppColors.success : AppColors.danger,
                                size: 16,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                _isLocationValid ? 'GPS Valid' : 'GPS Invalid',
                                style: TextStyle(
                                  color: _isLocationValid ? AppColors.success : AppColors.danger,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
            ),
            const SizedBox(height: 14),
            AppMapView(
              center: _activityPoint(activity),
              userLocation: userPoint,
              markers: [
                MapMarkerData(
                  id: activity.id,
                  point: _activityPoint(activity),
                  label: activity.location,
                ),
              ],
              height: 160,
            ),
            const SizedBox(height: 12),
            if (!_isValidatingLocation)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: (_isLocationValid ? AppColors.success : AppColors.danger)
                      .withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(
                      _isLocationValid ? Icons.verified_user : Icons.location_off,
                      color: _isLocationValid ? AppColors.success : AppColors.danger,
                      size: 20,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        _isLocationValid
                            ? 'Lokasi Anda berada di dalam area kegiatan.'
                            : (_locationResult?.errorMessage ??
                                'Lokasi Anda berada di luar area kegiatan.'),
                        style: TextStyle(
                          color: _isLocationValid ? AppColors.success : AppColors.danger,
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            if (activity.hasCheckedIn) ...[
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, color: AppColors.warning, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        activity.checkInStatus.isNotEmpty
                            ? activity.checkInStatus
                            : 'Anda sudah melakukan check-in untuk kegiatan ini.',
                        style: const TextStyle(
                          color: AppColors.warning,
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 24),
            const Text(
              'Ambil Selfie Kehadiran',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
            ),
            const SizedBox(height: 14),
            Container(
              height: 220,
              width: double.infinity,
              decoration: BoxDecoration(
                color: const Color(0xFF1F2937),
                borderRadius: BorderRadius.circular(16),
              ),
              clipBehavior: Clip.antiAlias,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  if (_selfiePath != null)
                    Positioned.fill(
                      child: buildLocalImagePreview(path: _selfiePath!, fit: BoxFit.cover),
                    )
                  else
                    const Icon(Icons.face_retouching_natural, size: 64, color: Colors.white24),
                  if (_selfiePath == null) ...[
                    Positioned(top: 16, left: 16, child: _cornerBracket(true, true)),
                    Positioned(top: 16, right: 16, child: _cornerBracket(true, false)),
                    Positioned(bottom: 40, left: 16, child: _cornerBracket(false, true)),
                    Positioned(bottom: 40, right: 16, child: _cornerBracket(false, false)),
                  ],
                  Positioned(
                    bottom: 12,
                    child: Text(
                      _selfiePath != null ? 'Pratinjau selfie' : 'Posisikan wajah di tengah',
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
            if (_submitError != null) ...[
              const SizedBox(height: 12),
              Text(
                _submitError!,
                style: const TextStyle(color: AppColors.danger, fontSize: 13, fontWeight: FontWeight.w600),
              ),
            ],
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: activity.hasCheckedIn ? null : _takeSelfie,
                    icon: const Icon(Icons.camera_alt_outlined),
                    label: Text(_selfiePath != null ? 'Ambil Ulang' : 'Ambil Selfie'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _canContinue(activity) ? () => _openPreview(activity) : null,
                    icon: const Icon(Icons.arrow_forward, color: Colors.white),
                    label: const Text(
                      'Kirim Check-in',
                      style: TextStyle(color: Colors.white),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _cornerBracket(bool top, bool left) {
    return SizedBox(
      width: 24,
      height: 24,
      child: CustomPaint(painter: _BracketPainter(top: top, left: left)),
    );
  }
}

class _BracketPainter extends CustomPainter {
  _BracketPainter({required this.top, required this.left});

  final bool top;
  final bool left;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;

    final path = Path();
    if (top && left) {
      path.moveTo(0, size.height);
      path.lineTo(0, 0);
      path.lineTo(size.width, 0);
    } else if (top && !left) {
      path.moveTo(0, 0);
      path.lineTo(size.width, 0);
      path.lineTo(size.width, size.height);
    } else if (!top && left) {
      path.moveTo(0, 0);
      path.lineTo(0, size.height);
      path.lineTo(size.width, size.height);
    } else {
      path.moveTo(size.width, 0);
      path.lineTo(size.width, size.height);
      path.lineTo(0, size.height);
    }
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}