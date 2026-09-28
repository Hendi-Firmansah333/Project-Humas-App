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

  bool _isActivityStarted(ActivityItem activity) {
    try {
      final dateParts = activity.date.split('-');
      if (dateParts.length < 3) return true;
      final year = int.parse(dateParts[0]);
      final month = int.parse(dateParts[1]);
      final day = int.parse(dateParts[2]);

      final timeStart = activity.time.split(' - ').first.trim();
      final timeParts = timeStart.split(':');
      final hour = int.parse(timeParts[0]);
      final minute = int.parse(timeParts[1]);

      final startDateTime = DateTime(year, month, day, hour, minute);
      return DateTime.now().isAfter(startDateTime) || DateTime.now().isAtSameMomentAs(startDateTime);
    } catch (_) {
      return true;
    }
  }

  @override
  Widget build(BuildContext context) {
    final activity =
        context.watch<AppDataProvider>().activityById(widget.activity.id) ?? widget.activity;

    final isStarted = _isActivityStarted(activity);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.card,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Detail Kegiatan',
          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800),
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
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          !isStarted ? 'Akan Datang' : activity.status,
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w700,
                            fontSize: 12,
                          ),
                        ),
                      ),
                      const Spacer(),
                      StatusBadge(
                        label: activity.hasCheckedIn
                            ? 'Sudah Hadir'
                            : !isStarted
                                ? 'Belum Dimulai'
                                : 'Sedang Berlangsung',
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Text(
                    activity.title,
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    activity.description.isNotEmpty
                        ? activity.description
                        : 'Tim humas ditugaskan untuk melakukan dokumentasi foto dan video serta live streaming acara.',
                    style: TextStyle(color: AppColors.textSecondary, height: 1.5),
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
              onTap: () {
                if (activity.hasCheckedIn) return;
                if (!isStarted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Absensi belum dibuka. Kegiatan baru dimulai pukul ${activity.time.split(' - ').first} WIB.'),
                      backgroundColor: AppColors.danger,
                    ),
                  );
                  return;
                }
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => CheckinScreen(activity: activity)),
                );
              },
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: activity.hasCheckedIn || !isStarted
                      ? const Color(0xFF9CA3AF)
                      : AppColors.primaryDark,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Icon(
                      !isStarted ? Icons.lock_clock : Icons.camera_alt_outlined,
                      color: Colors.white,
                      size: 28,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            activity.hasCheckedIn
                                ? 'Sudah Check-in'
                                : !isStarted
                                    ? 'Acara Belum Dimulai'
                                    : 'Check-in Kehadiran',
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
                                : !isStarted
                                    ? 'Absensi dibuka saat kegiatan dimulai pada pukul ${activity.time.split(' - ').first} WIB.'
                                    : 'Melakukan absensi menggunakan selfie dengan validasi lokasi GPS.',
                            style: const TextStyle(color: Colors.white70, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    if (!activity.hasCheckedIn && isStarted)
                      const Icon(Icons.chevron_right, color: Colors.white),
                  ],
                ),
              ),
            ),
            if (activity.assignedEquipments.isNotEmpty) ...[
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
                    Row(
                      children: [
                        const Icon(Icons.inventory_2_outlined, color: AppColors.primary),
                        const SizedBox(width: 10),
                        const Text(
                          'Peralatan yang Ditugaskan',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            '${activity.assignedEquipments.length} Alat',
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w700,
                              fontSize: 11,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ...activity.assignedEquipments.map((eq) {
                      final isReturned = eq.isReturned;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isReturned ? AppColors.success.withValues(alpha: 0.3) : const Color(0xFFE5E7EB),
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                color: isReturned
                                    ? AppColors.success.withValues(alpha: 0.1)
                                    : AppColors.primary.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Icon(
                                isReturned ? Icons.check_circle_outline : Icons.camera_alt_outlined,
                                color: isReturned ? AppColors.success : AppColors.primary,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    eq.name,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 13,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${eq.category}${eq.brand != null && eq.brand!.isNotEmpty ? ' • ${eq.brand}' : ''} (${eq.code})',
                                    style: TextStyle(
                                      color: AppColors.textSecondary,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '${eq.quantity} Unit',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 12,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  isReturned ? 'Dikembalikan' : 'Digunakan',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600,
                                    color: isReturned ? AppColors.success : const Color(0xFFD97706),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    }),
                  ],
                ),
              ),
            ],
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
                  Text(
                    !isStarted
                        ? 'Dokumentasi hanya dapat diunggah setelah kegiatan dimulai.'
                        : 'Mengunggah LINK Google Drive dokumentasi kegiatan.',
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
                    enabled: !_isSubmittingDoc && isStarted,
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
                      onPressed: (_isSubmittingDoc || !isStarted)
                          ? null
                          : () => _submitDocumentation(activity),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primary,
                        side: const BorderSide(color: AppColors.primary),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: _isSubmittingDoc
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text(
                              'Simpan Link Google Drive',
                              style: TextStyle(fontWeight: FontWeight.w700),
                            ),
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
                color: AppColors.card,
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
                    Text(
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
          Expanded(child: Text(text, style: TextStyle(color: AppColors.textSecondary))),
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
                  Text(time, style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
