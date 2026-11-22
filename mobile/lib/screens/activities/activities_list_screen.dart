import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:poli_humas/animations/app_animations.dart';
import 'package:poli_humas/models/activity.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/activities/activity_detail_screen.dart';
import 'package:poli_humas/screens/activities/activity_history_detail_screen.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/utils/app_navigator.dart';
import 'package:poli_humas/widgets/paginated_refresh_list.dart';

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

class ActivitiesListScreen extends StatefulWidget {
  const ActivitiesListScreen({super.key});

  @override
  State<ActivitiesListScreen> createState() => _ActivitiesListScreenState();
}

class _ActivitiesListScreenState extends State<ActivitiesListScreen> {
  final _searchController = TextEditingController();
  Timer? _searchDebounce;

  static const _defaultFilters = [
    'Semua',
    'Sedang Berlangsung',
    'Akan Datang',
    'Selesai',
    'Dibatalkan',
  ];

  String _selectedFilter = 'Semua';
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    final provider = context.read<AppDataProvider>();
    _searchController.text = provider.activitiesState.searchQuery;
    _searchQuery = _searchController.text;
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 300), () {
      if (mounted) {
        setState(() {
          _searchQuery = value.trim();
        });
      }
    });
  }

  void _onFilterSelected(String filter) {
    HapticFeedback.selectionClick();
    setState(() {
      _selectedFilter = filter;
    });
  }

  Future<void> _handleRefresh() async {
    final provider = context.read<AppDataProvider>();
    await Future.wait([
      provider.loadActivities(refresh: true),
      provider.loadActivityHistory(refresh: true),
    ]);
  }

  void _handleOpenDetail(BuildContext context, ActivityItem item) {
    HapticFeedback.lightImpact();
    final isDoneOrCancelled = item.isHistory ||
        item.status == 'Selesai' ||
        item.status == 'Dibatalkan';

    if (isDoneOrCancelled) {
      pushSmooth(context, ActivityHistoryDetailScreen(activity: item));
    } else {
      pushSmooth(context, ActivityDetailScreen(activity: item));
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;
    final provider = context.watch<AppDataProvider>();
    final actState = provider.activitiesState;
    final histState = provider.historyState;

    final isLoading = actState.isLoading && histState.isLoading;
    final isRefreshing = actState.isRefreshing || histState.isRefreshing;

    // Gabungkan list activities & history dengan deduplikasi id
    final seenIds = <String>{};
    final combinedList = <ActivityItem>[];

    for (final item in [...actState.items, ...histState.items]) {
      if (seenIds.add(item.id)) {
        combinedList.add(item);
      }
    }

    // Terapkan filter status
    var filteredList = combinedList.where((item) {
      if (_selectedFilter == 'Semua') return true;
      if (_selectedFilter == 'Selesai') return item.status == 'Selesai';
      if (_selectedFilter == 'Dibatalkan') {
        return item.status == 'Dibatalkan' || item.status == 'Ditolak';
      }
      if (_selectedFilter == 'Sedang Berlangsung') {
        return item.status == 'Sedang Berlangsung' ||
            item.status == 'Menunggu Verifikasi' ||
            item.status == 'Menunggu';
      }
      if (_selectedFilter == 'Akan Datang') {
        return item.status == 'Akan Datang' || item.status == 'Ditugaskan';
      }
      return item.status.toLowerCase() == _selectedFilter.toLowerCase();
    }).toList();

    // Terapkan filter pencarian
    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      filteredList = filteredList.where((item) {
        return item.title.toLowerCase().contains(q) ||
            item.location.toLowerCase().contains(q) ||
            item.description.toLowerCase().contains(q);
      }).toList();
    }

    final bgColor = isDark ? const Color(0xFF0F172A) : const Color(0xFFF8F9FF);

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── 1. HEADER SECTION (Figma 5302:9513) ──
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(25, 12, 25, 14),
              decoration: BoxDecoration(
                color: bgColor,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.05),
                    blurRadius: 1,
                    offset: const Offset(0, 1),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Kegiatan',
                    style: _pj(
                      28,
                      FontWeight.w800,
                      isDark ? Colors.white : Colors.black,
                      height: 1.2,
                      ls: -0.4,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Jadwal liputan, rapat, dan agenda Tim Humas',
                    style: _pj(
                      12.5,
                      FontWeight.w400,
                      isDark ? Colors.white70 : Colors.black,
                    ),
                  ),
                  const SizedBox(height: 20),

                  // ── SEARCH BAR KAPSUL (Figma 5302:9519) ──
                  Container(
                    height: 46,
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8F9FF),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isDark ? Colors.white12 : const Color(0xFFBBC9CB),
                        width: 1,
                      ),
                    ),
                    child: TextField(
                      controller: _searchController,
                      onChanged: _onSearchChanged,
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: isDark ? Colors.white : const Color(0xFF0B1B33),
                      ),
                      decoration: InputDecoration(
                        hintText: 'Cari kegiatan...',
                        hintStyle: GoogleFonts.poppins(
                          fontSize: 14,
                          fontWeight: FontWeight.w400,
                          color: const Color(0xFF6B7280),
                        ),
                        prefixIcon: const Icon(
                          Icons.search_rounded,
                          size: 20,
                          color: Color(0xFF6B7280),
                        ),
                        suffixIcon: _searchQuery.isNotEmpty
                            ? IconButton(
                                icon: const Icon(
                                  Icons.close_rounded,
                                  size: 18,
                                  color: Color(0xFF6B7280),
                                ),
                                onPressed: () {
                                  _searchController.clear();
                                  _onSearchChanged('');
                                },
                              )
                            : null,
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // ── FILTER CHIPS ROW (Figma 5302:9525) ──
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    physics: const BouncingScrollPhysics(),
                    child: Row(
                      children: [
                        for (int i = 0; i < _defaultFilters.length; i++) ...[
                          if (i > 0) const SizedBox(width: 14),
                          _FilterChipButton(
                            label: _defaultFilters[i],
                            isSelected: _defaultFilters[i] == _selectedFilter,
                            isDark: isDark,
                            onTap: () => _onFilterSelected(_defaultFilters[i]),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // ── 2. DAFTAR KARTU KEGIATAN (Figma 5302:9386) ──
            Expanded(
              child: PaginatedRefreshList(
                itemCount: filteredList.length,
                isLoading: isLoading && combinedList.isEmpty,
                isLoadingMore: actState.isLoadingMore || histState.isLoadingMore,
                isRefreshing: isRefreshing,
                error: actState.error ?? histState.error,
                emptyMessage: _searchQuery.isNotEmpty
                    ? 'Tidak ada kegiatan yang sesuai pencarian.'
                    : 'Belum ada kegiatan untuk kategori ini.',
                onRefresh: _handleRefresh,
                onRetry: _handleRefresh,
                padding: const EdgeInsets.fromLTRB(25, 14, 25, 110),
                separatorBuilder: (context, index) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final item = filteredList[index];
                  return _FigmaActivityCard(
                    item: item,
                    index: index,
                    onTap: () => _handleOpenDetail(context, item),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterChipButton extends StatelessWidget {
  const _FilterChipButton({
    required this.label,
    required this.isSelected,
    required this.isDark,
    required this.onTap,
  });

  final String label;
  final bool isSelected;
  final bool isDark;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        padding: const EdgeInsets.symmetric(horizontal: 17, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF003D58)
              : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF8F9FF)),
          borderRadius: BorderRadius.circular(9999),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF006971).withValues(alpha: 0.2)
                : (isDark ? Colors.white12 : const Color(0xFFBBC9CB)),
            width: 1,
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 15,
            fontWeight: FontWeight.w500,
            color: isSelected
                ? Colors.white
                : (isDark ? Colors.white70 : const Color(0xFF3C494B)),
            letterSpacing: 0.1,
            height: 1.25,
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════
// KARTU KEGIATAN SESUAI FIGMA NODE 5302:9495
// ══════════════════════════════════════════════
class _FigmaActivityCard extends StatelessWidget {
  const _FigmaActivityCard({
    required this.item,
    required this.onTap,
    required this.index,
  });

  final ActivityItem item;
  final VoidCallback onTap;
  final int index;

  bool get _isOngoing {
    final st = item.status.trim();
    return st == 'Sedang Berlangsung' ||
        st == 'Menunggu Verifikasi' ||
        st == 'Menunggu';
  }

  bool get _isUpcoming {
    final st = item.status.trim();
    return st == 'Akan Datang' || st == 'Ditugaskan';
  }

  bool get _isCancelled {
    final st = item.status.trim();
    return st == 'Dibatalkan' || st == 'Ditolak';
  }

  (Color, Color, Color, String) _getStatusConfig() {
    if (_isCancelled) {
      return (
        const Color(0xFFFEE2E2),
        const Color(0xFFEF4444),
        const Color(0xFF991B1B),
        'Dibatalkan',
      );
    }
    if (item.status.trim() == 'Selesai') {
      return (
        const Color(0xFFEEF2F6),
        const Color(0xFF9AA9B8),
        const Color(0xFF4F6076),
        'Selesai',
      );
    }
    if (_isOngoing) {
      return (
        const Color(0xFFD9F7EF),
        const Color(0xFF19C3A0),
        const Color(0xFF05604F),
        'Sedang Berlangsung',
      );
    }
    return (
      const Color(0xFFDDF1FE),
      const Color(0xFF2BB3FD),
      const Color(0xFF0B5C8C),
      'Akan Datang',
    );
  }

  List<Color> _getAccentGradient() {
    if (_isOngoing) {
      return const [Color(0xFF51FCE4), Color(0xFF2BB3FD)];
    }
    if (_isUpcoming) {
      return const [Color(0xFF2BB3FD), Color(0xFF1E8FC4)];
    }
    return const [Color(0xFFC5D1DC), Color(0xFF9AA9B8)];
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

  String _resolveInitials() {
    if (item.picInitials.trim().isNotEmpty) {
      return item.picInitials.trim().toUpperCase();
    }
    final words = item.picName.trim().split(RegExp(r'\s+'));
    if (words.isEmpty || words.first.isEmpty) return '?';
    if (words.length == 1) return words.first.substring(0, 1).toUpperCase();
    return '${words[0][0]}${words[1][0]}'.toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;
    final (statusBg, dotColor, statusTextColor, statusLabel) = _getStatusConfig();
    final accentColors = _getAccentGradient();
    final formattedDate = _formatShortIndonesianDate(item.date, item.scheduledAt);
    final formattedTime = _formatTimeWithWib(item.time);
    final initials = _resolveInitials();

    final avatarGradient = _isOngoing
        ? const [Color(0xFF2BB3FD), Color(0xFF51FCE4)]
        : const [Color(0xFF003D58), Color(0xFF2BB3FD)];
    final avatarTextColor = _isOngoing ? const Color(0xFF011942) : Colors.white;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white.withValues(alpha: 0.95),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? Colors.white10 : Colors.white,
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF011942).withValues(alpha: isDark ? 0.28 : 0.08),
            blurRadius: 24,
            spreadRadius: -4,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            child: Stack(
              children: [
                // ── KONTEN KARTU ──
                Padding(
                  padding: const EdgeInsets.fromLTRB(19, 15, 15, 11),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // ── 1. HEADER: JUDUL & PILL STATUS ──
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(
                              item.title,
                              style: _pj(
                                16,
                                FontWeight.w800,
                                isDark ? Colors.white : const Color(0xFF0B1B33),
                                ls: -0.2,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 9,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? statusBg.withValues(alpha: 0.2)
                                  : statusBg,
                              borderRadius: BorderRadius.circular(99),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 6,
                                  height: 6,
                                  decoration: BoxDecoration(
                                    color: dotColor,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 5),
                                Text(
                                  statusLabel,
                                  style: _pj(
                                    10.5,
                                    FontWeight.w700,
                                    isDark ? Colors.white : statusTextColor,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      if (item.description.trim().isNotEmpty) ...[
                        const SizedBox(height: 5),
                        Text(
                          item.description.trim(),
                          style: _pj(
                            12.5,
                            FontWeight.w400,
                            isDark ? Colors.white70 : const Color(0xFF5E6E82),
                            height: 1.45,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],

                      const SizedBox(height: 8),

                      // ── 2. KOTAK GRADIENT JADWAL & LOKASI (Figma 5302:9397) ──
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 13,
                          vertical: 14,
                        ),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: isDark
                                ? const [Color(0xFF0F172A), Color(0xFF162235)]
                                : const [Color(0xFFF3FAFE), Color(0xFFE3F7F5)],
                          ),
                          border: Border.all(
                            color: isDark
                                ? Colors.white10
                                : const Color(0xFFE1F0F4),
                            width: 1,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(
                                  Icons.calendar_today_outlined,
                                  size: 14,
                                  color: isDark
                                      ? Colors.white
                                      : const Color(0xFF0B1B33),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  formattedDate,
                                  style: _pj(
                                    12.5,
                                    FontWeight.w700,
                                    isDark
                                        ? Colors.white
                                        : const Color(0xFF0B1B33),
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Icon(
                                  Icons.schedule_rounded,
                                  size: 14,
                                  color: isDark
                                      ? Colors.white
                                      : const Color(0xFF0B1B33),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    formattedTime,
                                    style: _pj(
                                      12.5,
                                      FontWeight.w700,
                                      isDark
                                          ? Colors.white
                                          : const Color(0xFF0B1B33),
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                            if (item.location.trim().isNotEmpty) ...[
                              const SizedBox(height: 7),
                              Row(
                                children: [
                                  Icon(
                                    Icons.location_on_outlined,
                                    size: 14,
                                    color: isDark
                                        ? Colors.white
                                        : const Color(0xFF0B1B33),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      item.location.trim(),
                                      style: _pj(
                                        12.5,
                                        FontWeight.w700,
                                        isDark
                                            ? Colors.white
                                            : const Color(0xFF0B1B33),
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),

                      const SizedBox(height: 8),

                      // ── 3. GARIS PUTUS-PUTUS & FOOTER PIC (Figma 5302:9417) ──
                      SizedBox(
                        width: double.infinity,
                        height: 1,
                        child: CustomPaint(
                          painter: _DashedLinePainter(
                            color: isDark
                                ? Colors.white12
                                : const Color(0xFFD3E6EF),
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(top: 10),
                        child: Row(
                          children: [
                            Container(
                              width: 28,
                              height: 28,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: avatarGradient,
                                ),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                initials,
                                style: _pj(10.5, FontWeight.w800, avatarTextColor),
                              ),
                            ),
                            const SizedBox(width: 9),
                            Text(
                              'PIC:',
                              style: _pj(
                                12.5,
                                FontWeight.w600,
                                isDark
                                    ? Colors.white70
                                    : const Color(0xFF33475B),
                              ),
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                item.picName.trim().isNotEmpty
                                    ? item.picName.trim()
                                    : '-',
                                style: _pj(
                                  12.5,
                                  FontWeight.w800,
                                  isDark
                                      ? Colors.white
                                      : const Color(0xFF0B1B33),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              width: 28,
                              height: 28,
                              decoration: BoxDecoration(
                                color: isDark
                                    ? Colors.white10
                                    : const Color(0xFFEAF3F9),
                                shape: BoxShape.circle,
                              ),
                              alignment: Alignment.center,
                              child: Icon(
                                Icons.chevron_right_rounded,
                                size: 16,
                                color: isDark
                                    ? Colors.white
                                    : const Color(0xFF0B1B33),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // ── AKSEN GARIS VERTIKAL KIRI (Figma 5302:9427) ──
                Positioned(
                  left: 0,
                  top: 18,
                  bottom: 18,
                  width: 4,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      borderRadius: const BorderRadius.horizontal(
                        right: Radius.circular(4),
                      ),
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: accentColors,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ).staggeredEntrance(index);
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
