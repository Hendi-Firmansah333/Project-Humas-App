import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:poli_humas/models/activity.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/activities/checkin_screen.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/utils/validators.dart';
import 'package:poli_humas/widgets/common_widgets.dart';

TextStyle _pj(
  double size,
  FontWeight w,
  Color color, {
  double? height,
  double? ls,
}) =>
    GoogleFonts.plusJakartaSans(
      fontSize: size,
      fontWeight: w,
      color: color,
      height: height,
      letterSpacing: ls,
    );

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

  DateTime? _parseStartDateTime(ActivityItem activity) {
    try {
      DateTime? baseDate =
          activity.scheduledAt ?? DateTime.tryParse(activity.date.trim());
      if (baseDate == null) {
        final dateParts = activity.date.trim().split('-');
        if (dateParts.length >= 3) {
          final year = int.parse(dateParts[0]);
          final month = int.parse(dateParts[1]);
          final day = int.parse(dateParts[2].split('T').first);
          baseDate = DateTime(year, month, day);
        }
      }
      if (baseDate == null) return null;

      final timeStart =
          activity.time.split(' - ').first.replaceAll('WIB', '').trim();
      final timeParts = timeStart.split(':');
      if (timeParts.length >= 2) {
        final hour = int.tryParse(timeParts[0]) ?? baseDate.hour;
        final minute = int.tryParse(timeParts[1]) ?? baseDate.minute;
        return DateTime(
          baseDate.year,
          baseDate.month,
          baseDate.day,
          hour,
          minute,
        );
      }
      return baseDate;
    } catch (_) {
      return null;
    }
  }

  bool _isCheckInOpen(ActivityItem activity) {
    final startDateTime = _parseStartDateTime(activity);
    if (startDateTime == null) return true;
    final openTime = startDateTime.subtract(const Duration(minutes: 15));
    final now = DateTime.now();
    return now.isAfter(openTime) || now.isAtSameMomentAs(openTime);
  }

  bool _isActivityStarted(ActivityItem activity) {
    final startDateTime = _parseStartDateTime(activity);
    if (startDateTime == null) return true;
    final now = DateTime.now();
    return now.isAfter(startDateTime) || now.isAtSameMomentAs(startDateTime);
  }

  String _formatShortIndonesianDate(String raw, [DateTime? scheduledAt]) {
    const months = [
      '',
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ];

    if (scheduledAt != null) {
      return '${scheduledAt.day} ${months[scheduledAt.month.clamp(1, 12)]} ${scheduledAt.year}';
    }

    final parsed = DateTime.tryParse(raw.trim());
    if (parsed != null) {
      return '${parsed.day} ${months[parsed.month.clamp(1, 12)]} ${parsed.year}';
    }

    final trimmed = raw.trim();
    final parts = trimmed.split(RegExp(r'[\s\n\-/]+'));
    if (parts.length >= 3 && parts[0].length == 4) {
      final y = parts[0];
      final m = int.tryParse(parts[1]) ?? 1;
      final d = int.tryParse(parts[2]) ?? 1;
      return '$d ${months[m.clamp(1, 12)]} $y';
    }

    return trimmed.isNotEmpty ? trimmed : '-';
  }

  String _formatTimeWithWib(String raw) {
    final trimmed = raw.trim();
    if (trimmed.isEmpty) return '-';
    if (trimmed.toUpperCase().contains('WIB')) return trimmed;
    return '$trimmed WIB';
  }

  String _resolveInitials(ActivityItem activity) {
    if (activity.picInitials.trim().isNotEmpty) {
      return activity.picInitials.trim().toUpperCase();
    }
    final words = activity.picName.trim().split(RegExp(r'\s+'));
    if (words.isEmpty || words.first.isEmpty) return '?';
    if (words.length == 1) return words.first.substring(0, 1).toUpperCase();
    return '${words[0][0]}${words[1][0]}'.toUpperCase();
  }

  (Color, Color, Color, String) _resolveStatusPill(
    ActivityItem activity,
    bool isStarted,
  ) {
    final st = activity.status.trim();
    if (st == 'Dibatalkan' || st == 'Ditolak') {
      return (
        const Color(0xFFFEE2E2),
        const Color(0xFFEF4444),
        const Color(0xFF991B1B),
        'Dibatalkan',
      );
    }
    if (st == 'Selesai') {
      return (
        const Color(0xFFEEF2F6),
        const Color(0xFF9AA9B8),
        const Color(0xFF4F6076),
        'Selesai',
      );
    }
    if (!isStarted || st == 'Akan Datang' || st == 'Ditugaskan') {
      return (
        const Color(0xFFDDF1FE),
        const Color(0xFF2BB3FD),
        const Color(0xFF0B5C8C),
        'Akan Datang',
      );
    }
    return (
      const Color(0xFFD9F6EF),
      const Color(0xFF14B89E),
      const Color(0xFF0A6B5B),
      'Sedang Berlangsung',
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;
    final activity =
        context.watch<AppDataProvider>().activityById(widget.activity.id) ??
            widget.activity;

    final isStarted = _isActivityStarted(activity);
    final isCheckInOpen = _isCheckInOpen(activity);
    final (statusBg, statusDot, statusText, statusLabel) =
        _resolveStatusPill(activity, isStarted);

    final bgColor =
        isDark ? const Color(0xFF0F172A) : const Color(0xFFF4F7FC);
    final cardColor = isDark ? const Color(0xFF1E293B) : Colors.white;
    final titleColor = isDark ? Colors.white : const Color(0xFF0B1B2B);
    final bodyColor = isDark ? Colors.white70 : const Color(0xFF4B5B6B);

    final shortDate =
        _formatShortIndonesianDate(activity.date, activity.scheduledAt);
    final timeWithWib = _formatTimeWithWib(activity.time);
    final initials = _resolveInitials(activity);

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Column(
          children: [
            // ── CUSTOM TOP HEADER (Figma 5318:9810) ──
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 16),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: cardColor,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isDark
                            ? Colors.white12
                            : const Color(0xFFD5E0EA),
                        width: 1,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF103050).withValues(
                            alpha: isDark ? 0.25 : 0.06,
                          ),
                          blurRadius: 6,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Material(
                      color: Colors.transparent,
                      shape: const CircleBorder(),
                      child: InkWell(
                        customBorder: const CircleBorder(),
                        onTap: () => Navigator.pop(context),
                        child: Icon(
                          Icons.arrow_back_rounded,
                          size: 20,
                          color: titleColor,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Detail Kegiatan',
                          style: _pj(
                            22,
                            FontWeight.w800,
                            titleColor,
                            ls: -0.3,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Informasi tugas & kehadiran Tim Humas',
                          style: _pj(13, FontWeight.w400, bodyColor),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // ── SCROLLABLE CONTENT ──
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── SECTION 1: MAIN ACTIVITY INFO CARD (Figma 5318:9821) ──
                    Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: cardColor,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF103050).withValues(
                              alpha: isDark ? 0.28 : 0.08,
                            ),
                            blurRadius: 16,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(24),
                        child: Stack(
                          children: [
                            Padding(
                              padding:
                                  const EdgeInsets.fromLTRB(24, 22, 20, 20),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Status Pill Row
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 12,
                                          vertical: 6,
                                        ),
                                        decoration: BoxDecoration(
                                          color: isDark
                                              ? statusBg.withValues(alpha: 0.2)
                                              : statusBg,
                                          borderRadius:
                                              BorderRadius.circular(999),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Container(
                                              width: 7,
                                              height: 7,
                                              decoration: BoxDecoration(
                                                color: statusDot,
                                                shape: BoxShape.circle,
                                              ),
                                            ),
                                            const SizedBox(width: 6),
                                            Text(
                                              statusLabel,
                                              style: _pj(
                                                12,
                                                FontWeight.w700,
                                                isDark
                                                    ? Colors.white
                                                    : statusText,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      if (activity.hasCheckedIn) ...[
                                        const Spacer(),
                                        const StatusBadge(
                                          label: 'Sudah Hadir',
                                          color: AppColors.success,
                                        ),
                                      ],
                                    ],
                                  ),

                                  const SizedBox(height: 14),

                                  // Title
                                  Text(
                                    activity.title,
                                    style: _pj(
                                      21,
                                      FontWeight.w800,
                                      titleColor,
                                      ls: -0.3,
                                    ),
                                  ),

                                  const SizedBox(height: 10),

                                  // Description
                                  Text(
                                    activity.description.trim().isNotEmpty
                                        ? activity.description.trim()
                                        : 'Tim humas ditugaskan untuk melakukan dokumentasi foto dan video serta live streaming acara.',
                                    style: _pj(
                                      14,
                                      FontWeight.w400,
                                      bodyColor,
                                      height: 1.55,
                                    ),
                                  ),

                                  const SizedBox(height: 16),

                                  // Gradient Schedule & Location Box (Figma 5318:9830)
                                  Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 17,
                                      vertical: 15,
                                    ),
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(16),
                                      gradient: LinearGradient(
                                        begin: Alignment.topLeft,
                                        end: Alignment.bottomRight,
                                        colors: isDark
                                            ? const [
                                                Color(0xFF0F172A),
                                                Color(0xFF162235),
                                              ]
                                            : const [
                                                Color(0xFFE8F8F6),
                                                Color(0xFFDCF2F1),
                                              ],
                                      ),
                                      border: Border.all(
                                        color: isDark
                                            ? Colors.white10
                                            : const Color(0xFFCBEAE6),
                                        width: 1,
                                      ),
                                    ),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Icon(
                                              Icons.calendar_today_outlined,
                                              size: 17,
                                              color: titleColor,
                                            ),
                                            const SizedBox(width: 8),
                                            Text(
                                              shortDate,
                                              style: _pj(
                                                13.5,
                                                FontWeight.w700,
                                                titleColor,
                                              ),
                                            ),
                                            const SizedBox(width: 20),
                                            Icon(
                                              Icons.schedule_rounded,
                                              size: 17,
                                              color: titleColor,
                                            ),
                                            const SizedBox(width: 8),
                                            Expanded(
                                              child: Text(
                                                timeWithWib,
                                                style: _pj(
                                                  13.5,
                                                  FontWeight.w700,
                                                  titleColor,
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                          ],
                                        ),
                                        if (activity.location
                                            .trim()
                                            .isNotEmpty) ...[
                                          const SizedBox(height: 10),
                                          Row(
                                            children: [
                                              Icon(
                                                Icons.location_on_outlined,
                                                size: 17,
                                                color: titleColor,
                                              ),
                                              const SizedBox(width: 8),
                                              Expanded(
                                                child: Text(
                                                  activity.location.trim(),
                                                  style: _pj(
                                                    13.5,
                                                    FontWeight.w700,
                                                    titleColor,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                        if (activity.jobDesk
                                            .trim()
                                            .isNotEmpty) ...[
                                          const SizedBox(height: 10),
                                          Row(
                                            children: [
                                              Icon(
                                                Icons.work_outline_rounded,
                                                size: 17,
                                                color: titleColor,
                                              ),
                                              const SizedBox(width: 8),
                                              Expanded(
                                                child: Text(
                                                  'Job Desk: ${activity.jobDesk.trim()}',
                                                  style: _pj(
                                                    13.5,
                                                    FontWeight.w700,
                                                    titleColor,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),

                                  const SizedBox(height: 14),

                                  // Dashed Horizontal Divider (Figma 5318:9850)
                                  SizedBox(
                                    width: double.infinity,
                                    height: 1,
                                    child: CustomPaint(
                                      painter: _DashedLinePainter(
                                        color: isDark
                                            ? Colors.white12
                                            : const Color(0xFFB9D8DC),
                                      ),
                                    ),
                                  ),

                                  const SizedBox(height: 13),

                                  // PIC Row (Figma 5318:9851)
                                  Row(
                                    children: [
                                      Container(
                                        width: 36,
                                        height: 36,
                                        decoration: const BoxDecoration(
                                          shape: BoxShape.circle,
                                          gradient: LinearGradient(
                                            begin: Alignment.topLeft,
                                            end: Alignment.bottomRight,
                                            colors: [
                                              Color(0xFF2DE0C5),
                                              Color(0xFF3BB8F0),
                                            ],
                                          ),
                                        ),
                                        alignment: Alignment.center,
                                        child: Text(
                                          initials,
                                          style: _pj(
                                            12,
                                            FontWeight.w800,
                                            const Color(0xFF06303F),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: RichText(
                                          text: TextSpan(
                                            style: _pj(
                                              14,
                                              FontWeight.w400,
                                              bodyColor,
                                            ),
                                            children: [
                                              const TextSpan(text: 'PIC: '),
                                              TextSpan(
                                                text: activity.picName
                                                        .trim()
                                                        .isNotEmpty
                                                    ? activity.picName.trim()
                                                    : '-',
                                                style: _pj(
                                                  14,
                                                  FontWeight.w700,
                                                  titleColor,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),

                            // Left Vertical Gradient Accent Bar (Figma 5318:9856)
                            const Positioned(
                              left: 0,
                              top: 22,
                              bottom: 22,
                              width: 4,
                              child: DecoratedBox(
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.horizontal(
                                    right: Radius.circular(4),
                                  ),
                                  gradient: LinearGradient(
                                    begin: Alignment.topCenter,
                                    end: Alignment.bottomCenter,
                                    colors: [
                                      Color(0xFF2DE0C5),
                                      Color(0xFF1E8FD6),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // ── SECTION 2: ABSENSI KEHADIRAN CARD (Figma 5318:9857) ──
                    Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(24),
                        gradient: const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [Color(0xFF0A3347), Color(0xFF0F5870)],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF0A3347)
                                .withValues(alpha: 0.28),
                            blurRadius: 24,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(24),
                        child: Stack(
                          children: [
                            // Decorative concentric circles top-right
                            Positioned(
                              right: -60,
                              top: -70,
                              child: Container(
                                width: 192,
                                height: 192,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: Colors.white.withValues(alpha: 0.14),
                                    width: 1,
                                  ),
                                ),
                              ),
                            ),
                            Positioned(
                              right: -20,
                              top: -30,
                              child: Container(
                                width: 112,
                                height: 112,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: Colors.white.withValues(alpha: 0.10),
                                    width: 1,
                                  ),
                                ),
                              ),
                            ),

                            Padding(
                              padding: const EdgeInsets.all(20),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        width: 50,
                                        height: 50,
                                        decoration: BoxDecoration(
                                          color: Colors.white
                                              .withValues(alpha: 0.12),
                                          borderRadius:
                                              BorderRadius.circular(14),
                                          border: Border.all(
                                            color: Colors.white
                                                .withValues(alpha: 0.22),
                                            width: 1,
                                          ),
                                        ),
                                        alignment: Alignment.center,
                                        child: Icon(
                                          !isCheckInOpen &&
                                                  !activity.hasCheckedIn
                                              ? Icons.lock_clock_rounded
                                              : Icons.camera_alt_outlined,
                                          color: Colors.white,
                                          size: 24,
                                        ),
                                      ),
                                      const SizedBox(width: 14),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'Absensi Kehadiran',
                                              style: _pj(
                                                17,
                                                FontWeight.w700,
                                                Colors.white,
                                              ),
                                            ),
                                            const SizedBox(height: 3),
                                            Text(
                                              'Absensi menggunakan selfie dengan validasi lokasi GPS.',
                                              style: _pj(
                                                13,
                                                FontWeight.w400,
                                                const Color(0xFFCDE6EC),
                                                height: 1.45,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),

                                  const SizedBox(height: 16),

                                  // CTA Button
                                  Container(
                                    width: double.infinity,
                                    height: 52,
                                    decoration: BoxDecoration(
                                      color: activity.hasCheckedIn ||
                                              !isCheckInOpen
                                          ? Colors.white.withValues(alpha: 0.18)
                                          : const Color(0xFF2EE6C8),
                                      borderRadius: BorderRadius.circular(16),
                                      boxShadow: activity.hasCheckedIn ||
                                              !isCheckInOpen
                                          ? null
                                          : [
                                              BoxShadow(
                                                color: Colors.black
                                                    .withValues(alpha: 0.18),
                                                blurRadius: 7,
                                                offset: const Offset(0, 6),
                                              ),
                                            ],
                                    ),
                                    child: Material(
                                      color: Colors.transparent,
                                      borderRadius: BorderRadius.circular(16),
                                      child: InkWell(
                                        borderRadius: BorderRadius.circular(16),
                                        onTap: () {
                                          if (activity.hasCheckedIn) return;
                                          if (!isCheckInOpen) {
                                            ScaffoldMessenger.of(context)
                                                .showSnackBar(
                                              SnackBar(
                                                content: Text(
                                                  'Absensi belum dibuka. Presensi dibuka 15 menit sebelum kegiatan dimulai (${activity.time.split(' - ').first} WIB).',
                                                ),
                                                backgroundColor:
                                                    AppColors.danger,
                                              ),
                                            );
                                            return;
                                          }
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (_) => CheckinScreen(
                                                activity: activity,
                                              ),
                                            ),
                                          );
                                        },
                                        child: Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            Icon(
                                              activity.hasCheckedIn
                                                  ? Icons.check_circle_rounded
                                                  : (!isCheckInOpen
                                                      ? Icons
                                                          .lock_clock_rounded
                                                      : Icons
                                                          .check_circle_outline_rounded),
                                              size: 20,
                                              color: activity.hasCheckedIn
                                                  ? const Color(0xFF2EE6C8)
                                                  : (!isCheckInOpen
                                                      ? Colors.white70
                                                      : const Color(
                                                          0xFF06303F)),
                                            ),
                                            const SizedBox(width: 10),
                                            Flexible(
                                              child: Text(
                                                activity.hasCheckedIn
                                                    ? 'Sudah Check-in (${activity.checkInStatus.isNotEmpty ? activity.checkInStatus : "Hadir"})'
                                                    : (!isCheckInOpen
                                                        ? 'Presensi Belum Dibuka'
                                                        : 'Absensi Sekarang'),
                                                style: _pj(
                                                  15,
                                                  FontWeight.w800,
                                                  activity.hasCheckedIn ||
                                                          !isCheckInOpen
                                                      ? Colors.white
                                                      : const Color(0xFF06303F),
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),

                                  const SizedBox(height: 14),

                                  Center(
                                    child: Text(
                                      'Radius GPS aktif • Presensi dibuka 15 menit sebelum acara',
                                      textAlign: TextAlign.center,
                                      style: _pj(
                                        12,
                                        FontWeight.w400,
                                        const Color(0xFFB5D5DE),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // ── SECTION 3 (CONDITIONAL): PERALATAN YANG DITUGASKAN ──
                    if (activity.assignedEquipments.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: cardColor,
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF103050).withValues(
                                alpha: isDark ? 0.28 : 0.08,
                              ),
                              blurRadius: 16,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(
                                  Icons.inventory_2_outlined,
                                  color: AppColors.primary,
                                ),
                                const SizedBox(width: 10),
                                Text(
                                  'Peralatan yang Ditugaskan',
                                  style: _pj(16, FontWeight.w800, titleColor),
                                ),
                                const Spacer(),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 3,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary
                                        .withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    '${activity.assignedEquipments.length} Alat',
                                    style: _pj(
                                      11,
                                      FontWeight.w700,
                                      AppColors.primary,
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
                                  color: isDark
                                      ? const Color(0xFF0F172A)
                                      : const Color(0xFFF4F8FB),
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: isReturned
                                        ? AppColors.success
                                            .withValues(alpha: 0.3)
                                        : (isDark
                                            ? Colors.white10
                                            : const Color(0xFFD5E0EA)),
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 36,
                                      height: 36,
                                      decoration: BoxDecoration(
                                        color: isReturned
                                            ? AppColors.success
                                                .withValues(alpha: 0.1)
                                            : AppColors.primary
                                                .withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Icon(
                                        isReturned
                                            ? Icons.check_circle_outline
                                            : Icons.camera_alt_outlined,
                                        color: isReturned
                                            ? AppColors.success
                                            : AppColors.primary,
                                        size: 20,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            eq.name,
                                            style: _pj(
                                              13,
                                              FontWeight.w700,
                                              titleColor,
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            '${eq.category}${eq.brand != null && eq.brand!.isNotEmpty ? ' • ${eq.brand}' : ''} (${eq.code})',
                                            style: _pj(
                                              11,
                                              FontWeight.w500,
                                              bodyColor,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.end,
                                      children: [
                                        Text(
                                          '${eq.quantity} Unit',
                                          style: _pj(
                                            12,
                                            FontWeight.w800,
                                            titleColor,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          isReturned
                                              ? 'Dikembalikan'
                                              : 'Digunakan',
                                          style: _pj(
                                            10,
                                            FontWeight.w600,
                                            isReturned
                                                ? AppColors.success
                                                : const Color(0xFFD97706),
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

                    // ── SECTION 4: UNGGAH DOKUMENTASI CARD (Figma 5318:9877) ──
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: cardColor,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF103050).withValues(
                              alpha: isDark ? 0.28 : 0.08,
                            ),
                            blurRadius: 16,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 50,
                                height: 50,
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? const Color(0xFF133835)
                                      : const Color(0xFFE3F7F4),
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: isDark
                                        ? const Color(0xFF1F544E)
                                        : const Color(0xFFBFEAE3),
                                    width: 1,
                                  ),
                                ),
                                alignment: Alignment.center,
                                child: Icon(
                                  Icons.cloud_upload_outlined,
                                  color: isDark
                                      ? const Color(0xFF2EE6C8)
                                      : const Color(0xFF0A6B5B),
                                  size: 24,
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Unggah Dokumentasi',
                                      style: _pj(
                                        16,
                                        FontWeight.w700,
                                        titleColor,
                                      ),
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      !isStarted
                                          ? 'Dokumentasi dapat diunggah setelah kegiatan dimulai.'
                                          : 'Unggah link Google Drive dokumentasi kegiatan.',
                                      style: _pj(
                                        13,
                                        FontWeight.w400,
                                        bodyColor,
                                        height: 1.45,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),

                          if (activity.docStatus.isNotEmpty) ...[
                            const SizedBox(height: 10),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 5,
                              ),
                              decoration: BoxDecoration(
                                color: activity.docStatus.contains('Sudah')
                                    ? AppColors.success.withValues(alpha: 0.12)
                                    : (isDark
                                        ? Colors.white10
                                        : const Color(0xFFF4F8FB)),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                activity.docStatus,
                                style: _pj(
                                  12,
                                  FontWeight.w600,
                                  activity.docStatus.contains('Sudah')
                                      ? AppColors.success
                                      : bodyColor,
                                ),
                              ),
                            ),
                          ],

                          const SizedBox(height: 14),

                          SizedBox(
                            width: double.infinity,
                            height: 1,
                            child: CustomPaint(
                              painter: _DashedLinePainter(
                                color: isDark
                                    ? Colors.white12
                                    : const Color(0xFFB9D8DC),
                              ),
                            ),
                          ),

                          const SizedBox(height: 14),

                          Text(
                            'Link Google Drive',
                            style: _pj(13, FontWeight.w700, titleColor),
                          ),

                          const SizedBox(height: 8),

                          TextField(
                            controller: _driveLinkController,
                            enabled: !_isSubmittingDoc && isStarted,
                            style: _pj(14, FontWeight.w500, titleColor),
                            decoration: InputDecoration(
                              hintText: 'https://drive.google.com/...',
                              hintStyle: _pj(
                                14,
                                FontWeight.w400,
                                const Color(0xFF5F7080),
                              ),
                              prefixIcon: const Icon(
                                Icons.link_rounded,
                                size: 18,
                                color: Color(0xFF5F7080),
                              ),
                              filled: true,
                              fillColor: isDark
                                  ? const Color(0xFF0F172A)
                                  : const Color(0xFFF4F8FB),
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 14,
                              ),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(14),
                                borderSide: BorderSide(
                                  color: isDark
                                      ? Colors.white12
                                      : const Color(0xFFD5E0EA),
                                  width: 1,
                                ),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(14),
                                borderSide: BorderSide(
                                  color: isDark
                                      ? Colors.white12
                                      : const Color(0xFFD5E0EA),
                                  width: 1,
                                ),
                              ),
                              disabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(14),
                                borderSide: BorderSide(
                                  color: isDark
                                      ? Colors.white10
                                      : const Color(0xFFE2E8F0),
                                  width: 1,
                                ),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(14),
                                borderSide: const BorderSide(
                                  color: Color(0xFF0B3C54),
                                  width: 1.5,
                                ),
                              ),
                              errorText: _docError,
                            ),
                            onChanged: (_) {
                              if (_docError != null) {
                                setState(() => _docError = null);
                              }
                            },
                          ),

                          const SizedBox(height: 14),

                          SizedBox(
                            width: double.infinity,
                            height: 48,
                            child: OutlinedButton(
                              onPressed: (_isSubmittingDoc || !isStarted)
                                  ? null
                                  : () => _submitDocumentation(activity),
                              style: OutlinedButton.styleFrom(
                                backgroundColor:
                                    isDark ? Colors.transparent : Colors.white,
                                foregroundColor: isDark
                                    ? const Color(0xFF5EEAD4)
                                    : const Color(0xFF0B3C54),
                                side: BorderSide(
                                  color: (_isSubmittingDoc || !isStarted)
                                      ? const Color(0xFFCBD5E1)
                                      : (isDark
                                          ? const Color(0xFF5EEAD4)
                                          : const Color(0xFF0B3C54)),
                                  width: 1,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
                              ),
                              child: _isSubmittingDoc
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : Text(
                                      'Kirim Link Dokumentasi',
                                      style: _pj(
                                        14,
                                        FontWeight.w700,
                                        (_isSubmittingDoc || !isStarted)
                                            ? const Color(0xFF94A3B8)
                                            : (isDark
                                                ? const Color(0xFF5EEAD4)
                                                : const Color(0xFF0B3C54)),
                                      ),
                                    ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DashedLinePainter extends CustomPainter {
  const _DashedLinePainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1;
    const dashWidth = 4.0;
    const dashSpace = 3.0;
    double startX = 0;
    while (startX < size.width) {
      canvas.drawLine(
        Offset(startX, 0),
        Offset((startX + dashWidth).clamp(0.0, size.width), 0),
        paint,
      );
      startX += dashWidth + dashSpace;
    }
  }

  @override
  bool shouldRepaint(covariant _DashedLinePainter oldDelegate) =>
      oldDelegate.color != color;
}
