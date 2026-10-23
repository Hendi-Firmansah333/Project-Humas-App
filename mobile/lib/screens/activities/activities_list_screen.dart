import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:poli_humas/animations/app_animations.dart';
import 'package:poli_humas/models/activity.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/activities/activity_detail_screen.dart';
import 'package:poli_humas/screens/activities/activity_history_screen.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/utils/app_navigator.dart';
import 'package:poli_humas/widgets/common_widgets.dart';
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

  static const _filters = ['Semua', 'Akan Datang', 'Sedang Berlangsung'];

  @override
  void initState() {
    super.initState();
    final provider = context.read<AppDataProvider>();
    _searchController.text = provider.activitiesState.searchQuery;
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 400), () {
      context.read<AppDataProvider>().loadActivities(refresh: true, search: value);
    });
  }

  void _onFilterSelected(String value) {
    context.read<AppDataProvider>().loadActivities(refresh: true, filter: value);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;
    final state = context.watch<AppDataProvider>().activitiesState;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      appBar: AppHeader(
        trailing: IconButton(
          onPressed: () => pushSmooth(context, const ActivityHistoryScreen()),
          icon: Icon(
            Icons.history_rounded,
            color: isDark ? Colors.white70 : AppColors.slate600,
          ),
          tooltip: 'Riwayat',
        ),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Kegiatan',
                  style: _pj(
                    24,
                    FontWeight.w900,
                    isDark ? Colors.white : AppColors.slate900,
                    ls: -0.5,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Jadwal peliputan, acara kampus, dan tugas kehumasan',
                  style: _pj(
                    12,
                    FontWeight.w500,
                    isDark ? Colors.white60 : AppColors.slate500,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
            child: TextField(
              controller: _searchController,
              onChanged: _onSearchChanged,
              style: _pj(13, FontWeight.w600, isDark ? Colors.white : AppColors.slate900),
              decoration: InputDecoration(
                hintText: 'Cari jadwal liputan, rapat, dll...',
                hintStyle: _pj(13, FontWeight.w400, AppColors.slate400),
                prefixIcon: const Icon(Icons.search_rounded, size: 20),
                filled: true,
                fillColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide(
                    color: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
                  ),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide(
                    color: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _filters.map((filter) {
                  final selected = filter == state.filter;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: GestureDetector(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        _onFilterSelected(filter);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: selected
                              ? AppColors.brand600
                              : (isDark ? const Color(0xFF1E293B) : Colors.white),
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: selected
                                ? AppColors.brand600
                                : (isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
                          ),
                          boxShadow: selected
                              ? [
                                  BoxShadow(
                                    color: AppColors.brand600.withValues(alpha: 0.3),
                                    blurRadius: 10,
                                    offset: const Offset(0, 3),
                                  ),
                                ]
                              : null,
                        ),
                        child: Text(
                          filter,
                          style: _pj(
                            12,
                            selected ? FontWeight.w800 : FontWeight.w600,
                            selected
                                ? Colors.white
                                : (isDark ? Colors.white70 : AppColors.slate600),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: PaginatedRefreshList(
              itemCount: state.items.length,
              isLoading: state.isLoading,
              isLoadingMore: state.isLoadingMore,
              isRefreshing: state.isRefreshing,
              error: state.error,
              emptyMessage: 'Tidak ada kegiatan ditemukan.',
              onRefresh: () => context.read<AppDataProvider>().loadActivities(refresh: true),
              onLoadMore: () => context.read<AppDataProvider>().loadActivities(loadMore: true),
              onRetry: () => context.read<AppDataProvider>().loadActivities(refresh: true),
              padding: const EdgeInsets.fromLTRB(18, 4, 18, 90),
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final item = state.items[index];
                return _ModernActivityCard(
                  item: item,
                  index: index,
                  onTap: () => pushSmooth(
                    context,
                    ActivityDetailScreen(activity: item),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _ModernActivityCard extends StatelessWidget {
  const _ModernActivityCard({
    required this.item,
    required this.onTap,
    required this.index,
  });

  final ActivityItem item;
  final VoidCallback onTap;
  final int index;

  (String, String) _parseDate(String raw, [DateTime? scheduledAt]) {
    final months = ['', 'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
    if (scheduledAt != null) {
      return (scheduledAt.day.toString().padLeft(2, '0'), months[scheduledAt.month.clamp(1, 12)]);
    }
    final parsed = DateTime.tryParse(raw.trim());
    if (parsed != null) {
      return (parsed.day.toString().padLeft(2, '0'), months[parsed.month.clamp(1, 12)]);
    }
    final trimmed = raw.trim();
    final parts = trimmed.split(RegExp(r'[\s\n\-/]+'));
    if (parts.length >= 3 && parts[0].length == 4) {
      final m = int.tryParse(parts[1]) ?? 10;
      final d = int.tryParse(parts[2]) ?? 1;
      return (d.toString().padLeft(2, '0'), months[m.clamp(1, 12)]);
    }
    if (parts.length >= 2) {
      final d = parts[0].replaceAll(RegExp(r'\D'), '');
      return (d.isNotEmpty ? d.padLeft(2, '0') : parts[0], parts[1].toUpperCase());
    }
    final digits = trimmed.replaceAll(RegExp(r'\D'), '');
    return (digits.isNotEmpty ? digits.padLeft(2, '0') : (trimmed.isNotEmpty ? trimmed : '01'), 'OKT');
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;
    final (day, month) = _parseDate(item.date, item.scheduledAt);
    final isLive = item.status == 'Sedang Berlangsung';

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E293B) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isLive
                ? (isDark ? AppColors.brand600.withValues(alpha: 0.5) : const Color(0xFF99F6E4))
                : (isDark ? Colors.white10 : const Color(0xFFF1F5F9)),
            width: isLive ? 1.5 : 1,
          ),
          boxShadow: AppColors.shadowCard,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Date block
            Container(
              width: 52,
              height: 56,
              decoration: BoxDecoration(
                color: isDark
                    ? AppColors.brand600.withValues(alpha: 0.15)
                    : const Color(0xFFF0FDFA),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isDark
                      ? AppColors.brand600.withValues(alpha: 0.3)
                      : const Color(0xFFCCFBF1),
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    month,
                    maxLines: 1,
                    style: _pj(
                      10,
                      FontWeight.w800,
                      isDark ? AppColors.brand300 : AppColors.brand600,
                      ls: 0.5,
                    ),
                  ),
                  const SizedBox(height: 1),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      day,
                      maxLines: 1,
                      style: _pj(
                        18,
                        FontWeight.w900,
                        isDark ? Colors.white : AppColors.slate900,
                        height: 1.0,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 14),

            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          item.title,
                          style: _pj(
                            13,
                            FontWeight.w800,
                            isDark ? Colors.white : AppColors.slate900,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: isLive
                              ? (isDark
                                  ? const Color(0xFF047857).withValues(alpha: 0.2)
                                  : const Color(0xFFECFDF5))
                              : (isDark ? Colors.white10 : const Color(0xFFF1F5F9)),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          item.status.isNotEmpty ? item.status : 'Akan Datang',
                          style: _pj(
                            10,
                            FontWeight.w700,
                            isLive
                                ? const Color(0xFF059669)
                                : (isDark ? Colors.white70 : AppColors.slate600),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.access_time_rounded,
                        size: 12,
                        color: isDark ? Colors.white54 : AppColors.slate400,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        item.time,
                        style: _pj(
                          11,
                          FontWeight.w500,
                          isDark ? Colors.white60 : AppColors.slate500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Icon(
                        Icons.location_on_outlined,
                        size: 12,
                        color: isDark ? Colors.white54 : AppColors.slate400,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          item.location,
                          style: _pj(
                            11,
                            FontWeight.w500,
                            isDark ? Colors.white60 : AppColors.slate500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  if (item.picName.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Container(
                          width: 18,
                          height: 18,
                          decoration: BoxDecoration(
                            color: isDark
                                ? AppColors.brand600.withValues(alpha: 0.25)
                                : const Color(0xFFCCFBF1),
                            shape: BoxShape.circle,
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            item.picInitials,
                            style: _pj(8, FontWeight.w800, AppColors.brand700),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'PIC: ${item.picName}',
                          style: _pj(
                            10,
                            FontWeight.w600,
                            isDark ? Colors.white60 : AppColors.slate600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    ).staggeredEntrance(index);
  }
}
