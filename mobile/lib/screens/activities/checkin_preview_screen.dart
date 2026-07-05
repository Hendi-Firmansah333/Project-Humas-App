import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart' show LatLng;
import 'package:provider/provider.dart';
import 'package:poli_humas/models/activity.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/activities/checkin_success_screen.dart';
import 'package:poli_humas/services/location_service.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/widgets/local_image_preview.dart';

class CheckinPreviewScreen extends StatefulWidget {
  const CheckinPreviewScreen({
    super.key,
    required this.activity,
    required this.selfiePath,
    required this.locationResult,
  });

  final ActivityItem activity;
  final String selfiePath;
  final LocationValidationResult locationResult;

  @override
  State<CheckinPreviewScreen> createState() => _CheckinPreviewScreenState();
}

class _CheckinPreviewScreenState extends State<CheckinPreviewScreen> {
  bool _isSubmitting = false;

  String get _recordedTime {
    final now = DateTime.now();
    return '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
  }

  bool _computeIsLate(ActivityItem activity) {
    final scheduledAt = activity.scheduledAt;
    if (scheduledAt == null) return false;
    return DateTime.now().isAfter(scheduledAt.add(const Duration(minutes: 15)));
  }

  Future<void> _submit() async {
    setState(() => _isSubmitting = true);
    try {
      final isLate = _computeIsLate(widget.activity);
      final updated = await context.read<AppDataProvider>().submitCheckIn(
            activityId: widget.activity.id,
            selfiePath: widget.selfiePath,
            isLate: isLate,
          );
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => CheckinSuccessScreen(
            activity: updated,
            recordedTime: _recordedTime,
            isLate: isLate,
            distanceMeters: widget.locationResult.distanceMeters,
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
      );
      setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final activity =
        context.watch<AppDataProvider>().activityById(widget.activity.id) ?? widget.activity;
    final isOnTime = !_computeIsLate(activity);
    final userPoint = LatLng(widget.locationResult.latitude, widget.locationResult.longitude);

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
          'Check-in Preview',
          style: TextStyle(color: AppColors.primaryDark, fontWeight: FontWeight.w800),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Stack(
                children: [
                  SizedBox(
                    height: 280,
                    width: double.infinity,
                    child: buildLocalImagePreview(path: widget.selfiePath, fit: BoxFit.cover),
                  ),
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.location_on, color: AppColors.primary, size: 16),
                          const SizedBox(width: 4),
                          Text(
                            activity.location,
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.6),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '$_recordedTime WIB',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Data Check-in', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                  const SizedBox(height: 16),
                  _DataRow(
                    icon: Icons.event,
                    label: 'Lokasi',
                    value: activity.location,
                  ),
                  const SizedBox(height: 14),
                  _DataRow(
                    icon: Icons.access_time,
                    label: 'Waktu Tercatat',
                    value: '$_recordedTime WIB - ${isOnTime ? 'Tepat Waktu' : 'Terlambat'}',
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      const Icon(Icons.gps_fixed, color: AppColors.textSecondary, size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Status GPS', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                            Text(
                              'Akurat (Radius ${widget.locationResult.distanceMeters.round()}m)',
                              style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                            ),
                            Text(
                              '${userPoint.latitude.toStringAsFixed(4)}, ${userPoint.longitude.toStringAsFixed(4)}',
                              style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.check_circle, color: AppColors.success, size: 24),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _isSubmitting ? null : _submit,
                icon: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.cloud_upload_outlined, color: Colors.white),
                label: Text(
                  _isSubmitting ? 'Mengirim...' : 'Upload Sekarang',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _isSubmitting ? null : () => Navigator.pop(context),
                icon: const Icon(Icons.refresh),
                label: const Text('Foto Ulang', style: TextStyle(fontWeight: FontWeight.w700)),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DataRow extends StatelessWidget {
  const _DataRow({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: AppColors.textSecondary, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
              const SizedBox(height: 2),
              Text(value, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
            ],
          ),
        ),
      ],
    );
  }
}