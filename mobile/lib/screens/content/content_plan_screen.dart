import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:poli_humas/models/content_plan.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/content/content_plan_detail_screen.dart';
import 'package:poli_humas/screens/global_search_screen.dart';
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

class ContentPlanScreen extends StatefulWidget {
  const ContentPlanScreen({super.key});

  @override
  State<ContentPlanScreen> createState() => _ContentPlanScreenState();
}

class _ContentPlanScreenState extends State<ContentPlanScreen> {
  static const _filters = [
    'Sedang Dikerjakan',
    'Belum Dikerjakan',
    'Selesai',
    'Semua',
  ];

  void _onFilterSelected(String filter) {
    context.read<AppDataProvider>().loadContentPlans(filter: filter, refresh: true);
  }

  void _showNewContentModal() {
    final isDark = AppColors.isDark;
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
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
                  color: isDark ? Colors.white24 : AppColors.slate300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.brand50,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.add_task_rounded, color: AppColors.brand600),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Buat Jadwal Konten',
                      style: _pj(16, FontWeight.w800, isDark ? Colors.white : AppColors.slate900),
                    ),
                    Text(
                      'Pengajuan konten baru ke Koordinator Humas',
                      style: _pj(11, FontWeight.w500, AppColors.slate500),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 18),
            Text(
              'Pengajuan jadwal konten dilakukan melalui portal web internal Humas Polinela atau koordinasi langsung dengan Admin Divisi Liputan & Publikasi.',
              style: _pj(12, FontWeight.w500, isDark ? Colors.white70 : AppColors.slate600, height: 1.5),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.brand600,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                child: Text('Mengerti', style: _pj(13, FontWeight.w800, Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;

    return Consumer<AppDataProvider>(
      builder: (context, provider, _) {
        final state = provider.contentPlansState;
        final inProgressCount = state.items
            .where((item) =>
                item.status == ContentPlanStatus.sedangDikerjakan ||
                item.status == ContentPlanStatus.menungguVerifikasiAdmin ||
                item.status == ContentPlanStatus.menungguPersetujuanKepalaHumas)
            .length;

        return Scaffold(
          backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFB),
          body: Stack(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Top Navigation Header ──
                  SafeArea(
                    bottom: false,
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(18, 10, 18, 10),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 38,
                                height: 38,
                                decoration: BoxDecoration(
                                  color: AppColors.brand600,
                                  borderRadius: BorderRadius.circular(12),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppColors.brand600.withValues(alpha: 0.3),
                                      blurRadius: 8,
                                      offset: const Offset(0, 3),
                                    ),
                                  ],
                                ),
                                child: const Icon(
                                  Icons.campaign_rounded,
                                  color: Colors.white,
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'TIM HUMAS POLINELA',
                                    style: _pj(
                                      12,
                                      FontWeight.w800,
                                      isDark ? Colors.white : AppColors.slate900,
                                      ls: 0.5,
                                    ),
                                  ),
                                  Row(
                                    children: [
                                      Container(
                                        width: 6,
                                        height: 6,
                                        decoration: const BoxDecoration(
                                          color: Color(0xFF10B981),
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                      const SizedBox(width: 5),
                                      Text(
                                        'Divisi Liputan & Publikasi',
                                        style: _pj(
                                          10,
                                          FontWeight.w700,
                                          isDark ? AppColors.brand300 : AppColors.brand700,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ],
                          ),
                          Row(
                            children: [
                              InkWell(
                                onTap: () => pushSmooth(context, const GlobalSearchScreen()),
                                borderRadius: BorderRadius.circular(20),
                                child: Container(
                                  width: 36,
                                  height: 36,
                                  decoration: BoxDecoration(
                                    color: isDark ? const Color(0xFF1E293B) : Colors.white,
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
                                    ),
                                    boxShadow: AppColors.shadowCard,
                                  ),
                                  child: Icon(
                                    Icons.search_rounded,
                                    size: 18,
                                    color: isDark ? Colors.white70 : AppColors.slate600,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              InkWell(
                                onTap: () => _onFilterSelected('Semua'),
                                borderRadius: BorderRadius.circular(20),
                                child: Container(
                                  width: 36,
                                  height: 36,
                                  decoration: BoxDecoration(
                                    color: isDark ? const Color(0xFF1E293B) : Colors.white,
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
                                    ),
                                    boxShadow: AppColors.shadowCard,
                                  ),
                                  child: Icon(
                                    Icons.tune_rounded,
                                    size: 18,
                                    color: isDark ? Colors.white70 : AppColors.slate600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),

                  // ── Title & Subtitle ──
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 4),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Content Plan',
                          style: _pj(
                            24,
                            FontWeight.w900,
                            isDark ? Colors.white : AppColors.slate900,
                            ls: -0.5,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Kelola jadwal liputan & status publikasi sosial media',
                          style: _pj(
                            12,
                            FontWeight.w500,
                            isDark ? Colors.white60 : AppColors.slate500,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // ── Filter Tabs ──
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Row(
                        children: _filters.map((filter) {
                          final selected = filter == state.filter;
                          final showCount = filter == 'Sedang Dikerjakan' && inProgressCount > 0;
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
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      filter,
                                      style: _pj(
                                        12,
                                        selected ? FontWeight.w800 : FontWeight.w600,
                                        selected
                                            ? Colors.white
                                            : (isDark ? Colors.white70 : AppColors.slate600),
                                      ),
                                    ),
                                    if (showCount) ...[
                                      const SizedBox(width: 6),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 6,
                                          vertical: 1,
                                        ),
                                        decoration: BoxDecoration(
                                          color: Colors.white.withValues(alpha: 0.25),
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: Text(
                                          '$inProgressCount',
                                          style: _pj(10, FontWeight.w800, Colors.white),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),

                  // ── Content Card List ──
                  Expanded(
                    child: PaginatedRefreshList(
                      itemCount: state.items.length,
                      isLoading: state.isLoading,
                      isLoadingMore: state.isLoadingMore,
                      isRefreshing: state.isRefreshing,
                      error: state.error,
                      emptyMessage: 'Tidak ada content plan pada filter ini.',
                      onRefresh: () => provider.loadContentPlans(refresh: true),
                      onLoadMore: () => provider.loadContentPlans(loadMore: true),
                      onRetry: () => provider.loadContentPlans(refresh: true),
                      padding: const EdgeInsets.fromLTRB(18, 6, 18, 90),
                      separatorBuilder: (context, index) => const SizedBox(height: 14),
                      itemBuilder: (context, index) {
                        final item = state.items[index];
                        return _RedesignedContentCard(
                          item: item,
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

              // ── Floating Action Button (New Content) ──
              Positioned(
                right: 20,
                bottom: 24,
                child: FloatingActionButton(
                  onPressed: _showNewContentModal,
                  backgroundColor: AppColors.brand600,
                  foregroundColor: Colors.white,
                  elevation: 6,
                  shape: const CircleBorder(),
                  child: const Icon(Icons.add_rounded, size: 28),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _RedesignedContentCard extends StatelessWidget {
  const _RedesignedContentCard({
    required this.item,
    required this.onTap,
  });

  final ContentPlanItem item;
  final VoidCallback onTap;

  (Color, Color, String) _statusStyle(ContentPlanStatus status) {
    switch (status) {
      case ContentPlanStatus.sedangDikerjakan:
        return (const Color(0xFFFFFBEB), const Color(0xFFB45309), 'In Progress');
      case ContentPlanStatus.menungguVerifikasiAdmin:
      case ContentPlanStatus.menungguPersetujuanKepalaHumas:
        return (const Color(0xFFEFF6FF), const Color(0xFF1D4ED8), 'Siap Review');
      case ContentPlanStatus.disetujui:
      case ContentPlanStatus.selesai:
        return (const Color(0xFFECFDF5), const Color(0xFF047857), 'Selesai');
      case ContentPlanStatus.perluRevisi:
        return (const Color(0xFFFFF7ED), const Color(0xFFC2410C), 'Perlu Revisi');
      case ContentPlanStatus.ditolak:
        return (const Color(0xFFFFF1F2), const Color(0xFFBE123C), 'Ditolak');
      case ContentPlanStatus.belumDikerjakan:
        return (const Color(0xFFF1F5F9), const Color(0xFF475569), 'Ditugaskan');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;
    final (statusBg, statusColor, statusText) = _statusStyle(item.status);
    final isUrgent = item.deadline.toLowerCase().contains('hari ini') ||
        item.deadlineLabel.toLowerCase().contains('hari ini');

    // Extract initials from PIC
    final picInitials = item.pic.isNotEmpty
        ? item.pic
            .split(' ')
            .take(2)
            .map((e) => e.isNotEmpty ? e[0] : '')
            .join()
            .toUpperCase()
        : 'KA';

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E293B) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
          ),
          boxShadow: AppColors.shadowSoft,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Accent Bar
              Container(
                height: 4,
                width: double.infinity,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.brand500, Color(0xFF2DD4BF)],
                  ),
                ),
              ),

              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Badges row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Wrap(
                            spacing: 6,
                            runSpacing: 4,
                            children: item.tags.take(2).map((tag) {
                              final isVideo = tag.toLowerCase().contains('video') ||
                                  tag.toLowerCase().contains('reels');
                              return Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: isVideo
                                      ? (isDark
                                          ? const Color(0xFF0891B2).withValues(alpha: 0.2)
                                          : const Color(0xFFECFEFF))
                                      : (isDark
                                          ? const Color(0xFF7C3AED).withValues(alpha: 0.2)
                                          : const Color(0xFFF5F3FF)),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(
                                    color: isVideo
                                        ? const Color(0xFF67E8F9).withValues(alpha: 0.5)
                                        : const Color(0xFFDDD6FE).withValues(alpha: 0.5),
                                  ),
                                ),
                                child: Text(
                                  tag,
                                  style: _pj(
                                    10,
                                    FontWeight.w700,
                                    isVideo
                                        ? (isDark ? const Color(0xFF67E8F9) : const Color(0xFF0E7490))
                                        : (isDark ? const Color(0xFFC4B5FD) : const Color(0xFF6D28D9)),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: isDark ? statusColor.withValues(alpha: 0.2) : statusBg,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 6,
                                height: 6,
                                decoration: BoxDecoration(
                                  color: statusColor,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                statusText,
                                style: _pj(10, FontWeight.w800, statusColor),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 10),

                    // Title
                    Text(
                      item.title,
                      style: _pj(
                        14,
                        FontWeight.w800,
                        isDark ? Colors.white : AppColors.slate900,
                        height: 1.3,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),

                    const SizedBox(height: 4),

                    // Description
                    Text(
                      item.description,
                      style: _pj(
                        12,
                        FontWeight.w400,
                        isDark ? Colors.white60 : AppColors.slate500,
                        height: 1.4,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),

                    const SizedBox(height: 12),

                    const Divider(height: 1, color: Color(0xFFF1F5F9)),

                    const SizedBox(height: 10),

                    // Meta: Deadline & PIC
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: isUrgent
                                ? (isDark
                                    ? AppColors.rose.withValues(alpha: 0.2)
                                    : const Color(0xFFFFF1F2))
                                : (isDark ? Colors.white10 : AppColors.slate100),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.access_time_filled_rounded,
                                size: 12,
                                color: isUrgent
                                    ? AppColors.rose
                                    : (isDark ? Colors.white60 : AppColors.slate500),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                item.deadlineLabel.isNotEmpty ? item.deadlineLabel : item.deadline,
                                style: _pj(
                                  11,
                                  FontWeight.w700,
                                  isUrgent
                                      ? AppColors.rose
                                      : (isDark ? Colors.white70 : AppColors.slate700),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Row(
                          children: [
                            Container(
                              width: 22,
                              height: 22,
                              decoration: BoxDecoration(
                                color: isDark
                                    ? AppColors.brand600.withValues(alpha: 0.25)
                                    : const Color(0xFFCCFBF1),
                                shape: BoxShape.circle,
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                picInitials,
                                style: _pj(9, FontWeight.w800, AppColors.brand700),
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              item.pic.isNotEmpty ? item.pic : 'Komang Ari',
                              style: _pj(
                                11,
                                FontWeight.w600,
                                isDark ? Colors.white70 : AppColors.slate700,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // Action buttons
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: onTap,
                            style: OutlinedButton.styleFrom(
                              backgroundColor: isDark ? Colors.white10 : AppColors.slate100,
                              foregroundColor: isDark ? Colors.white : AppColors.slate700,
                              side: BorderSide.none,
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.description_outlined, size: 14),
                                const SizedBox(width: 4),
                                Text('Detail Brief', style: _pj(11, FontWeight.w700, isDark ? Colors.white : AppColors.slate700)),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: onTap,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: isDark
                                  ? AppColors.brand600.withValues(alpha: 0.25)
                                  : const Color(0xFFF0FDFA),
                              foregroundColor: isDark ? AppColors.brand300 : AppColors.brand700,
                              side: BorderSide(
                                color: isDark
                                    ? AppColors.brand600.withValues(alpha: 0.5)
                                    : const Color(0xFF99F6E4),
                              ),
                              elevation: 0,
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.file_upload_outlined, size: 14),
                                const SizedBox(width: 4),
                                Text('Kirim Bukti', style: _pj(11, FontWeight.w800, isDark ? AppColors.brand300 : AppColors.brand700)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
