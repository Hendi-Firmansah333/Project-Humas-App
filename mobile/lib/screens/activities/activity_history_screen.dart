import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:poli_humas/animations/app_animations.dart';
import 'package:poli_humas/models/activity.dart';
import 'package:poli_humas/models/content_plan.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/activities/activity_detail_screen.dart';
import 'package:poli_humas/screens/activities/activity_history_detail_screen.dart';
import 'package:poli_humas/screens/content/content_plan_detail_screen.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/utils/app_navigator.dart';

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

class ActivityHistoryScreen extends StatefulWidget {
  const ActivityHistoryScreen({super.key, this.isEmbeddedTab = false});

  final bool isEmbeddedTab;

  @override
  State<ActivityHistoryScreen> createState() => _ActivityHistoryScreenState();
}

class _ActivityHistoryScreenState extends State<ActivityHistoryScreen> {
  int _selectedTab = 0; // 0 = Log Kehadiran, 1 = Bukti Upload
  bool _sortNewestFirst = true;

  static const _monthsId = [
    '',
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  String get _currentMonthYear {
    final now = DateTime.now();
    return '${_monthsId[now.month]} ${now.year}';
  }

  String get _currentMonthOnly {
    final now = DateTime.now();
    return 'Bulan ${_monthsId[now.month]}';
  }

  Future<void> _onRefresh() async {
    await context.read<AppDataProvider>().refreshAll(simulateNetwork: false);
  }

  Future<void> _openUrl(String rawUrl) async {
    final trimmed = rawUrl.trim();
    if (trimmed.isEmpty) return;
    final normalized =
        trimmed.startsWith('http://') || trimmed.startsWith('https://')
            ? trimmed
            : 'https://$trimmed';
    final uri = Uri.tryParse(normalized);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tautan berkas tidak dapat dibuka.')),
      );
    }
  }

  String _formatShortDateTime(ActivityItem item) {
    final dt = item.scheduledAt;
    final timePart = item.time.isNotEmpty
        ? item.time.split('-').first.trim()
        : (dt != null
            ? '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')} WIB'
            : '');
    if (dt != null) {
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      final target = DateTime(dt.year, dt.month, dt.day);
      final diff = today.difference(target).inDays;
      final suffix = timePart.isNotEmpty
          ? (timePart.toUpperCase().contains('WIB') ? timePart : '$timePart WIB')
          : '';
      if (diff == 0) return suffix.isNotEmpty ? 'Hari ini, $suffix' : 'Hari ini';
      if (diff == 1) return suffix.isNotEmpty ? 'Kemarin, $suffix' : 'Kemarin';
      final monthShort = _monthsId[dt.month].substring(0, 3);
      return '${dt.day} $monthShort ${dt.year}${suffix.isNotEmpty ? ', $suffix' : ''}';
    }
    return item.date.isNotEmpty ? item.date : 'Terjadwal';
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppDataProvider>();
    final canPop = !widget.isEmbeddedTab && Navigator.canPop(context);

    // Combine history + active checked-in activities without duplicates
    final seenIds = <String>{};
    final allAttendanceLogs = <ActivityItem>[];
    for (final item in [
      ...provider.historyState.items,
      ...provider.activitiesState.items.where((a) => a.hasCheckedIn),
    ]) {
      if (seenIds.add(item.id)) {
        allAttendanceLogs.add(item);
      }
    }

    allAttendanceLogs.sort((a, b) {
      final da = a.scheduledAt ?? DateTime(2000);
      final db = b.scheduledAt ?? DateTime(2000);
      return _sortNewestFirst ? db.compareTo(da) : da.compareTo(db);
    });

    final checkedInCount = allAttendanceLogs
        .where((a) => a.hasCheckedIn || a.checkInStatus == 'Berhasil')
        .length;
    final attendanceRate = provider.profileStats.attendanceRate;

    // Build upload proofs from activities with documentation & content plans with proof
    final uploadProofs = <_UploadProofItem>[];
    for (final act in allAttendanceLogs) {
      final url = act.documentationUrl?.trim() ?? '';
      if (url.isNotEmpty || act.docStatus == 'Sudah Unggah') {
        uploadProofs.add(
          _UploadProofItem(
            id: 'act_${act.id}',
            title: act.title,
            categoryLabel: 'Foto Liputan',
            isVideo: false,
            fileMeta: 'Tautan Drive',
            timestamp: _formatShortDateTime(act),
            statusLabel: act.status == 'Selesai' ? 'Terverifikasi' : 'Terkirim',
            thumbnailUrl: act.selfiePath,
            fileUrl: url,
            sortDate: act.scheduledAt ?? DateTime(2000),
            activity: act,
          ),
        );
      }
    }
    for (final plan in provider.contentPlansState.items) {
      final link = plan.videoLink?.trim() ?? '';
      final poster = plan.posterPath?.trim() ?? '';
      if (link.isNotEmpty || poster.isNotEmpty) {
        final isVideo = plan.tags.any(
          (t) =>
              t.toLowerCase().contains('video') ||
              t.toLowerCase().contains('reels') ||
              t.toLowerCase().contains('tiktok'),
        );
        uploadProofs.add(
          _UploadProofItem(
            id: 'cp_${plan.id}',
            title: plan.title,
            categoryLabel: isVideo ? 'Video Reels' : 'Konten Publikasi',
            isVideo: isVideo,
            fileMeta: link.isNotEmpty ? 'Tautan Konten' : 'Poster / Media',
            timestamp: plan.deadlineLabel.isNotEmpty
                ? plan.deadlineLabel
                : plan.deadline,
            statusLabel: plan.status == ContentPlanStatus.selesai
                ? 'Selesai'
                : plan.statusLabel,
            thumbnailUrl: poster.isNotEmpty ? poster : null,
            fileUrl: link.isNotEmpty ? link : poster,
            sortDate: DateTime.tryParse(plan.deadline) ?? DateTime(2000),
            contentPlan: plan,
          ),
        );
      }
    }

    uploadProofs.sort(
      (a, b) => _sortNewestFirst
          ? b.sortDate.compareTo(a.sortDate)
          : a.sortDate.compareTo(b.sortDate),
    );

    final bottomPadding = widget.isEmbeddedTab ? 112.0 : 28.0;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FF),
      body: Column(
        children: [
          // ── TOP APP BAR (Figma 5441:4134 / 5441:4385) ──
          SafeArea(
            bottom: false,
            child: Container(
              height: 56,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: const Color(0xFFF8F9FF).withValues(alpha: 0.94),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 2,
                    offset: const Offset(0, 1),
                  ),
                ],
              ),
              child: Row(
                children: [
                  if (canPop) ...[
                    InkWell(
                      onTap: () => Navigator.pop(context),
                      borderRadius: BorderRadius.circular(999),
                      child: const SizedBox(
                        width: 36,
                        height: 36,
                        child: Icon(
                          Icons.arrow_back_rounded,
                          color: Color(0xFF002636),
                          size: 20,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                  ],
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Riwayat & Arsip Dokumen',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: _pj(
                            18,
                            FontWeight.w700,
                            const Color(0xFF002636),
                            ls: -0.4,
                          ),
                        ),
                        if (_selectedTab == 1 || !canPop)
                          Text(
                            'Humas Polinela',
                            style: _pj(
                              10,
                              FontWeight.w700,
                              const Color(0xFF71787D),
                              ls: 0.4,
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── MAIN SCROLLABLE CONTENT ──
          Expanded(
            child: RefreshIndicator(
              onRefresh: _onRefresh,
              color: Colors.white,
              backgroundColor: AppColors.primary,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(
                  parent: BouncingScrollPhysics(),
                ),
                padding: EdgeInsets.fromLTRB(16, 14, 16, bottomPadding),
                children: [
                  // ── SEGMENTED PILL TABS ──
                  Container(
                    padding: const EdgeInsets.all(5),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDCE9FF),
                      borderRadius: BorderRadius.circular(9999),
                      border: Border.all(
                        color: const Color(0xFFD3E4FE).withValues(alpha: 0.6),
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: _SegmentPillButton(
                            label: 'Log Kehadiran',
                            icon: Icons.assignment_turned_in_outlined,
                            selected: _selectedTab == 0,
                            onTap: () {
                              HapticFeedback.selectionClick();
                              setState(() => _selectedTab = 0);
                            },
                          ),
                        ),
                        Expanded(
                          child: _SegmentPillButton(
                            label: 'Bukti Upload',
                            icon: Icons.cloud_upload_outlined,
                            selected: _selectedTab == 1,
                            onTap: () {
                              HapticFeedback.selectionClick();
                              setState(() => _selectedTab = 1);
                            },
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  if (_selectedTab == 0) ...[
                    // ── RINGKASAN BULAN INI (Figma 5441:4029) ──
                    Container(
                      padding: const EdgeInsets.all(13),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: const Color(0xFFC1C7CD).withValues(alpha: 0.35),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF0A3D52).withValues(alpha: 0.05),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 28,
                                height: 28,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFDCE9FF),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(
                                  Icons.bar_chart_rounded,
                                  size: 16,
                                  color: Color(0xFF002636),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Ringkasan Bulan Ini',
                                style: _pj(
                                  14,
                                  FontWeight.w700,
                                  const Color(0xFF002636),
                                ),
                              ),
                              const Spacer(),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 3,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFE5EEFF),
                                  borderRadius: BorderRadius.circular(9999),
                                ),
                                child: Text(
                                  _currentMonthYear,
                                  style: _pj(
                                    10,
                                    FontWeight.w600,
                                    const Color(0xFF41484C),
                                    ls: 0.3,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          const Divider(height: 1, color: Color(0xFFE5EEFF)),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: _BentoStatTile(
                                  topLabel: 'Presensi',
                                  value: '$checkedInCount',
                                  bottomLabel: 'Kegiatan',
                                  bottomColor: const Color(0xFF41484C),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: _BentoStatTile(
                                  topLabel: 'Tepat Waktu',
                                  value: '$attendanceRate%',
                                  bottomLabel: attendanceRate >= 80
                                      ? 'Baik'
                                      : 'Perlu Ditingkatkan',
                                  bottomColor: const Color(0xFF006B5F),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: _BentoStatTile(
                                  topLabel: 'Dokumentasi',
                                  value: '${uploadProofs.length}',
                                  bottomLabel: 'Arsip',
                                  bottomColor: const Color(0xFF41484C),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 18),

                    // ── SECTION HEADER: RIWAYAT AKTIVITAS LIPUTAN ──
                    Row(
                      children: [
                        Text(
                          'Riwayat Aktivitas Liputan',
                          style: _pj(
                            16,
                            FontWeight.w700,
                            const Color(0xFF002636),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          constraints: const BoxConstraints(minWidth: 22),
                          height: 20,
                          padding: const EdgeInsets.symmetric(horizontal: 6),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(9999),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            '${allAttendanceLogs.length}',
                            style: _pj(10, FontWeight.w700, Colors.white),
                          ),
                        ),
                        const Spacer(),
                        GestureDetector(
                          onTap: () {
                            HapticFeedback.selectionClick();
                            setState(
                              () => _sortNewestFirst = !_sortNewestFirst,
                            );
                          },
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                _sortNewestFirst ? 'Urutkan' : 'Terlama',
                                style: _pj(
                                  11,
                                  FontWeight.w700,
                                  const Color(0xFF002636),
                                  ls: 0.2,
                                ),
                              ),
                              const SizedBox(width: 2),
                              Icon(
                                _sortNewestFirst
                                    ? Icons.keyboard_arrow_down_rounded
                                    : Icons.keyboard_arrow_up_rounded,
                                size: 16,
                                color: const Color(0xFF002636),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    if (allAttendanceLogs.isEmpty)
                      _EmptyArchiveBox(
                        icon: Icons.history_rounded,
                        title: 'Belum Ada Riwayat Liputan',
                        subtitle:
                            'Aktivitas yang sudah diikuti atau selesai akan muncul otomatis di sini.',
                      )
                    else
                      ...allAttendanceLogs.asMap().entries.map((entry) {
                        final item = entry.value;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _AttendanceLogCard(
                            item: item,
                            formattedTime: _formatShortDateTime(item),
                            onTap: () {
                              HapticFeedback.lightImpact();
                              if (item.status == 'Selesai' ||
                                  item.status == 'Dibatalkan') {
                                pushSmooth(
                                  context,
                                  ActivityHistoryDetailScreen(activity: item),
                                );
                              } else {
                                pushSmooth(
                                  context,
                                  ActivityDetailScreen(activity: item),
                                );
                              }
                            },
                          ).staggeredEntrance(entry.key),
                        );
                      }),
                  ] else ...[
                    // ── TAB 1: BUKTI UPLOAD (Figma 5441:4270) ──
                    Row(
                      children: [
                        const Icon(
                          Icons.cloud_done_outlined,
                          size: 18,
                          color: Color(0xFF006B5F),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Ringkasan Penyimpanan',
                          style: _pj(
                            14,
                            FontWeight.w600,
                            const Color(0xFF002636),
                          ),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE5EEFF),
                            borderRadius: BorderRadius.circular(9999),
                          ),
                          child: Text(
                            _currentMonthOnly,
                            style: _pj(
                              10,
                              FontWeight.w700,
                              const Color(0xFF41484C),
                              ls: 0.3,
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    Row(
                      children: [
                        Expanded(
                          child: _StorageSummaryCard(
                            label: 'Total Berkas',
                            icon: Icons.folder_outlined,
                            iconColor: const Color(0xFF002636),
                            value: '${uploadProofs.length}',
                            unit: 'Dokumen',
                            footerDotColor: const Color(0xFF006B5F),
                            footerText: 'Tersinkron',
                            footerTextColor: const Color(0xFF006B5F),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _StorageSummaryCard(
                            label: 'Cloud Storage',
                            icon: Icons.cloud_outlined,
                            iconColor: const Color(0xFF006B5F),
                            value: '${uploadProofs.where((p) => p.statusLabel == 'Terverifikasi' || p.statusLabel == 'Selesai').length}',
                            unit: '/ ${uploadProofs.length} Arsip',
                            footerText: 'Tersimpan di Cloud',
                            footerTextColor: const Color(0xFF71787D),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 20),

                    Row(
                      children: [
                        Text(
                          'Daftar Bukti Unggahan',
                          style: _pj(
                            14,
                            FontWeight.w600,
                            const Color(0xFF002636),
                          ),
                        ),
                        const Spacer(),
                        GestureDetector(
                          onTap: () {
                            HapticFeedback.selectionClick();
                            setState(
                              () => _sortNewestFirst = !_sortNewestFirst,
                            );
                          },
                          child: Text(
                            _sortNewestFirst ? 'Terbaru' : 'Terlama',
                            style: _pj(
                              11,
                              FontWeight.w700,
                              const Color(0xFF71787D),
                              ls: 0.3,
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    if (uploadProofs.isEmpty)
                      _EmptyArchiveBox(
                        icon: Icons.cloud_upload_outlined,
                        title: 'Belum Ada Bukti Unggahan',
                        subtitle:
                            'Dokumentasi kegiatan dan bukti konten yang telah diunggah akan tampil di sini.',
                      )
                    else
                      ...uploadProofs.asMap().entries.map((entry) {
                        final proof = entry.value;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _UploadProofCard(
                            item: proof,
                            onPrimaryTap: () {
                              HapticFeedback.lightImpact();
                              if (proof.fileUrl.isNotEmpty) {
                                _openUrl(proof.fileUrl);
                              } else {
                                _openProofDetail(proof);
                              }
                            },
                            onDetailTap: () {
                              HapticFeedback.lightImpact();
                              _openProofDetail(proof);
                            },
                          ).staggeredEntrance(entry.key),
                        );
                      }),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _openProofDetail(_UploadProofItem proof) {
    if (proof.activity != null) {
      pushSmooth(
        context,
        ActivityHistoryDetailScreen(activity: proof.activity!),
      );
    } else if (proof.contentPlan != null) {
      pushSmooth(
        context,
        ContentPlanDetailScreen(item: proof.contentPlan!),
      );
    }
  }
}

class _SegmentPillButton extends StatelessWidget {
  const _SegmentPillButton({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(9999),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.08),
                    blurRadius: 3,
                    offset: const Offset(0, 1),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 15,
              color: selected
                  ? const Color(0xFF5EEAD4)
                  : const Color(0xFF41484C),
            ),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: _pj(
                  12,
                  selected ? FontWeight.w700 : FontWeight.w600,
                  selected ? Colors.white : const Color(0xFF41484C),
                  ls: 0.15,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BentoStatTile extends StatelessWidget {
  const _BentoStatTile({
    required this.topLabel,
    required this.value,
    required this.bottomLabel,
    required this.bottomColor,
  });

  final String topLabel;
  final String value;
  final String bottomLabel;
  final Color bottomColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 11),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF4FF),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFE5EEFF)),
      ),
      child: Column(
        children: [
          Text(
            topLabel,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: _pj(10, FontWeight.w700, const Color(0xFF41484C), ls: 0.3),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: _pj(22, FontWeight.w700, const Color(0xFF002636), ls: -0.5),
          ),
          const SizedBox(height: 2),
          Text(
            bottomLabel,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: _pj(10, FontWeight.w600, bottomColor, ls: 0.3),
          ),
        ],
      ),
    );
  }
}

class _AttendanceLogCard extends StatelessWidget {
  const _AttendanceLogCard({
    required this.item,
    required this.formattedTime,
    required this.onTap,
  });

  final ActivityItem item;
  final String formattedTime;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isCancelled =
        item.status == 'Dibatalkan' || item.status == 'Ditolak';
    final hasCheckedIn = item.hasCheckedIn || item.checkInStatus == 'Berhasil';
    final isLate = item.checkInState == CheckInState.late;

    final badgeBg = isCancelled
        ? const Color(0xFFF1F5F9)
        : (isLate ? const Color(0xFFFEF3C7) : const Color(0xFFE5EEFF));
    final badgeDot = isCancelled
        ? const Color(0xFF64748B)
        : (isLate ? const Color(0xFFD97706) : const Color(0xFF006B5F));
    final badgeText = isCancelled
        ? item.status
        : (hasCheckedIn ? (isLate ? 'Terlambat' : 'Hadir') : item.status);

    final verifyLabel = isCancelled
        ? 'Kegiatan Dibatalkan'
        : (hasCheckedIn ? 'Presensi Terverifikasi' : 'Belum Presensi');

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(13),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: const Color(0xFFC1C7CD).withValues(alpha: 0.35),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 4,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: badgeBg,
                      borderRadius: BorderRadius.circular(9999),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: badgeDot,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          badgeText,
                          style: _pj(10, FontWeight.w600, badgeDot, ls: 0.3),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  const Icon(
                    Icons.access_time_rounded,
                    size: 13,
                    color: Color(0xFF41484C),
                  ),
                  const SizedBox(width: 4),
                  Flexible(
                    child: Text(
                      formattedTime,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: _pj(
                        10,
                        FontWeight.w700,
                        const Color(0xFF41484C),
                        ls: 0.3,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                item.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: _pj(
                  14,
                  FontWeight.w700,
                  const Color(0xFF0B1C30),
                  height: 1.35,
                ),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(
                    Icons.location_on_outlined,
                    size: 14,
                    color: Color(0xFF41484C),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      item.location.isNotEmpty
                          ? item.location
                          : 'Politeknik Negeri Lampung',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: _pj(12, FontWeight.w400, const Color(0xFF41484C)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              const Divider(height: 1, color: Color(0xFFE5EEFF)),
              const SizedBox(height: 9),
              Row(
                children: [
                  Icon(
                    hasCheckedIn
                        ? Icons.check_circle_outline_rounded
                        : Icons.info_outline_rounded,
                    size: 14,
                    color: hasCheckedIn
                        ? const Color(0xFF006B5F)
                        : const Color(0xFF71787D),
                  ),
                  const SizedBox(width: 5),
                  Text(
                    verifyLabel,
                    style: _pj(
                      10,
                      FontWeight.w700,
                      const Color(0xFF41484C),
                      ls: 0.3,
                    ),
                  ),
                  const Spacer(),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Detail Arsip',
                        style: _pj(
                          11,
                          FontWeight.w700,
                          const Color(0xFF002636),
                          ls: 0.2,
                        ),
                      ),
                      const SizedBox(width: 2),
                      const Icon(
                        Icons.chevron_right_rounded,
                        size: 15,
                        color: Color(0xFF002636),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StorageSummaryCard extends StatelessWidget {
  const _StorageSummaryCard({
    required this.label,
    required this.icon,
    required this.iconColor,
    required this.value,
    required this.unit,
    required this.footerText,
    required this.footerTextColor,
    this.footerDotColor,
  });

  final String label;
  final IconData icon;
  final Color iconColor;
  final String value;
  final String unit;
  final String footerText;
  final Color footerTextColor;
  final Color? footerDotColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFDCE9FF)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: _pj(
                    11,
                    FontWeight.w600,
                    const Color(0xFF71787D),
                    ls: 0.2,
                  ),
                ),
              ),
              Icon(icon, size: 16, color: iconColor),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                value,
                style: _pj(18, FontWeight.w700, const Color(0xFF0B1C30)),
              ),
              const SizedBox(width: 4),
              Flexible(
                child: Text(
                  unit,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: _pj(12, FontWeight.w400, const Color(0xFF71787D)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              if (footerDotColor != null) ...[
                Container(
                  width: 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: footerDotColor,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 5),
              ],
              Expanded(
                child: Text(
                  footerText,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: _pj(10, FontWeight.w700, footerTextColor, ls: 0.3),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _UploadProofItem {
  const _UploadProofItem({
    required this.id,
    required this.title,
    required this.categoryLabel,
    required this.isVideo,
    required this.fileMeta,
    required this.timestamp,
    required this.statusLabel,
    required this.fileUrl,
    required this.sortDate,
    this.thumbnailUrl,
    this.activity,
    this.contentPlan,
  });

  final String id;
  final String title;
  final String categoryLabel;
  final bool isVideo;
  final String fileMeta;
  final String timestamp;
  final String statusLabel;
  final String fileUrl;
  final DateTime sortDate;
  final String? thumbnailUrl;
  final ActivityItem? activity;
  final ContentPlanItem? contentPlan;
}

class _UploadProofCard extends StatelessWidget {
  const _UploadProofCard({
    required this.item,
    required this.onPrimaryTap,
    required this.onDetailTap,
  });

  final _UploadProofItem item;
  final VoidCallback onPrimaryTap;
  final VoidCallback onDetailTap;

  @override
  Widget build(BuildContext context) {
    final hasNetworkThumb = item.thumbnailUrl != null &&
        (item.thumbnailUrl!.startsWith('http://') ||
            item.thumbnailUrl!.startsWith('https://'));

    final chipBg = item.isVideo
        ? const Color(0xFFC4E7FF)
        : const Color(0xFF62FAE3).withValues(alpha: 0.3);
    final chipText =
        item.isVideo ? const Color(0xFF003D55) : const Color(0xFF006B5F);

    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFDCE9FF)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 80x80 Thumbnail
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  width: 80,
                  height: 80,
                  color: const Color(0xFFE5EEFF),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      if (hasNetworkThumb)
                        CachedNetworkImage(
                          imageUrl: item.thumbnailUrl!,
                          fit: BoxFit.cover,
                          errorWidget: (_, _, _) => Icon(
                            item.isVideo
                                ? Icons.videocam_rounded
                                : Icons.photo_library_rounded,
                            color: AppColors.primary,
                            size: 28,
                          ),
                        )
                      else
                        Icon(
                          item.isVideo
                              ? Icons.videocam_rounded
                              : Icons.photo_library_rounded,
                          color: AppColors.primary,
                          size: 28,
                        ),
                      if (item.isVideo)
                        Container(
                          color: const Color(0xFF002636).withValues(alpha: 0.2),
                          alignment: Alignment.center,
                          child: Container(
                            width: 28,
                            height: 28,
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8F9FF)
                                  .withValues(alpha: 0.92),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.play_arrow_rounded,
                              size: 18,
                              color: Color(0xFF002636),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: chipBg,
                            borderRadius: BorderRadius.circular(9999),
                          ),
                          child: Text(
                            item.categoryLabel,
                            style: _pj(10, FontWeight.w600, chipText, ls: 0.3),
                          ),
                        ),
                        const Spacer(),
                        Text(
                          item.fileMeta,
                          style: _pj(
                            10,
                            FontWeight.w700,
                            const Color(0xFF71787D),
                            ls: 0.3,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 5),
                    Text(
                      item.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: _pj(
                        14,
                        FontWeight.w600,
                        const Color(0xFF0B1C30),
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(
                          Icons.access_time_rounded,
                          size: 12,
                          color: Color(0xFF71787D),
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            item.timestamp,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: _pj(
                              10,
                              FontWeight.w700,
                              const Color(0xFF71787D),
                              ls: 0.3,
                            ),
                          ),
                        ),
                        Container(
                          width: 6,
                          height: 6,
                          decoration: const BoxDecoration(
                            color: Color(0xFF006B5F),
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          item.statusLabel,
                          style: _pj(
                            10,
                            FontWeight.w600,
                            const Color(0xFF006B5F),
                            ls: 0.3,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1, color: Color(0xFFE5EEFF)),
          const SizedBox(height: 11),
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 38,
                  child: ElevatedButton.icon(
                    onPressed: onPrimaryTap,
                    icon: Icon(
                      item.isVideo
                          ? Icons.play_circle_outline_rounded
                          : Icons.visibility_outlined,
                      size: 16,
                    ),
                    label: Text(
                      item.isVideo ? 'Putar Pratinjau' : 'Lihat Berkas',
                      style: _pj(13, FontWeight.w600, Colors.white),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                height: 38,
                child: OutlinedButton(
                  onPressed: onDetailTap,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF41484C),
                    side: const BorderSide(color: Color(0xFFDCE9FF)),
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: Text(
                    'Detail',
                    style: _pj(13, FontWeight.w600, const Color(0xFF41484C)),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _EmptyArchiveBox extends StatelessWidget {
  const _EmptyArchiveBox({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFDCE9FF)),
      ),
      child: Column(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: const Color(0xFFE5EEFF),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, size: 26, color: AppColors.primary),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: _pj(14, FontWeight.w700, const Color(0xFF002636)),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: _pj(12, FontWeight.w400, const Color(0xFF71787D), height: 1.5),
          ),
        ],
      ),
    );
  }
}
