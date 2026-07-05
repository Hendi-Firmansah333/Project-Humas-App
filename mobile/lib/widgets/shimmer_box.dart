import 'package:flutter/material.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:shimmer/shimmer.dart';

class ShimmerBox extends StatelessWidget {
  const ShimmerBox({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = 8,
  });

  final double width;
  final double height;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.primaryLight.withValues(alpha: 0.35),
      highlightColor: Colors.white,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: AppColors.primaryLight,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }
}

class ActivityListShimmer extends StatelessWidget {
  const ActivityListShimmer({super.key, this.itemCount = 5});

  final int itemCount;

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
      itemCount: itemCount,
      itemBuilder: (context, index) => const Padding(
        padding: EdgeInsets.only(bottom: 12),
        child: _ActivityCardSkeleton(),
      ),
    );
  }
}

class _ActivityCardSkeleton extends StatelessWidget {
  const _ActivityCardSkeleton();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ShimmerBox(width: double.infinity, height: 16),
          SizedBox(height: 10),
          ShimmerBox(width: double.infinity, height: 12),
          SizedBox(height: 6),
          ShimmerBox(width: 200, height: 12),
          SizedBox(height: 12),
          ShimmerBox(width: 140, height: 12),
        ],
      ),
    );
  }
}