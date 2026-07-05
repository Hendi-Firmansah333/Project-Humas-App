import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:poli_humas/models/content_plan.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/content/content_plan_detail_screen.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/widgets/common_widgets.dart';
import 'package:poli_humas/widgets/paginated_refresh_list.dart';

class ContentPlanScreen extends StatefulWidget {
  const ContentPlanScreen({super.key});

  @override
  State<ContentPlanScreen> createState() => _ContentPlanScreenState();
}

class _ContentPlanScreenState extends State<ContentPlanScreen> {
  static const _filters = [
    'Semua',
    'Belum Dikerjakan',
    'Sedang Dikerjakan',
    'Selesai',
  ];

  void _onFilterSelected(String filter) {
    context.read<AppDataProvider>().loadContentPlans(filter: filter, refresh: true);
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppDataProvider>(
      builder: (context, provider, _) {
        final state = provider.contentPlansState;

        return Scaffold(
          backgroundColor: AppColors.background,
          appBar: const AppHeader(),
          body: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.fromLTRB(20, 8, 20, 0),
                child: Text(
                  'Content Plan',
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800),
                ),
              ),
              const Padding(
                padding: EdgeInsets.fromLTRB(20, 6, 20, 0),
                child: Text(
                  'Lihat pengajuan konten dan status validasi dari Admin.',
                  style: TextStyle(color: AppColors.textSecondary),
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
                  emptyMessage: 'Tidak ada content plan pada filter ini.',
                  onRefresh: () => provider.loadContentPlans(refresh: true),
                  onLoadMore: () => provider.loadContentPlans(loadMore: true),
                  onRetry: () => provider.loadContentPlans(refresh: true),
                  itemBuilder: (context, index) {
                    final item = state.items[index];
                    return _ContentCard(
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
        );
      },
    );
  }
}

class _ContentCard extends StatelessWidget {
  const _ContentCard({required this.item, required this.onTap});

  final ContentPlanItem item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isUrgent = item.deadline.contains('Hari ini');

    return GestureDetector(
      onTap: onTap,
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
              children: [
                ...item.tags.map(
                  (tag) => Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.blueLight,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        tag,
                        style: const TextStyle(
                          color: Color(0xFF0284C7),
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ),
                const Spacer(),
                StatusBadge(label: item.statusLabel),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              item.title,
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
            ),
            const SizedBox(height: 8),
            Text(
              item.description,
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4),
            ),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: item.progress / 100,
                minHeight: 6,
                backgroundColor: const Color(0xFFE5E7EB),
                color: item.progress >= 100 ? AppColors.success : AppColors.primary,
              ),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Text(
                  '${item.progress}% selesai',
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const Spacer(),
                Icon(
                  isUrgent ? Icons.access_time_filled : Icons.calendar_today,
                  size: 14,
                  color: isUrgent ? AppColors.danger : AppColors.textSecondary,
                ),
                const SizedBox(width: 4),
                Text(
                  item.deadline,
                  style: TextStyle(
                    color: isUrgent ? AppColors.danger : AppColors.textSecondary,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}