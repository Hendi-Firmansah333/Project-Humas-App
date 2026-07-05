import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:poli_humas/models/activity.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/activities/activity_history_detail_screen.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/widgets/common_widgets.dart';
import 'package:poli_humas/widgets/paginated_refresh_list.dart';

class ActivityHistoryScreen extends StatefulWidget {
  const ActivityHistoryScreen({super.key});

  @override
  State<ActivityHistoryScreen> createState() => _ActivityHistoryScreenState();
}

class _ActivityHistoryScreenState extends State<ActivityHistoryScreen> {
  final _searchController = TextEditingController();
  Timer? _searchDebounce;

  static const _filters = ['Semua', 'Selesai', 'Dibatalkan'];

  @override
  void initState() {
    super.initState();
    final provider = context.read<AppDataProvider>();
    _searchController.text = provider.historyState.searchQuery;
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
      context.read<AppDataProvider>().loadActivityHistory(refresh: true, search: value);
    });
  }

  void _onFilterSelected(String value) {
    context.read<AppDataProvider>().loadActivityHistory(refresh: true, filter: value);
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppDataProvider>().historyState;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Riwayat Kegiatan',
          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800),
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
            child: TextField(
              controller: _searchController,
              onChanged: _onSearchChanged,
              decoration: InputDecoration(
                hintText: 'Cari kegiatan...',
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
              emptyMessage: 'Belum ada riwayat kegiatan.',
              onRefresh: () => context.read<AppDataProvider>().loadActivityHistory(refresh: true),
              onLoadMore: state.hasMore
                  ? () => context.read<AppDataProvider>().loadActivityHistory(loadMore: true)
                  : null,
              onRetry: () => context.read<AppDataProvider>().loadActivityHistory(refresh: true),
              itemBuilder: (context, index) {
                final item = state.items[index];
                return _HistoryCard(item: item);
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _HistoryCard extends StatelessWidget {
  const _HistoryCard({required this.item});

  final ActivityItem item;

  Color _statusColor() {
    switch (item.status) {
      case 'Selesai':
        return AppColors.success;
      case 'Menunggu':
        return AppColors.warning;
      default:
        return const Color(0xFF9CA3AF);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isCancelled = item.status == 'Dibatalkan';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  item.title,
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: _statusColor().withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  item.status,
                  style: TextStyle(color: _statusColor(), fontWeight: FontWeight.w700, fontSize: 11),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.calendar_today, size: 14, color: AppColors.textSecondary),
              const SizedBox(width: 6),
              Text(item.date, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 10),
          _StatusLine(
            text: item.checkInStatus,
            isSuccess: item.checkInStatus.contains('Berhasil'),
            isCancelled: isCancelled,
          ),
          const SizedBox(height: 4),
          _StatusLine(
            text: item.docStatus,
            isSuccess: item.docStatus.contains('Sudah'),
            isWarning: item.docStatus.contains('Belum'),
            isCancelled: isCancelled,
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: isCancelled
                  ? null
                  : () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ActivityHistoryDetailScreen(activity: item),
                        ),
                      ),
              style: ElevatedButton.styleFrom(
                backgroundColor: isCancelled ? const Color(0xFFE5E7EB) : AppColors.primaryDark,
                foregroundColor: isCancelled ? AppColors.textSecondary : Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Lihat Detail', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusLine extends StatelessWidget {
  const _StatusLine({
    required this.text,
    this.isSuccess = false,
    this.isWarning = false,
    this.isCancelled = false,
  });

  final String text;
  final bool isSuccess;
  final bool isWarning;
  final bool isCancelled;

  @override
  Widget build(BuildContext context) {
    if (text.isEmpty) return const SizedBox.shrink();

    IconData icon;
    Color color;
    if (isCancelled) {
      icon = Icons.close;
      color = const Color(0xFF9CA3AF);
    } else if (isSuccess) {
      icon = Icons.check_circle;
      color = AppColors.success;
    } else if (isWarning) {
      icon = Icons.error_outline;
      color = AppColors.danger;
    } else {
      icon = Icons.info_outline;
      color = AppColors.textSecondary;
    }

    return Row(
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 8),
        Expanded(
          child: Text(text, style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.w500)),
        ),
      ],
    );
  }
}