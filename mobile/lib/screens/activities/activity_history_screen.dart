import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:poli_humas/animations/app_animations.dart';
import 'package:poli_humas/models/activity.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
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

class ActivityHistoryScreen extends StatefulWidget {
  const ActivityHistoryScreen({super.key});

  @override
  State<ActivityHistoryScreen> createState() => _ActivityHistoryScreenState();
}

class _ActivityHistoryScreenState extends State<ActivityHistoryScreen> {
  final _searchController = TextEditingController();
  Timer? _searchDebounce;

  static const _filters = ['Semua', 'Selesai', 'Dibatalkan'];
  String _selectedFilter = 'Semua';
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    final provider = context.read<AppDataProvider>();
    _searchController.text = provider.historyState.searchQuery;
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

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;
    final state = context.watch<AppDataProvider>().historyState;

    var filteredList = state.items.where((item) {
      if (_selectedFilter == 'Semua') return true;
      if (_selectedFilter == 'Selesai') return item.status == 'Selesai';
      if (_selectedFilter == 'Dibatalkan') return item.status == 'Dibatalkan';
      return item.status.toLowerCase() == _selectedFilter.toLowerCase();
    }).toList();

    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      filteredList = filteredList.where((item) {
        return item.title.toLowerCase().contains(q) ||
            item.location.toLowerCase().contains(q) ||
            item.description.toLowerCase().contains(q);
      }).toList();
    }

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_ios_new_rounded,
            size: 20,
            color: isDark ? Colors.white : const Color(0xFF0F172A),
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Riwayat Kegiatan',
          style: _pj(
            20,
            FontWeight.w800,
            isDark ? Colors.white : const Color(0xFF0F172A),
            ls: -0.4,
          ),
        ),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── SEARCH BAR KAPSUL (Figma 4383:8186) ──
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
            child: Container(
              height: 48,
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : Colors.white,
                borderRadius: BorderRadius.circular(28),
                border: Border.all(
                  color: isDark ? Colors.white12 : const Color(0xFFCBD5E1),
                  width: 1,
                ),
              ),
              child: TextField(
                controller: _searchController,
                onChanged: _onSearchChanged,
                style: _pj(14, FontWeight.w600, isDark ? Colors.white : const Color(0xFF0F172A)),
                decoration: InputDecoration(
                  hintText: 'Cari kegiatan...',
                  hintStyle: _pj(14, FontWeight.w400, const Color(0xFF64748B)),
                  prefixIcon: const Icon(
                    Icons.search_rounded,
                    size: 22,
                    color: Color(0xFF64748B),
                  ),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.close_rounded, size: 18, color: Color(0xFF64748B)),
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
          ),

          const SizedBox(height: 14),

          // ── FILTER CHIPS ROW (Figma 4383:8186) ──
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              child: Row(
                children: _filters.map((f) {
                  final isSelected = f == _selectedFilter;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: GestureDetector(
                      onTap: () => _onFilterSelected(f),
                      behavior: HitTestBehavior.opaque,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        curve: Curves.easeOutCubic,
                        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 9),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.primary
                              : (isDark ? const Color(0xFF1E293B) : Colors.white),
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: isSelected
                                ? AppColors.primary
                                : (isDark ? Colors.white12 : const Color(0xFFCBD5E1)),
                            width: 1,
                          ),
                        ),
                        child: Text(
                          f,
                          style: _pj(
                            13.5,
                            isSelected ? FontWeight.w700 : FontWeight.w500,
                            isSelected
                                ? Colors.white
                                : (isDark ? Colors.white70 : const Color(0xFF1E293B)),
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

          Divider(
            height: 1,
            thickness: 1,
            color: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
          ),

          // ── DAFTAR KARTU KEGIATAN SESUAI FIGMA 4383:8186 ──
          Expanded(
            child: PaginatedRefreshList(
              itemCount: filteredList.length,
              isLoading: state.isLoading && state.items.isEmpty,
              isLoadingMore: state.isLoadingMore,
              isRefreshing: state.isRefreshing,
              error: state.error,
              emptyMessage: _searchQuery.isNotEmpty
                  ? 'Tidak ada kegiatan yang sesuai pencarian.'
                  : 'Belum ada riwayat kegiatan.',
              onRefresh: () => context.read<AppDataProvider>().loadActivityHistory(refresh: true),
              onLoadMore: state.hasMore
                  ? () => context.read<AppDataProvider>().loadActivityHistory(loadMore: true)
                  : null,
              onRetry: () => context.read<AppDataProvider>().loadActivityHistory(refresh: true),
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              separatorBuilder: (context, index) => const SizedBox(height: 14),
              itemBuilder: (context, index) {
                final item = filteredList[index];
                return _FigmaHistoryActivityCard(
                  item: item,
                  index: index,
                  onTap: () {
                    HapticFeedback.lightImpact();
                    pushSmooth(context, ActivityHistoryDetailScreen(activity: item));
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _FigmaHistoryActivityCard extends StatelessWidget {
  const _FigmaHistoryActivityCard({
    required this.item,
    required this.onTap,
    required this.index,
  });

  final ActivityItem item;
  final VoidCallback onTap;
  final int index;

  String _formatIndonesianDate(String raw, [DateTime? scheduledAt]) {
    final months = [
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
      'Desember'
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
      final m = int.tryParse(parts[1]) ?? 5;
      final d = int.tryParse(parts[2]) ?? 1;
      return '$d ${months[m.clamp(1, 12)]} $y';
    }

    return trimmed.isNotEmpty ? trimmed : '24 Mei 2024';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;
    final isCancelled = item.status == 'Dibatalkan' || item.status == 'Ditolak';
    final formattedDate = _formatIndonesianDate(item.date, item.scheduledAt);

    final statusBg = item.status == 'Selesai'
        ? const Color(0xFFDCFCE7)
        : (isCancelled ? const Color(0xFFF1F5F9) : const Color(0xFFFDEBD0));
    final statusText = item.status == 'Selesai'
        ? const Color(0xFF15803D)
        : (isCancelled ? const Color(0xFF64748B) : const Color(0xFF9A4B16));

    final hasCheckedIn = item.hasCheckedIn || item.checkInStatus == 'Berhasil';
    final hasDoc = (item.documentationUrl != null && item.documentationUrl!.isNotEmpty) ||
        item.docStatus == 'Sudah Unggah';

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.05),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── 1. JUDUL & BADGE STATUS ──
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        item.title,
                        style: _pj(
                          16.5,
                          FontWeight.w700,
                          isCancelled
                              ? (isDark ? Colors.white60 : const Color(0xFF334155))
                              : (isDark ? Colors.white : const Color(0xFF0F172A)),
                          height: 1.25,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                      decoration: BoxDecoration(
                        color: isDark ? statusBg.withValues(alpha: 0.25) : statusBg,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        item.status,
                        style: _pj(
                          12,
                          FontWeight.w600,
                          isDark ? Colors.white : statusText,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 8),

                // ── 2. TANGGAL & LOKASI ──
                Row(
                  children: [
                    const Icon(
                      Icons.calendar_today_outlined,
                      size: 14,
                      color: Color(0xFF64748B),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      formattedDate,
                      style: _pj(
                        13,
                        FontWeight.w500,
                        isDark ? Colors.white60 : const Color(0xFF475569),
                      ),
                    ),
                    if (item.location.isNotEmpty) ...[
                      Text(
                        '  •  ',
                        style: _pj(13, FontWeight.w500, const Color(0xFF94A3B8)),
                      ),
                      Expanded(
                        child: Text(
                          item.location,
                          style: _pj(
                            13,
                            FontWeight.w500,
                            isDark ? Colors.white60 : const Color(0xFF475569),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ],
                ),

                const SizedBox(height: 14),

                // ── 3. KOTAK CHECK-IN & DOKUMENTASI ──
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
                      width: 1,
                    ),
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Icon(
                            isCancelled
                                ? Icons.cancel_outlined
                                : (hasCheckedIn
                                    ? Icons.check_circle_rounded
                                    : Icons.schedule_rounded),
                            size: 18,
                            color: isCancelled
                                ? const Color(0xFF94A3B8)
                                : (hasCheckedIn ? AppColors.primary : const Color(0xFFD97706)),
                          ),
                          const SizedBox(width: 8),
                          RichText(
                            text: TextSpan(
                              style: _pj(
                                13,
                                FontWeight.w400,
                                isDark ? Colors.white70 : const Color(0xFF334155),
                              ),
                              children: [
                                const TextSpan(text: 'Check-in: '),
                                TextSpan(
                                  text: isCancelled
                                      ? 'Tidak Check-in'
                                      : (hasCheckedIn ? 'Berhasil' : 'Belum Check-in'),
                                  style: TextStyle(
                                    fontWeight: isCancelled ? FontWeight.w500 : FontWeight.w700,
                                    color: isCancelled
                                        ? const Color(0xFF64748B)
                                        : (hasCheckedIn
                                            ? (isDark ? Colors.white : const Color(0xFF0F172A))
                                            : const Color(0xFFD97706)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(
                            isCancelled
                                ? Icons.cancel_outlined
                                : (hasDoc
                                    ? Icons.cloud_done_rounded
                                    : Icons.error_outline_rounded),
                            size: 18,
                            color: isCancelled
                                ? const Color(0xFF94A3B8)
                                : (hasDoc ? AppColors.primary : const Color(0xFFDC2626)),
                          ),
                          const SizedBox(width: 8),
                          RichText(
                            text: TextSpan(
                              style: _pj(
                                13,
                                FontWeight.w400,
                                isDark ? Colors.white70 : const Color(0xFF334155),
                              ),
                              children: [
                                const TextSpan(text: 'Dokumentasi: '),
                                TextSpan(
                                  text: isCancelled
                                      ? 'Belum Unggah'
                                      : (hasDoc ? 'Sudah Unggah' : 'Belum Unggah'),
                                  style: TextStyle(
                                    fontWeight: isCancelled ? FontWeight.w500 : FontWeight.w700,
                                    color: isCancelled
                                        ? const Color(0xFF64748B)
                                        : (hasDoc
                                            ? (isDark ? Colors.white : const Color(0xFF0F172A))
                                            : const Color(0xFFDC2626)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 14),

                // ── 4. TOMBOL CTA "LIHAT DETAIL" ──
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: ElevatedButton(
                    onPressed: onTap,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isCancelled
                          ? (isDark ? Colors.white10 : const Color(0xFFEEF2F6))
                          : AppColors.primary,
                      foregroundColor: isCancelled
                          ? (isDark ? Colors.white70 : const Color(0xFF475569))
                          : Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      'Lihat Detail',
                      style: _pj(
                        14,
                        isCancelled ? FontWeight.w600 : FontWeight.w700,
                        isCancelled
                            ? (isDark ? Colors.white70 : const Color(0xFF475569))
                            : Colors.white,
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
