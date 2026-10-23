import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:poli_humas/models/notification_item.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/notification_detail_screen.dart';
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

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _searchController = TextEditingController();
  bool _showSearch = false;

  static const _filters = ['Semua', 'Belum Dibaca', 'Sudah Dibaca'];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    context.read<AppDataProvider>().loadNotifications(search: value, refresh: true);
  }

  void _onFilterSelected(String filter) {
    context.read<AppDataProvider>().loadNotifications(filter: filter, refresh: true);
  }

  Future<void> _openNotification(AppNotification item) async {
    final provider = context.read<AppDataProvider>();
    if (item.isUnread) {
      await provider.markNotificationRead(item.id);
    }
    if (!mounted) return;
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => NotificationDetailScreen(notification: item)),
    );
  }

  Future<bool> _confirmDelete(AppNotification item) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Hapus Notifikasi', style: _pj(16, FontWeight.w800, AppColors.slate900)),
        content: Text('Yakin ingin menghapus notifikasi ini?', style: _pj(13, FontWeight.w500, AppColors.slate600)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Batal', style: _pj(13, FontWeight.w600, AppColors.slate500)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('Hapus', style: _pj(13, FontWeight.w700, AppColors.danger)),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      await context.read<AppDataProvider>().deleteNotification(item.id);
    }
    return confirmed == true;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;

    return Consumer<AppDataProvider>(
      builder: (context, provider, _) {
        final state = provider.notificationsState;

        return Scaffold(
          backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
          body: Column(
            children: [
              // ── Header ──
              SafeArea(
                bottom: false,
                child: Container(
                  padding: const EdgeInsets.fromLTRB(20, 10, 16, 10),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                    border: Border(
                      bottom: BorderSide(
                        color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
                      ),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              color: isDark
                                  ? AppColors.brand600.withValues(alpha: 0.2)
                                  : const Color(0xFFF0FDFA),
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: isDark
                                    ? AppColors.brand600.withValues(alpha: 0.4)
                                    : const Color(0xFFCCFBF1),
                              ),
                            ),
                            child: const Icon(
                              Icons.notifications_rounded,
                              size: 20,
                              color: AppColors.brand600,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Notifikasi',
                                style: _pj(
                                  18,
                                  FontWeight.w900,
                                  isDark ? Colors.white : AppColors.slate900,
                                  ls: -0.3,
                                ),
                              ),
                              Text(
                                'Tim Humas Polinela',
                                style: _pj(
                                  11,
                                  FontWeight.w600,
                                  isDark ? Colors.white54 : AppColors.slate400,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          InkWell(
                            onTap: () => setState(() => _showSearch = !_showSearch),
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
                                _showSearch ? Icons.close_rounded : Icons.search_rounded,
                                size: 18,
                                color: isDark ? Colors.white70 : AppColors.slate600,
                              ),
                            ),
                          ),
                          if (provider.unreadNotificationCount > 0) ...[
                            const SizedBox(width: 8),
                            InkWell(
                              onTap: () {
                                HapticFeedback.lightImpact();
                                provider.markAllNotificationsRead();
                              },
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
                                child: const Icon(
                                  Icons.done_all_rounded,
                                  size: 18,
                                  color: AppColors.brand600,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              // ── Optional Search Bar ──
              if (_showSearch)
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                  child: TextField(
                    controller: _searchController,
                    onChanged: _onSearchChanged,
                    autofocus: true,
                    style: _pj(13, FontWeight.w600, isDark ? Colors.white : AppColors.slate900),
                    decoration: InputDecoration(
                      hintText: 'Cari notifikasi...',
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

              // ── Filter Tabs ──
              Container(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
                alignment: Alignment.centerLeft,
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _filters.map((filter) {
                      final selected = filter == state.filter;
                      final isUnread = filter == 'Belum Dibaca';
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
                                  ? AppColors.brand500
                                  : (isDark ? const Color(0xFF1E293B) : Colors.white),
                              borderRadius: BorderRadius.circular(24),
                              border: Border.all(
                                color: selected
                                    ? AppColors.brand500
                                    : (isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
                              ),
                              boxShadow: selected
                                  ? [
                                      BoxShadow(
                                        color: AppColors.brand500.withValues(alpha: 0.3),
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
                                if (filter == 'Semua') ...[
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withValues(alpha: 0.25),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Text(
                                      '${state.items.length}',
                                      style: _pj(10, FontWeight.w800, Colors.white),
                                    ),
                                  ),
                                ],
                                if (isUnread && provider.unreadNotificationCount > 0) ...[
                                  const SizedBox(width: 6),
                                  Container(
                                    width: 7,
                                    height: 7,
                                    decoration: const BoxDecoration(
                                      color: Color(0xFFF43F5E),
                                      shape: BoxShape.circle,
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

              // ── Feed List ──
              Expanded(
                child: PaginatedRefreshList(
                  itemCount: state.items.length,
                  isLoading: state.isLoading,
                  isLoadingMore: state.isLoadingMore,
                  isRefreshing: state.isRefreshing,
                  error: state.error,
                  emptyMessage: 'Tidak ada notifikasi.',
                  onRefresh: () => provider.loadNotifications(refresh: true),
                  onLoadMore: () => provider.loadNotifications(loadMore: true),
                  onRetry: () => provider.loadNotifications(refresh: true),
                  padding: const EdgeInsets.fromLTRB(18, 4, 18, 80),
                  separatorBuilder: (context, index) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final item = state.items[index];
                    final showGroupHeader = index == 0 || state.items[index - 1].group != item.group;

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (showGroupHeader) ...[
                          if (index > 0) const SizedBox(height: 16),
                          Padding(
                            padding: const EdgeInsets.fromLTRB(4, 4, 4, 8),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  item.group.toUpperCase(),
                                  style: _pj(
                                    11,
                                    FontWeight.w800,
                                    isDark ? Colors.white54 : AppColors.slate400,
                                    ls: 1.0,
                                  ),
                                ),
                                if (item.group == 'Hari Ini')
                                  GestureDetector(
                                    onTap: () => provider.markAllNotificationsRead(),
                                    child: Text(
                                      'Tandai Dibaca',
                                      style: _pj(
                                        11,
                                        FontWeight.w700,
                                        AppColors.brand600,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ],
                        Dismissible(
                          key: ValueKey(item.id),
                          direction: DismissDirection.endToStart,
                          background: Container(
                            alignment: Alignment.centerRight,
                            padding: const EdgeInsets.only(right: 20),
                            decoration: BoxDecoration(
                              color: AppColors.danger,
                              borderRadius: BorderRadius.circular(18),
                            ),
                            child: const Icon(Icons.delete_outline, color: Colors.white),
                          ),
                          confirmDismiss: (_) => _confirmDelete(item),
                          child: _RedesignedNotificationCard(
                            item: item,
                            onTap: () => _openNotification(item),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _RedesignedNotificationCard extends StatelessWidget {
  const _RedesignedNotificationCard({
    required this.item,
    required this.onTap,
  });

  final AppNotification item;
  final VoidCallback onTap;

  (Color, Color, IconData) _resolveNotificationStyle(NotificationType type) {
    switch (type) {
      case NotificationType.kegiatanBaru:
        return (const Color(0xFFEFF6FF), const Color(0xFF2563EB), Icons.event_available_rounded);
      case NotificationType.deadlineReminder:
        return (const Color(0xFFFFF1F2), const Color(0xFFF43F5E), Icons.alarm_rounded);
      case NotificationType.contentPlanBaru:
        return (const Color(0xFFFAF5FF), const Color(0xFF9333EA), Icons.article_rounded);
      case NotificationType.verifikasi:
        return (const Color(0xFFECFDF5), const Color(0xFF10B981), Icons.verified_rounded);
      case NotificationType.jadwalBerubah:
        return (const Color(0xFFFFFBEB), const Color(0xFFD97706), Icons.sync_rounded);
      case NotificationType.checkInReminder:
        return (const Color(0xFFF0FDFA), const Color(0xFF0D9488), Icons.location_on_rounded);
      case NotificationType.umum:
        return (const Color(0xFFF1F5F9), const Color(0xFF475569), Icons.notifications_rounded);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;
    final (bgColor, iconColor, icon) = _resolveNotificationStyle(item.type);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          onTap();
        },
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E293B) : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: item.isUnread
                  ? (isDark ? AppColors.brand600.withValues(alpha: 0.4) : const Color(0xFFCCFBF1))
                  : (isDark ? Colors.white10 : const Color(0xFFF1F5F9)),
              width: item.isUnread ? 1.5 : 1,
            ),
            boxShadow: AppColors.shadowSoft,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: isDark ? iconColor.withValues(alpha: 0.2) : bgColor,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: iconColor, size: 22),
              ),
              const SizedBox(width: 12),
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
                        Text(
                          item.time,
                          style: _pj(
                            11,
                            FontWeight.w500,
                            isDark ? Colors.white54 : AppColors.slate400,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.body,
                      style: _pj(
                        12,
                        FontWeight.w400,
                        isDark ? Colors.white70 : AppColors.slate600,
                        height: 1.4,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              if (item.isUnread) ...[
                const SizedBox(width: 8),
                Container(
                  width: 9,
                  height: 9,
                  margin: const EdgeInsets.only(top: 4),
                  decoration: BoxDecoration(
                    color: AppColors.brand400,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.brand400.withValues(alpha: 0.5),
                        blurRadius: 4,
                        spreadRadius: 1,
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
