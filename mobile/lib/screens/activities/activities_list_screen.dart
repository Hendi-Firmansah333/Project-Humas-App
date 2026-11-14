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
import 'package:poli_humas/screens/activities/activity_history_screen.dart';
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

  // Filter chips untuk tab Daftar Kegiatan
  static const _defaultFilters = [
    'Semua',
    'Sedang Berlangsung',
    'Akan Datang',
    'Selesai',
    'Dibatalkan',
  ];
  static const _allPossibleFilters = _defaultFilters;

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

  void _showFilterModal() {
    final isDark = AppColors.isDark;
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E293B) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
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
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Filter Status Kegiatan',
                    style: _pj(18, FontWeight.w800, isDark ? Colors.white : const Color(0xFF0F172A)),
                  ),
                  if (_selectedFilter != 'Semua')
                    TextButton(
                      onPressed: () {
                        _onFilterSelected('Semua');
                        Navigator.pop(context);
                      },
                      child: Text('Reset', style: _pj(13, FontWeight.w700, AppColors.primary)),
                    ),
                ],
              ),
              const SizedBox(height: 14),
              Wrap(
                spacing: 8,
                runSpacing: 10,
                children: _allPossibleFilters.map((f) {
                  final selected = f == _selectedFilter;
                  return ChoiceChip(
                    label: Text(
                      f,
                      style: _pj(
                        13,
                        selected ? FontWeight.w700 : FontWeight.w500,
                        selected ? Colors.white : (isDark ? Colors.white70 : const Color(0xFF1E293B)),
                      ),
                    ),
                    selected: selected,
                    selectedColor: AppColors.primary,
                    backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                      side: BorderSide(
                        color: selected
                            ? AppColors.primary
                            : (isDark ? Colors.white12 : const Color(0xFFCBD5E1)),
                      ),
                    ),
                    onSelected: (_) {
                      _onFilterSelected(f);
                      Navigator.pop(context);
                    },
                  );
                }).toList(),
              ),
            ],
          ),
        );
      },
    );
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

    // Tentukan daftar chips yang ditampilkan di horizontal list
    final displayedChips = List<String>.from(_defaultFilters);
    if (!displayedChips.contains(_selectedFilter)) {
      displayedChips.add(_selectedFilter);
    }

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── 1. HEADER ATAS ──
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 12, 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Text(
                    'Daftar Kegiatan',
                    style: _pj(
                      22,
                      FontWeight.w800,
                      isDark ? Colors.white : const Color(0xFF0F172A),
                      ls: -0.4,
                    ),
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        onPressed: () {
                          HapticFeedback.lightImpact();
                          pushSmooth(context, const ActivityHistoryScreen());
                        },
                        icon: Icon(
                          Icons.history_rounded,
                          size: 23,
                          color: isDark ? Colors.white : AppColors.primary,
                        ),
                        tooltip: 'Riwayat Kegiatan',
                      ),
                      IconButton(
                        onPressed: _showFilterModal,
                        icon: Icon(
                          Icons.filter_list_rounded,
                          size: 24,
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                        ),
                        tooltip: 'Filter Kegiatan',
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // ── 2. SEARCH BAR KAPSUL (Figma 4383:8186) ──
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
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

            // ── 3. FILTER CHIPS ROW (Figma 4383:8186) ──
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                child: Row(
                  children: displayedChips.map((f) {
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

            // Garis tipis pemisah sesuai Figma
            Divider(
              height: 1,
              thickness: 1,
              color: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
            ),

            // ── 4. DAFTAR KARTU KEGIATAN (Figma 4383:8186) ──
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
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 90),
                separatorBuilder: (context, index) => const SizedBox(height: 14),
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

// ══════════════════════════════════════════════
// KARTU KEGIATAN SESUAI FIGMA NODE 4383:8186
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

  (Color, Color, String) _getStatusConfig(ActivityItem item) {
    final st = item.status.trim();
    if (st == 'Selesai') {
      return (const Color(0xFFDCFCE7), const Color(0xFF15803D), 'Selesai');
    }
    if (st == 'Dibatalkan' || st == 'Ditolak') {
      return (const Color(0xFFF1F5F9), const Color(0xFF64748B), 'Dibatalkan');
    }
    if (st == 'Sedang Berlangsung' || item.hasCheckedIn) {
      return (const Color(0xFFFDEBD0), const Color(0xFF9A4B16), 'Menunggu');
    }
    return (const Color(0xFFE0F2FE), const Color(0xFF0369A1), 'Akan Datang');
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;
    final isCancelled = item.status == 'Dibatalkan' || item.status == 'Ditolak';
    final (statusBg, statusText, statusLabel) = _getStatusConfig(item);
    final formattedDate = _formatIndonesianDate(item.date, item.scheduledAt);

    // Evaluasi status Check-in
    final hasCheckedIn = item.hasCheckedIn || item.checkInStatus == 'Berhasil';
    final isLate = item.checkInStatus == 'Terlambat' || item.checkInState == CheckInState.late;

    // Evaluasi status Dokumentasi
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
                // ── 1. BARIS JUDUL & BADGE STATUS ──
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
                        statusLabel,
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

                // ── 2. BARIS TANGGAL & LOKASI ──
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

                // ── 3. KOTAK STATUS CHECK-IN & DOKUMENTASI (Figma Container #F8FAFC) ──
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
                      // Baris Check-in
                      Row(
                        children: [
                          Icon(
                            isCancelled
                                ? Icons.cancel_outlined
                                : (hasCheckedIn
                                    ? Icons.check_circle_rounded
                                    : (isLate
                                        ? Icons.check_circle_rounded
                                        : Icons.schedule_rounded)),
                            size: 18,
                            color: isCancelled
                                ? const Color(0xFF94A3B8)
                                : (hasCheckedIn
                                    ? AppColors.primary
                                    : (isLate ? const Color(0xFFD97706) : const Color(0xFFD97706))),
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
                                      : (hasCheckedIn
                                          ? 'Berhasil'
                                          : (isLate ? 'Terlambat' : 'Belum Check-in')),
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

                      // Baris Dokumentasi
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

                // ── 4. TOMBOL CTA "LIHAT DETAIL" (Figma 4383:8186) ──
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
