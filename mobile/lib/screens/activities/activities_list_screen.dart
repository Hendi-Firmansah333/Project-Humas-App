import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
    final state = context.watch<AppDataProvider>().activitiesState;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppHeader(
        trailing: IconButton(
          onPressed: () => pushSmooth(context, const ActivityHistoryScreen()),
          icon: const Icon(Icons.history, color: AppColors.textPrimary),
        ),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(20, 8, 20, 0),
            child: Text(
              'Kegiatan',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: TextField(
              controller: _searchController,
              onChanged: _onSearchChanged,
              decoration: InputDecoration(
                hintText: 'Cari jadwal liputan, rapat, dll...',
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
          const SizedBox(height: 14),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: FilterChipsRow(
              filters: _filters,
              selected: state.filter,
              onSelected: _onFilterSelected,
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
              emptyMessage: 'Tidak ada kegiatan yang cocok dengan filter.',
              onRefresh: () => context.read<AppDataProvider>().loadActivities(refresh: true),
              onLoadMore: state.hasMore
                  ? () => context.read<AppDataProvider>().loadActivities(loadMore: true)
                  : null,
              onRetry: () => context.read<AppDataProvider>().loadActivities(refresh: true),
              itemBuilder: (context, index) {
                final item = state.items[index];
                return _ActivityCard(
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

class _ActivityCard extends StatelessWidget {
  const _ActivityCard({
    required this.item,
    required this.onTap,
    required this.index,
  });

  final ActivityItem item;
  final VoidCallback onTap;
  final int index;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    item.title,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                  ),
                ),
                if (item.status != 'Sedang Berlangsung') StatusBadge(label: item.status),
                const Icon(Icons.chevron_right, color: AppColors.textSecondary),
              ],
            ),
            if (item.status == 'Sedang Berlangsung') ...[
              const SizedBox(height: 6),
              const StatusBadge(label: 'Sedang Berlangsung'),
            ],
            const SizedBox(height: 8),
            Text(
              item.description,
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.calendar_today, size: 14, color: AppColors.textSecondary),
                const SizedBox(width: 6),
                Text(
                  '${item.date} • ${item.time}',
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.location_on_outlined, size: 14, color: AppColors.textSecondary),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    item.location,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                PicAvatar(initials: item.picInitials),
                const SizedBox(width: 8),
                Text(
                  'PIC: ${item.picName}',
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                ),
              ],
            ),
          ],
        ),
      ),
    ).staggeredEntrance(index);
  }
}