import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:poli_humas/models/notification_item.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/notification_detail_screen.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/widgets/paginated_refresh_list.dart';

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
        title: const Text('Hapus Notifikasi'),
        content: const Text('Yakin ingin menghapus notifikasi ini?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Batal')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Hapus', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      await context.read<AppDataProvider>().deleteNotification(item.id);
    }
    return confirmed == true;
  }

  void _showNotificationMenu(AppNotification item) {
    showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (item.isUnread)
              ListTile(
                leading: const Icon(Icons.mark_email_read_outlined),
                title: const Text('Tandai sudah dibaca'),
                onTap: () async {
                  Navigator.pop(context);
                  await context.read<AppDataProvider>().markNotificationRead(item.id);
                },
              ),
            ListTile(
              leading: const Icon(Icons.delete_outline, color: AppColors.danger),
              title: const Text('Hapus', style: TextStyle(color: AppColors.danger)),
              onTap: () async {
                Navigator.pop(context);
                await _confirmDelete(item);
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppDataProvider>(
      builder: (context, provider, _) {
        final state = provider.notificationsState;
        final grouped = <String, List<AppNotification>>{};
        for (final item in state.items) {
          grouped.putIfAbsent(item.group, () => []).add(item);
        }

        return Scaffold(
          backgroundColor: AppColors.background,
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 0,
            leading: const Padding(
              padding: EdgeInsets.only(left: 12),
              child: Icon(Icons.notifications, color: Color(0xFF3B82F6)),
            ),
            title: const Text(
              'Notifikasi',
              style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800),
            ),
            actions: [
              IconButton(
                onPressed: () => setState(() => _showSearch = !_showSearch),
                icon: Icon(_showSearch ? Icons.close : Icons.search),
              ),
              if (provider.unreadNotificationCount > 0)
                IconButton(
                  onPressed: () => provider.markAllNotificationsRead(),
                  icon: const Icon(Icons.done_all, color: AppColors.primary),
                  tooltip: 'Tandai semua dibaca',
                ),
            ],
          ),
          body: Column(
            children: [
              if (_showSearch)
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                  child: TextField(
                    controller: _searchController,
                    onChanged: _onSearchChanged,
                    autofocus: true,
                    decoration: InputDecoration(
                      hintText: 'Cari notifikasi...',
                      prefixIcon: const Icon(Icons.search),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _filters.map((filter) {
                      final selected = filter == state.filter;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: GestureDetector(
                          onTap: () => _onFilterSelected(filter),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                            decoration: BoxDecoration(
                              color: selected ? const Color(0xFFBFDBFE) : Colors.white,
                              borderRadius: BorderRadius.circular(24),
                            ),
                            child: Text(
                              filter,
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                color: selected ? const Color(0xFF1D4ED8) : AppColors.textPrimary,
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
                  emptyMessage: 'Tidak ada notifikasi.',
                  onRefresh: () => provider.loadNotifications(refresh: true),
                  onLoadMore: () => provider.loadNotifications(loadMore: true),
                  onRetry: () => provider.loadNotifications(refresh: true),
                  separatorBuilder: (context, index) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final item = state.items[index];
                    final showGroupHeader = index == 0 || state.items[index - 1].group != item.group;

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (showGroupHeader) ...[
                          if (index > 0) const SizedBox(height: 8),
                          Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: Text(
                              item.group,
                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
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
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: const Icon(Icons.delete_outline, color: Colors.white),
                          ),
                          confirmDismiss: (_) => _confirmDelete(item),
                          child: _NotificationCard(
                            item: item,
                            onTap: () => _openNotification(item),
                            onLongPress: () => _showNotificationMenu(item),
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

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({
    required this.item,
    required this.onTap,
    required this.onLongPress,
  });

  final AppNotification item;
  final VoidCallback onTap;
  final VoidCallback onLongPress;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      onLongPress: onLongPress,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: item.color.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(item.icon, color: item.color, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.body,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    item.time,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
                  ),
                ],
              ),
            ),
            if (item.isUnread)
              Container(
                width: 10,
                height: 10,
                margin: const EdgeInsets.only(top: 4),
                decoration: const BoxDecoration(
                  color: Color(0xFF3B82F6),
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
      ),
    );
  }
}