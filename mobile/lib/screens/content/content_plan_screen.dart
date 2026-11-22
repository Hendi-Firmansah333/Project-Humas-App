import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:poli_humas/animations/app_animations.dart';
import 'package:poli_humas/models/content_plan.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/content/content_plan_detail_screen.dart';
import 'package:poli_humas/theme/app_colors.dart';
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

class ContentPlanScreen extends StatefulWidget {
  const ContentPlanScreen({super.key});

  @override
  State<ContentPlanScreen> createState() => _ContentPlanScreenState();
}

class _ContentPlanScreenState extends State<ContentPlanScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';

  static const _filters = [
    'Sedang Dikerjakan',
    'Belum Dikerjakan',
    'Selesai',
    'Semua',
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onFilterSelected(String filter) {
    HapticFeedback.selectionClick();
    context
        .read<AppDataProvider>()
        .loadContentPlans(filter: filter, refresh: true);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;
    final bgColor =
        isDark ? const Color(0xFF0F172A) : const Color(0xFFF8F9FF);

    return Consumer<AppDataProvider>(
      builder: (context, provider, _) {
        final state = provider.contentPlansState;
        final q = _searchQuery.trim().toLowerCase();
        final filteredItems = q.isEmpty
            ? state.items
            : state.items.where((item) {
                return item.title.toLowerCase().contains(q) ||
                    item.description.toLowerCase().contains(q) ||
                    item.pic.toLowerCase().contains(q) ||
                    item.tags.any((t) => t.toLowerCase().contains(q));
              }).toList();

        return Scaffold(
          backgroundColor: bgColor,
          body: SafeArea(
            bottom: false,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── HEADER SECTION (Figma 5403:2286) ──
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(25, 12, 25, 14),
                  decoration: BoxDecoration(
                    color: bgColor,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(
                          alpha: isDark ? 0.2 : 0.05,
                        ),
                        blurRadius: 1,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Konten',
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
                        'Kelola jadwal dan status publikasi konten.',
                        style: _pj(
                          14,
                          FontWeight.w400,
                          isDark ? Colors.white70 : const Color(0xFF4B5B6B),
                        ),
                      ),
                      const SizedBox(height: 20),

                      // ── SEARCH BAR (Figma 5403:2292) ──
                      Container(
                        height: 46,
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0xFF1E293B)
                              : const Color(0xFFF8F9FF),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isDark
                                ? Colors.white12
                                : const Color(0xFFBBC9CB),
                            width: 1,
                          ),
                        ),
                        child: TextField(
                          controller: _searchController,
                          onChanged: (val) => setState(() => _searchQuery = val),
                          style: GoogleFonts.poppins(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: isDark
                                ? Colors.white
                                : const Color(0xFF0B1B2B),
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
                                      setState(() => _searchQuery = '');
                                    },
                                  )
                                : null,
                            border: InputBorder.none,
                            contentPadding:
                                const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // ── FILTER PILLS (Figma 5403:2298) ──
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        physics: const BouncingScrollPhysics(),
                        child: Row(
                          children: [
                            for (int i = 0; i < _filters.length; i++) ...[
                              if (i > 0) const SizedBox(width: 10),
                              _ContentFilterPill(
                                label: _filters[i],
                                isSelected: _filters[i] == state.filter,
                                isDark: isDark,
                                onTap: () => _onFilterSelected(_filters[i]),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // ── CONTENT CARD LIST (Figma 5403:2208) ──
                Expanded(
                  child: PaginatedRefreshList(
                    itemCount: filteredItems.length,
                    isLoading: state.isLoading,
                    isLoadingMore: state.isLoadingMore,
                    isRefreshing: state.isRefreshing,
                    error: state.error,
                    emptyMessage: _searchQuery.trim().isNotEmpty
                        ? 'Tidak ada konten yang sesuai pencarian.'
                        : 'Tidak ada content plan pada filter ini.',
                    onRefresh: () => provider.loadContentPlans(refresh: true),
                    onLoadMore: () => provider.loadContentPlans(loadMore: true),
                    onRetry: () => provider.loadContentPlans(refresh: true),
                    padding: const EdgeInsets.fromLTRB(25, 16, 25, 110),
                    separatorBuilder: (context, index) =>
                        const SizedBox(height: 16),
                    itemBuilder: (context, index) {
                      final item = filteredItems[index];
                      return _RedesignedContentCard(
                        item: item,
                        index: index,
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ContentPlanDetailScreen(item: item),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _ContentFilterPill extends StatelessWidget {
  const _ContentFilterPill({
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
        padding: isSelected
            ? const EdgeInsets.symmetric(horizontal: 21, vertical: 11)
            : const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF083E4C)
              : (isDark ? const Color(0xFF1E293B) : const Color(0xFFE5EEFF)),
          borderRadius: BorderRadius.circular(9999),
          boxShadow: isSelected
              ? null
              : [
                  BoxShadow(
                    color: const Color(0xFF083E4C).withValues(
                      alpha: isDark ? 0.25 : 0.14,
                    ),
                    blurRadius: 2,
                    offset: const Offset(0, 1),
                  ),
                ],
        ),
        child: Text(
          label,
          style: _pj(
            12,
            FontWeight.w600,
            isSelected
                ? Colors.white
                : (isDark ? Colors.white70 : const Color(0xFF475569)),
          ),
        ),
      ),
    );
  }
}

class _RedesignedContentCard extends StatelessWidget {
  const _RedesignedContentCard({
    required this.item,
    required this.onTap,
    required this.index,
  });

  final ContentPlanItem item;
  final VoidCallback onTap;
  final int index;

  (Color, Color, Color, String) _statusStyle(ContentPlanStatus status) {
    switch (status) {
      case ContentPlanStatus.selesai:
      case ContentPlanStatus.disetujui:
        return (
          const Color(0xFFD9F6EF),
          const Color(0xFF14B89E),
          const Color(0xFF0A6B5B),
          'Selesai',
        );
      case ContentPlanStatus.sedangDikerjakan:
        return (
          const Color(0xFFDDF1FE),
          const Color(0xFF2BB3FD),
          const Color(0xFF0B5C8C),
          'Sedang Dikerjakan',
        );
      case ContentPlanStatus.menungguVerifikasiAdmin:
      case ContentPlanStatus.menungguPersetujuanKepalaHumas:
        return (
          const Color(0xFFE0E7FF),
          const Color(0xFF4F46E5),
          const Color(0xFF3730A3),
          'Menunggu Review',
        );
      case ContentPlanStatus.perluRevisi:
        return (
          const Color(0xFFFFF7ED),
          const Color(0xFFF97316),
          const Color(0xFFC2410C),
          'Perlu Revisi',
        );
      case ContentPlanStatus.ditolak:
        return (
          const Color(0xFFFEE2E2),
          const Color(0xFFEF4444),
          const Color(0xFF991B1B),
          'Ditolak',
        );
      case ContentPlanStatus.belumDikerjakan:
        return (
          const Color(0xFFEEF2F6),
          const Color(0xFF9AA9B8),
          const Color(0xFF4F6076),
          'Belum Dikerjakan',
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;
    final (statusBg, dotColor, statusTextColor, statusLabel) =
        _statusStyle(item.status);

    final deadlineText = item.deadlineLabel.trim().isNotEmpty
        ? item.deadlineLabel.trim()
        : item.deadline.trim();
    final isUrgent = item.deadline.toLowerCase().contains('hari ini') ||
        item.deadlineLabel.toLowerCase().contains('hari ini') ||
        item.deadline.toLowerCase().contains('segera') ||
        item.deadlineLabel.toLowerCase().contains('segera');

    final hasVideoTag = item.tags.any(
      (t) =>
          t.toLowerCase().contains('video') ||
          t.toLowerCase().contains('reels'),
    );

    final visibleTags = item.tags.take(2).toList();

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
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
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () {
              HapticFeedback.lightImpact();
              onTap();
            },
            child: Stack(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 20, 20, 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // ── 1. TAGS & STATUS PILL (Figma 5403:2210) ──
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Expanded(
                            child: Wrap(
                              spacing: 8,
                              runSpacing: 6,
                              children: [
                                for (int i = 0; i < visibleTags.length; i++)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 5,
                                    ),
                                    decoration: BoxDecoration(
                                      color: i == 0
                                          ? (isDark
                                              ? const Color(0xFF133835)
                                              : const Color(0xFFE3F7F4))
                                          : (isDark
                                              ? Colors.white10
                                              : const Color(0xFFEDF1F6)),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Text(
                                      visibleTags[i],
                                      style: _pj(
                                        12.5,
                                        i == 0
                                            ? FontWeight.w700
                                            : FontWeight.w600,
                                        i == 0
                                            ? (isDark
                                                ? const Color(0xFF2EE6C8)
                                                : const Color(0xFF0A6B5B))
                                            : (isDark
                                                ? Colors.white70
                                                : const Color(0xFF3E4E5E)),
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? dotColor.withValues(alpha: 0.2)
                                  : statusBg,
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 7,
                                  height: 7,
                                  decoration: BoxDecoration(
                                    color: dotColor,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  statusLabel,
                                  style: _pj(
                                    12,
                                    FontWeight.w700,
                                    isDark ? Colors.white : statusTextColor,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 12),

                      // ── 2. TITLE (Figma 5403:2219) ──
                      Text(
                        item.title,
                        style: _pj(
                          19,
                          FontWeight.w800,
                          isDark ? Colors.white : const Color(0xFF0B1B2B),
                          ls: -0.3,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),

                      if (item.description.trim().isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text(
                          item.description.trim(),
                          style: _pj(
                            14,
                            FontWeight.w400,
                            isDark ? Colors.white70 : const Color(0xFF4B5B6B),
                            height: 1.55,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],

                      const SizedBox(height: 14),

                      // ── 3. TENGGAT BOX (Figma 5403:2223 / 5403:2260) ──
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 17,
                          vertical: 13,
                        ),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          color: isUrgent
                              ? (isDark
                                  ? const Color(0xFF3B1518)
                                  : const Color(0xFFFFF1F1))
                              : null,
                          gradient: isUrgent
                              ? null
                              : LinearGradient(
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
                            color: isUrgent
                                ? (isDark
                                    ? const Color(0xFF7F1D1D)
                                    : const Color(0xFFF8D3D3))
                                : (isDark
                                    ? Colors.white10
                                    : const Color(0xFFCBEAE6)),
                            width: 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              isUrgent
                                  ? Icons.access_time_rounded
                                  : Icons.calendar_today_outlined,
                              size: 17,
                              color: isUrgent
                                  ? (isDark
                                      ? const Color(0xFFFCA5A5)
                                      : const Color(0xFFB42318))
                                  : (isDark
                                      ? Colors.white
                                      : const Color(0xFF0B1B2B)),
                            ),
                            const SizedBox(width: 10),
                            Text(
                              'Tenggat',
                              style: _pj(
                                12.5,
                                FontWeight.w400,
                                isUrgent
                                    ? (isDark
                                        ? const Color(0xFFFECACA)
                                        : const Color(0xFF6B4A4A))
                                    : (isDark
                                        ? Colors.white70
                                        : const Color(0xFF4B5B6B)),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                deadlineText,
                                style: _pj(
                                  13.5,
                                  FontWeight.w800,
                                  isUrgent
                                      ? (isDark
                                          ? const Color(0xFFFCA5A5)
                                          : const Color(0xFFB42318))
                                      : (isDark
                                          ? Colors.white
                                          : const Color(0xFF0B1B2B)),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 14),

                      // ── 4. DASHED HORIZONTAL DIVIDER (Figma 5403:2231) ──
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

                      const SizedBox(height: 12),

                      // ── 5. BOTTOM ICON ROW (Figma 5403:2232) ──
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 32,
                                height: 32,
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? Colors.white10
                                      : const Color(0xFFEEF4F8),
                                  shape: BoxShape.circle,
                                ),
                                alignment: Alignment.center,
                                child: Icon(
                                  Icons.camera_alt_outlined,
                                  size: 16,
                                  color: isDark
                                      ? Colors.white
                                      : const Color(0xFF0B1B2B),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                width: 32,
                                height: 32,
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? Colors.white10
                                      : const Color(0xFFEEF4F8),
                                  shape: BoxShape.circle,
                                ),
                                alignment: Alignment.center,
                                child: Icon(
                                  hasVideoTag
                                      ? Icons.play_circle_outline_rounded
                                      : Icons.groups_outlined,
                                  size: 16,
                                  color: isDark
                                      ? Colors.white
                                      : const Color(0xFF0B1B2B),
                                ),
                              ),
                            ],
                          ),
                          Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: isDark
                                  ? Colors.white12
                                  : const Color(0xFFE3EDF6),
                              shape: BoxShape.circle,
                            ),
                            alignment: Alignment.center,
                            child: Icon(
                              Icons.chevron_right_rounded,
                              size: 18,
                              color: isDark
                                  ? Colors.white
                                  : const Color(0xFF0B1B2B),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // ── LEFT VERTICAL GRADIENT ACCENT BAR (Figma 5403:2245) ──
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
