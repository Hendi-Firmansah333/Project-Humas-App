import 'package:flutter/material.dart';
import 'package:poli_humas/theme/rigid_scroll_behavior.dart';
import 'package:poli_humas/widgets/async_states.dart';
import 'package:poli_humas/widgets/shimmer_box.dart';

class PaginatedRefreshList extends StatelessWidget {
  const PaginatedRefreshList({
    super.key,
    required this.itemCount,
    required this.itemBuilder,
    required this.onRefresh,
    this.onLoadMore,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.isRefreshing = false,
    this.error,
    this.emptyMessage,
    this.separatorBuilder,
    this.padding = const EdgeInsets.fromLTRB(20, 4, 20, 20),
    this.onRetry,
    this.useShimmerLoading = true,
  });

  final int itemCount;
  final IndexedWidgetBuilder itemBuilder;
  final Future<void> Function() onRefresh;
  final VoidCallback? onLoadMore;
  final bool isLoading;
  final bool isLoadingMore;
  final bool isRefreshing;
  final String? error;
  final String? emptyMessage;
  final IndexedWidgetBuilder? separatorBuilder;
  final EdgeInsets padding;
  final VoidCallback? onRetry;
  final bool useShimmerLoading;

  @override
  Widget build(BuildContext context) {
    if (isLoading && itemCount == 0) {
      return useShimmerLoading ? const ActivityListShimmer() : const LoadingView();
    }
    if (error != null && itemCount == 0) {
      return ErrorStateView(message: error!, onRetry: onRetry);
    }
    if (!isLoading && itemCount == 0) {
      return RefreshIndicator(
        onRefresh: onRefresh,
        child: ListView(
          physics: appScrollPhysics,
          children: [
            SizedBox(
              height: MediaQuery.sizeOf(context).height * 0.4,
              child: EmptyStateView(message: emptyMessage ?? 'Data tidak ditemukan.'),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: NotificationListener<ScrollNotification>(
        onNotification: (notification) {
          if (notification is ScrollEndNotification &&
              notification.metrics.extentAfter < 120 &&
              onLoadMore != null &&
              !isLoadingMore) {
            onLoadMore!();
          }
          return false;
        },
        child: ListView.separated(
          physics: appScrollPhysics,
          cacheExtent: 400,
          padding: padding,
          itemCount: itemCount + (isLoadingMore ? 1 : 0),
          separatorBuilder: separatorBuilder ?? (context, index) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            if (index >= itemCount) return const ListBottomLoader();
            return RepaintBoundary(child: itemBuilder(context, index));
          },
        ),
      ),
    );
  }
}