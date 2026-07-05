import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:poli_humas/models/activity.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/activities/checkin_screen.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/utils/validators.dart';
import 'package:poli_humas/widgets/common_widgets.dart';

class ActivityDetailScreen extends StatefulWidget {
  const ActivityDetailScreen({super.key, required this.activity});

  final ActivityItem activity;

  @override
  State<ActivityDetailScreen> createState() => _ActivityDetailScreenState();
}

class _ActivityDetailScreenState extends State<ActivityDetailScreen> {
  final _driveLinkController = TextEditingController();
  bool _isSubmittingDoc = false;
  String? _docError;

  @override
  void initState() {
    super.initState();
    final url = widget.activity.documentationUrl;
    if (url != null && url.isNotEmpty) {
      _driveLinkController.text = url;
    }
  }

  @override
  void dispose() {
    _driveLinkController.dispose();
    super.dispose();
  }

  Future<void> _submitDocumentation(ActivityItem activity) async {
    final validation = validateDriveOrVideoUrl(_driveLinkController.text);
    if (!validation.isValid) {
      setState(() => _docError = validation.message);
      return;
    }

    setState(() {
      _docError = null;
      _isSubmittingDoc = true;
    });

    try {
      await context.read<AppDataProvider>().submitDocumentation(
            activityId: activity.id,
            driveUrl: _driveLinkController.text.trim(),
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Link dokumentasi berhasil dikirim!'),
          backgroundColor: AppColors.success,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _docError = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() => _isSubmittingDoc = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final activity =
        context.watch<AppDataProvider>().activityById(widget.activity.id) ?? widget.activity;

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
          'Detail Kegiatan',
          style: TextStyle(color: AppColors.primaryDark, fontWeight: FontWeight.w800),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
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
                  StatusBadge(label: activity.status),
                  const SizedBox(height: 12),
                  Text(
                    activity.title,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    activity.description.isNotEmpty
                        ? activity.description
                        : 'Tim humas ditugaskan untuk melakukan dokumentasi foto dan video serta live streaming acara.',
                    style: const TextStyle(color: AppColors.textSecondary, height: 1.5),
                  ),
                  const SizedBox(height: 16),
                  _InfoRow(icon: Icons.calendar_today, text: activity.date),
                  _InfoRow(icon: Icons.access_time, text: activity.time),
                  _InfoRow(icon: Icons.location_on_outlined, text: activity.location),
                  _InfoRow(icon: Icons.person_outline, text: 'PIC: ${activity.picName}'),
                  if (activity.jobDesk.isNotEmpty)
                    _InfoRow(icon: Icons.work_outline, text: 'Job Desk: ${activity.jobDesk}'),
                ],
              ),
            ),
            const SizedBox(height: 16),
            GestureDetector(
              onTap: activity.hasCheckedIn
                  ? null
                  : () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => CheckinScreen(activity: activity)),
                      ),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: activity.hasCheckedIn ? const Color(0xFF9CA3AF) : AppColors.primaryDark,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.camera_alt_outlined, color: Colors.white, size: 28),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            activity.hasCheckedIn ? 'Sudah Check-in' : 'Check-in Kehadiran',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            activity.hasCheckedIn
                                ? (activity.checkInStatus.isNotEmpty
                                    ? activity.checkInStatus
                                    : 'Anda sudah melakukan check-in.')
                                : 'Melakukan absensi menggunakan selfie dengan validasi lokasi GPS.',
                            style: const TextStyle(color: Colors.white70, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    if (!activity.hasCheckedIn)
                      const Icon(Icons.chevron_right, color: Colors.white),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
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
                  const Row(
                    children: [
                      Icon(Icons.cloud_upload_outlined, color: AppColors.primary),
                      SizedBox(width: 10),
                      Text(
                        'Upload Dokumentasi',
                        style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Mengunggah LINK Google Drive dokumentasi kegiatan.',
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                  ),
                  if (activity.docStatus.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      activity.docStatus,
                      style: TextStyle(
                        color: activity.docStatus.contains('Sudah')
                            ? AppColors.success
                            : AppColors.textSecondary,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ],
                  const SizedBox(height: 14),
                  const Text('Link Google Drive', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _driveLinkController,
                    enabled: !_isSubmittingDoc,
                    decoration: InputDecoration(
                      hintText: 'https://drive.google.com/...',
                      filled: true,
                      fillColor: AppColors.background,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      errorText: _docError,
                    ),
                    onChanged: (_) {
                      if (_docError != null) setState(() => _docError = null);
                    },
                  ),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: _isSubmittingDoc ? null : () => _submitDocumentation(activity),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primary,
                        side: const BorderSide(color: AppColors.primary),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: _isSubmittingDoc
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Kirim Link Dokumentasi', style: TextStyle(fontWeight: FontWeight.w700)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
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
                  const Text(
                    'Timeline Kegiatan',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                  ),
                  const SizedBox(height: 16),
                  if (activity.timeline.isEmpty)
                    const Text(
                      'Belum ada timeline untuk kegiatan ini.',
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                    )
                  else
                    ...List.generate(activity.timeline.length, (index) {
                      final item = activity.timeline[index];
                      return _TimelineItem(
                        title: item.title,
                        time: item.time,
                        isActive: item.isActive,
                        isLast: index == activity.timeline.length - 1,
                      );
                    }),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.textSecondary),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: const TextStyle(color: AppColors.textSecondary))),
        ],
      ),
    );
  }
}

class _TimelineItem extends StatelessWidget {
  const _TimelineItem({
    required this.title,
    required this.time,
    required this.isActive,
    required this.isLast,
  });

  final String title;
  final String time;
  final bool isActive;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: isActive ? AppColors.success : const Color(0xFFD1D5DB),
                  shape: BoxShape.circle,
                ),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    color: const Color(0xFFE5E7EB),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      color: isActive ? AppColors.textPrimary : AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(time, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}