import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
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
    'Semua',
    'Sedang Dikerjakan',
    'Belum Dikerjakan',
    'Selesai',
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

  void _openFilterSheet(BuildContext context, String activeFilter) {
    HapticFeedback.lightImpact();
    final isDark = AppColors.isDark;
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetCtx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white24 : const Color(0xFFCBD5E1),
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Filter Status Konten',
                      style: _pj(
                        16,
                        FontWeight.w700,
                        isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                    if (activeFilter != 'Semua')
                      TextButton(
                        onPressed: () {
                          Navigator.pop(sheetCtx);
                          _onFilterSelected('Semua');
                        },
                        child: Text(
                          'Reset',
                          style: _pj(12, FontWeight.w600, const Color(0xFF0E7490)),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                for (final filter in _filters)
                  ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 8),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    leading: Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: _filterDotColor(filter),
                      ),
                    ),
                    title: Text(
                      filter,
                      style: _pj(
                        14,
                        filter == activeFilter ? FontWeight.w700 : FontWeight.w500,
                        isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                    trailing: filter == activeFilter
                        ? const Icon(
                            Icons.check_circle_rounded,
                            color: Color(0xFF0B2D52),
                            size: 20,
                          )
                        : null,
                    onTap: () {
                      Navigator.pop(sheetCtx);
                      if (filter != activeFilter) {
                        _onFilterSelected(filter);
                      }
                    },
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Color _filterDotColor(String filter) {
    switch (filter) {
      case 'Sedang Dikerjakan':
        return const Color(0xFF047857);
      case 'Belum Dikerjakan':
        return const Color(0xFFB45309);
      case 'Selesai':
        return const Color(0xFF64748B);
      default:
        return const Color(0xFF0B2D52);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;
    final bgColor =
        isDark ? const Color(0xFF0F172A) : const Color(0xFFF4F7FA);

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
                    (item.rawMaterialUrl?.toLowerCase().contains(q) ?? false) ||
                    item.tags.any((t) => t.toLowerCase().contains(q));
              }).toList();

        return Scaffold(
          backgroundColor: bgColor,
          body: SafeArea(
            bottom: false,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── HEADER SECTION (Figma 5719:5303) ──
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Konten',
                        style: _pj(
                          22,
                          FontWeight.w700,
                          isDark ? Colors.white : const Color(0xFF0F172A),
                          height: 28 / 22,
                          ls: -0.3,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Kelola jadwal dan status publikasi konten.',
                        style: _pj(
                          12,
                          FontWeight.w400,
                          isDark ? Colors.white70 : const Color(0xFF0F172A),
                          height: 16 / 12,
                        ),
                      ),
                      const SizedBox(height: 16),

                      // ── SEARCH INPUT PILL (Figma 5719:5309) ──
                      Container(
                        height: 42,
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : Colors.white,
                          borderRadius: BorderRadius.circular(9999),
                          border: Border.all(
                            color: isDark
                                ? Colors.white12
                                : const Color(0xFFE2E8F0),
                            width: 1,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(
                                alpha: isDark ? 0.18 : 0.05,
                              ),
                              blurRadius: 2,
                              offset: const Offset(0, 1),
                            ),
                          ],
                        ),
                        child: TextField(
                          controller: _searchController,
                          onChanged: (val) => setState(() => _searchQuery = val),
                          style: _pj(
                            14,
                            FontWeight.w500,
                            isDark ? Colors.white : const Color(0xFF0F172A),
                          ),
                          decoration: InputDecoration(
                            hintText: 'Cari konten atau bahan edit...',
                            hintStyle: _pj(
                              14,
                              FontWeight.w400,
                              const Color(0xFF64748B),
                            ),
                            prefixIcon: const Icon(
                              Icons.search_rounded,
                              size: 20,
                              color: Color(0xFF64748B),
                            ),
                            suffixIcon: _searchQuery.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(
                                      Icons.close_rounded,
                                      size: 18,
                                      color: Color(0xFF64748B),
                                    ),
                                    onPressed: () {
                                      _searchController.clear();
                                      setState(() => _searchQuery = '');
                                    },
                                  )
                                : null,
                            border: InputBorder.none,
                            contentPadding:
                                const EdgeInsets.symmetric(vertical: 10),
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),

                      // ── FILTER BUTTON + ACTIVE TAB PILL (Figma 5719:5270 & 5719:5318) ──
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          InkWell(
                            onTap: () => _openFilterSheet(context, state.filter),
                            borderRadius: BorderRadius.circular(10),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  SizedBox(
                                    width: 24,
                                    height: 20,
                                    child: CustomPaint(
                                      painter: _FilterSlidersPainter(
                                        color: isDark
                                            ? Colors.white
                                            : Colors.black,
                                        knobFillColor: bgColor,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Filter',
                                    style: _pj(
                                      9,
                                      FontWeight.w500,
                                      isDark ? Colors.white70 : Colors.black,
                                      height: 1.1,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              physics: const BouncingScrollPhysics(),
                              child: Row(
                                children: [
                                  _ActiveFilterPill(
                                    label:
                                        '${state.filter} (${filteredItems.length})',
                                    isSelected: true,
                                    isDark: isDark,
                                    onTap: () =>
                                        _openFilterSheet(context, state.filter),
                                  ),
                                  if (state.filter != 'Semua') ...[
                                    const SizedBox(width: 8),
                                    _ActiveFilterPill(
                                      label: 'Semua',
                                      isSelected: false,
                                      isDark: isDark,
                                      onTap: () => _onFilterSelected('Semua'),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // ── CONTENT CARD LIST (Figma 5719:5331) ──
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
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 112),
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

class _ActiveFilterPill extends StatelessWidget {
  const _ActiveFilterPill({
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
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF0B2D52)
              : (isDark ? const Color(0xFF1E293B) : Colors.white),
          borderRadius: BorderRadius.circular(9999),
          border: isSelected
              ? null
              : Border.all(
                  color: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
                ),
        ),
        child: Text(
          label,
          style: _pj(
            12,
            FontWeight.w600,
            isSelected
                ? Colors.white
                : (isDark ? Colors.white70 : const Color(0xFF475569)),
            height: 16 / 12,
            ls: 0.1,
          ),
        ),
      ),
    );
  }
}

class _FilterSlidersPainter extends CustomPainter {
  const _FilterSlidersPainter({
    required this.color,
    required this.knobFillColor,
  });

  final Color color;
  final Color knobFillColor;

  @override
  void paint(Canvas canvas, Size size) {
    final stroke = Paint()
      ..color = color
      ..strokeWidth = 1.6
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
    final fillBg = Paint()
      ..color = knobFillColor
      ..style = PaintingStyle.fill;

    final ys = [size.height * 0.22, size.height * 0.52, size.height * 0.82];
    final knobXs = [size.width * 0.32, size.width * 0.72, size.width * 0.45];
    const r = 2.6;

    for (int i = 0; i < 3; i++) {
      final y = ys[i];
      final kx = knobXs[i];
      canvas.drawLine(Offset(2, y), Offset(size.width - 2, y), stroke);
      canvas.drawCircle(Offset(kx, y), r, fillBg);
      canvas.drawCircle(Offset(kx, y), r, stroke);
    }
  }

  @override
  bool shouldRepaint(covariant _FilterSlidersPainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.knobFillColor != knobFillColor;
}

enum _DeadlineUrgency { urgent, soon, normal }

class _RedesignedContentCard extends StatelessWidget {
  const _RedesignedContentCard({
    required this.item,
    required this.onTap,
    required this.index,
  });

  final ContentPlanItem item;
  final VoidCallback onTap;
  final int index;

  static const _platformDisplayMap = {
    'instagram': 'Instagram',
    'tiktok': 'TikTok',
    'youtube': 'YouTube',
    'website': 'Website',
    'facebook': 'Facebook',
    'twitter': 'X',
    'x': 'X',
    'linkedin': 'LinkedIn',
  };

  static const _indonesianMonths = [
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

  (Color, Color, Color, String) _statusStyle(ContentPlanStatus status) {
    switch (status) {
      case ContentPlanStatus.selesai:
      case ContentPlanStatus.disetujui:
        return (
          const Color(0xFFE2E8F0),
          const Color(0xFF64748B),
          const Color(0xFF0F172A),
          'Selesai',
        );
      case ContentPlanStatus.sedangDikerjakan:
        return (
          const Color(0xFFE6F7F0),
          const Color(0xFF047857),
          const Color(0xFF047857),
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
          const Color(0xFFFEF3C7),
          const Color(0xFFB45309),
          const Color(0xFFB45309),
          'Belum Dikerjakan',
        );
    }
  }

  List<Color> _accentBarGradient(ContentPlanStatus status) {
    switch (status) {
      case ContentPlanStatus.selesai:
      case ContentPlanStatus.disetujui:
        return const [Color(0xFFAAACAC), Color(0xFF4D5154)];
      case ContentPlanStatus.belumDikerjakan:
      case ContentPlanStatus.perluRevisi:
      case ContentPlanStatus.ditolak:
        return const [Color(0xFFFFDD00), Color(0xFFD61E21)];
      case ContentPlanStatus.sedangDikerjakan:
      case ContentPlanStatus.menungguVerifikasiAdmin:
      case ContentPlanStatus.menungguPersetujuanKepalaHumas:
        return const [Color(0xFF2DE0C5), Color(0xFF1E8FD6)];
    }
  }

  List<String> _resolveDisplayTags() {
    final typeTags = <String>[];
    final platformTags = <String>[];

    for (final raw in item.tags) {
      for (final part in raw.split(RegExp(r'[,/|]+'))) {
        final cleaned = part.trim();
        if (cleaned.isEmpty) continue;
        final canonical = _platformDisplayMap[cleaned.toLowerCase()];
        if (canonical != null) {
          if (!platformTags.contains(canonical)) {
            platformTags.add(canonical);
          }
        } else if (!typeTags.contains(cleaned)) {
          typeTags.add(cleaned);
        }
      }
    }

    final ordered = <String>[...typeTags, ...platformTags];
    return ordered.take(2).toList();
  }

  (_DeadlineUrgency, String) _resolveDeadlineInfo() {
    final parsed = DateTime.tryParse(item.deadline.trim())?.toLocal();
    if (parsed != null) {
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      final targetDay = DateTime(parsed.year, parsed.month, parsed.day);
      final diffDays = targetDay.difference(today).inDays;
      final hh = parsed.hour.toString().padLeft(2, '0');
      final mm = parsed.minute.toString().padLeft(2, '0');
      final timeStr = '$hh:$mm';

      if (diffDays == 0) {
        return (_DeadlineUrgency.urgent, 'Hari ini, $timeStr');
      } else if (diffDays < 0) {
        final mon = _indonesianMonths[parsed.month.clamp(1, 12)];
        return (_DeadlineUrgency.urgent, '${parsed.day} $mon, $timeStr');
      } else if (diffDays == 1) {
        return (_DeadlineUrgency.soon, 'Besok, $timeStr');
      } else {
        final mon = _indonesianMonths[parsed.month.clamp(1, 12)];
        return (_DeadlineUrgency.normal, '${parsed.day} $mon, $timeStr');
      }
    }

    final fallback = item.deadlineLabel.trim().isNotEmpty
        ? item.deadlineLabel.trim()
        : item.deadline.trim();
    final lower = fallback.toLowerCase();
    if (lower.contains('hari ini') || lower.contains('segera')) {
      return (_DeadlineUrgency.urgent, fallback);
    }
    if (lower.contains('besok')) {
      return (_DeadlineUrgency.soon, fallback);
    }
    return (_DeadlineUrgency.normal, fallback);
  }

  String _formatPublishedLabel() {
    final parsed = DateTime.tryParse(item.deadline.trim())?.toLocal();
    if (parsed != null) {
      final mon = _indonesianMonths[parsed.month.clamp(1, 12)];
      return 'Terbit ${parsed.day} $mon ${parsed.year}';
    }
    final fallback = item.deadlineLabel.trim().isNotEmpty
        ? item.deadlineLabel.trim()
        : item.deadline.trim();
    return fallback.isNotEmpty ? 'Terbit $fallback' : 'Telah Terbit';
  }

  (String, String, bool) _resolveMaterialInfo() {
    final raw = item.rawMaterialUrl?.trim() ?? '';
    if (raw.isNotEmpty) {
      final lower = raw.toLowerCase();
      if (lower.contains('drive.google')) {
        return ('Bahan Edit: Materi Mentah (GDrive)', 'Buka Link', true);
      }
      if (lower.contains('youtu')) {
        return ('Bahan Edit: Referensi Video', 'Buka Link', true);
      }
      return ('Bahan Edit: Aset & Materi Admin', 'Buka Link', true);
    }
    return ('Bahan Edit: Brief & Panduan Konten', 'Detail', false);
  }

  Future<void> _openRawMaterial(BuildContext context) async {
    final raw = item.rawMaterialUrl?.trim() ?? '';
    if (raw.isEmpty) {
      onTap();
      return;
    }
    final normalized =
        (raw.startsWith('http://') || raw.startsWith('https://'))
            ? raw
            : 'https://$raw';
    final uri = Uri.tryParse(normalized);
    if (uri != null) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  String _resolveInitials(String name) {
    final parts =
        name.trim().split(RegExp(r'\s+')).where((s) => s.isNotEmpty).toList();
    if (parts.isEmpty) return 'TH';
    if (parts.length == 1) {
      return parts.first
          .substring(0, parts.first.length.clamp(1, 2))
          .toUpperCase();
    }
    return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
  }

  (Color, Color) _avatarColors(ContentPlanStatus status) {
    if (status == ContentPlanStatus.selesai ||
        status == ContentPlanStatus.disetujui) {
      return (const Color(0xFFE2E8F0), const Color(0xFF0F172A));
    }
    if (status == ContentPlanStatus.belumDikerjakan) {
      return (const Color(0xFFFEF3C7), const Color(0xFFB45309));
    }
    if (index.isOdd) {
      return (const Color(0xFF0B2D52), Colors.white);
    }
    return (const Color(0xFFE0F4F8), const Color(0xFF094A63));
  }

  List<IconData> _resolveFooterIcons(List<String> tags) {
    final joined = [...item.tags, ...tags].join(' ').toLowerCase();
    final icons = <IconData>[];
    if (joined.contains('instagram') ||
        joined.contains('foto') ||
        joined.contains('poster') ||
        joined.contains('carousel')) {
      icons.add(Icons.camera_alt_outlined);
    }
    if (joined.contains('reels') || joined.contains('tiktok')) {
      icons.add(Icons.play_circle_outline_rounded);
    } else if (joined.contains('video') || joined.contains('youtube')) {
      icons.add(Icons.videocam_outlined);
    }
    if (joined.contains('carousel') || joined.contains('infografis')) {
      if (!icons.contains(Icons.groups_outlined) && icons.length < 2) {
        icons.add(Icons.groups_outlined);
      }
    }
    if (icons.isEmpty) {
      icons.add(Icons.camera_alt_outlined);
    }
    return icons.take(2).toList();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;
    final isCompleted = item.status == ContentPlanStatus.selesai ||
        item.status == ContentPlanStatus.disetujui;
    final (statusBg, dotColor, statusTextColor, statusLabel) =
        _statusStyle(item.status);
    final visibleTags = _resolveDisplayTags();
    final (urgency, deadlineDisplay) = _resolveDeadlineInfo();
    final (materialTitle, materialBadge, hasMaterialLink) =
        _resolveMaterialInfo();
    final picName = item.pic.trim().isNotEmpty ? item.pic.trim() : 'Tim Humas';
    final picInitials = _resolveInitials(picName);
    final (avatarBg, avatarFg) = _avatarColors(item.status);
    final footerIcons = _resolveFooterIcons(visibleTags);

    final (Color dlBg, Color dlBorder, Color dlText, IconData dlIcon) =
        switch (urgency) {
      _DeadlineUrgency.urgent => (
          isDark
              ? const Color(0xFF3B1518)
              : const Color(0xFFFEE2E2).withValues(alpha: 0.6),
          isDark
              ? const Color(0xFF7F1D1D)
              : const Color(0xFFB91C1C).withValues(alpha: 0.2),
          isDark ? const Color(0xFFFCA5A5) : const Color(0xFFB91C1C),
          Icons.access_time_rounded,
        ),
      _DeadlineUrgency.soon => (
          isDark
              ? const Color(0xFF0F2E26)
              : const Color(0xFFE6F7F0).withValues(alpha: 0.7),
          isDark
              ? const Color(0xFF065F46)
              : const Color(0xFF047857).withValues(alpha: 0.2),
          isDark ? const Color(0xFF6EE7B7) : const Color(0xFF047857),
          Icons.calendar_today_outlined,
        ),
      _DeadlineUrgency.normal => (
          isDark ? const Color(0xFF162235) : const Color(0xFFEFF6FF),
          isDark ? Colors.white12 : const Color(0xFFE0F4F8),
          isDark ? Colors.white : const Color(0xFF0F172A),
          Icons.calendar_today_outlined,
        ),
    };

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.22 : 0.05),
            blurRadius: 2,
            offset: const Offset(0, 1),
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
                  padding: const EdgeInsets.fromLTRB(26, 16, 16, 14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // ── 1. TAGS & STATUS PILL (Figma 5719:5334) ──
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Expanded(
                            child: Wrap(
                              spacing: 6,
                              runSpacing: 6,
                              children: [
                                for (int i = 0; i < visibleTags.length; i++)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 3,
                                    ),
                                    decoration: BoxDecoration(
                                      color: i == 0
                                          ? (isDark
                                              ? const Color(0xFF133845)
                                              : const Color(0xFFE0F4F8))
                                          : (isDark
                                              ? Colors.white10
                                              : const Color(0xFFE2E8F0)),
                                      borderRadius: BorderRadius.circular(9999),
                                    ),
                                    child: Text(
                                      visibleTags[i],
                                      style: _pj(
                                        11,
                                        FontWeight.w600,
                                        i == 0
                                            ? (isDark
                                                ? const Color(0xFF67E8F9)
                                                : const Color(0xFF094A63))
                                            : (isDark
                                                ? Colors.white70
                                                : const Color(0xFF0F172A)),
                                        height: 14 / 11,
                                        ls: 0.2,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? dotColor.withValues(alpha: 0.2)
                                  : statusBg,
                              borderRadius: BorderRadius.circular(9999),
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
                                    11,
                                    FontWeight.w600,
                                    isDark ? Colors.white : statusTextColor,
                                    height: 14 / 11,
                                    ls: 0.2,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 8),

                      // ── 2. TITLE (Figma 5719:5344) ──
                      Text(
                        item.title,
                        style: _pj(
                          16,
                          FontWeight.w700,
                          isDark ? Colors.white : const Color(0xFF0F172A),
                          height: 22 / 16,
                          ls: -0.1,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),

                      if (item.description.trim().isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          item.description.trim(),
                          style: _pj(
                            12,
                            FontWeight.w400,
                            isDark ? Colors.white70 : const Color(0xFF64748B),
                            height: 16 / 12,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],

                      const SizedBox(height: 8),

                      // ── 3. BAHAN EDIT DARI ADMIN (Figma 5719:5348) ──
                      InkWell(
                        onTap: hasMaterialLink
                            ? () => _openRawMaterial(context)
                            : onTap,
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 7,
                          ),
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF0F172A)
                                : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isDark
                                  ? Colors.white10
                                  : const Color(0xFFE2E8F0),
                            ),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.folder_outlined,
                                size: 16,
                                color: Color(0xFF0E7490),
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  materialTitle,
                                  style: _pj(
                                    11,
                                    FontWeight.w600,
                                    isDark
                                        ? Colors.white
                                        : const Color(0xFF0F172A),
                                    height: 14 / 11,
                                    ls: 0.1,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                materialBadge,
                                style: _pj(
                                  11,
                                  FontWeight.w600,
                                  const Color(0xFF0E7490),
                                  height: 14 / 11,
                                  ls: 0.2,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      // ── 4. DEADLINE BOX FOR ACTIVE ITEMS (Figma 5719:5356) ──
                      if (!isCompleted) ...[
                        const SizedBox(height: 8),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 9,
                          ),
                          decoration: BoxDecoration(
                            color: dlBg,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: dlBorder, width: 1),
                          ),
                          child: Row(
                            children: [
                              Icon(dlIcon, size: 16, color: dlText),
                              const SizedBox(width: 6),
                              Expanded(
                                child: RichText(
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  text: TextSpan(
                                    children: [
                                      TextSpan(
                                        text: 'Tenggat ',
                                        style: _pj(
                                          12,
                                          FontWeight.w400,
                                          dlText,
                                          height: 16 / 12,
                                        ),
                                      ),
                                      TextSpan(
                                        text: deadlineDisplay,
                                        style: _pj(
                                          12,
                                          FontWeight.w700,
                                          dlText,
                                          height: 16 / 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],

                      const SizedBox(height: 10),

                      // ── 5. SOLID BORDER FOOTER + PIC AVATAR & ACTIONS (Figma 5719:5361) ──
                      Container(
                        padding: const EdgeInsets.only(top: 8),
                        decoration: BoxDecoration(
                          border: Border(
                            top: BorderSide(
                              color: isDark
                                  ? Colors.white12
                                  : const Color(0xFFE2E8F0),
                              width: 1,
                            ),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Row(
                                children: [
                                  Container(
                                    width: 24,
                                    height: 24,
                                    decoration: BoxDecoration(
                                      color: avatarBg,
                                      shape: BoxShape.circle,
                                    ),
                                    alignment: Alignment.center,
                                    child: Text(
                                      picInitials,
                                      style: _pj(
                                        10,
                                        FontWeight.w600,
                                        avatarFg,
                                        ls: 0.2,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Flexible(
                                    child: Text(
                                      picName,
                                      style: _pj(
                                        11,
                                        FontWeight.w600,
                                        isDark
                                            ? Colors.white
                                            : const Color(0xFF0F172A),
                                        height: 14 / 11,
                                        ls: 0.1,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  if (isCompleted)
                                    Text(
                                      _formatPublishedLabel(),
                                      style: _pj(
                                        11,
                                        FontWeight.w600,
                                        const Color(0xFF047857),
                                        height: 14 / 11,
                                        ls: 0.1,
                                      ),
                                    )
                                  else
                                    for (int i = 0; i < footerIcons.length; i++) ...[
                                      if (i > 0) const SizedBox(width: 6),
                                      Container(
                                        width: 24,
                                        height: 24,
                                        decoration: BoxDecoration(
                                          color: isDark
                                              ? Colors.white10
                                              : const Color(0xFFF8FAFC),
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: isDark
                                                ? Colors.white12
                                                : const Color(0xFFE2E8F0),
                                          ),
                                        ),
                                        alignment: Alignment.center,
                                        child: Icon(
                                          footerIcons[i],
                                          size: 13.5,
                                          color: isDark
                                              ? Colors.white70
                                              : const Color(0xFF0F172A),
                                        ),
                                      ),
                                    ],
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color: isDark
                                    ? Colors.white12
                                    : const Color(0xFFEFF6FF),
                                shape: BoxShape.circle,
                              ),
                              alignment: Alignment.center,
                              child: Icon(
                                Icons.chevron_right_rounded,
                                size: 18,
                                color: isDark
                                    ? Colors.white
                                    : const Color(0xFF0F172A),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // ── LEFT VERTICAL GRADIENT ACCENT BAR (Figma 5719:5534 / 5535 / 5536) ──
                Positioned(
                  left: 0,
                  top: 25,
                  bottom: 24,
                  width: 5,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      borderRadius: const BorderRadius.horizontal(
                        right: Radius.circular(4),
                      ),
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: _accentBarGradient(item.status),
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
