import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:poli_humas/models/notification_item.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/activities/activity_detail_screen.dart';
import 'package:poli_humas/screens/content/content_plan_detail_screen.dart';
import 'package:poli_humas/theme/app_colors.dart';

class NotificationDetailScreen extends StatelessWidget {
  const NotificationDetailScreen({super.key, required this.notification});

  final AppNotification notification;

  @override
  Widget build(BuildContext context) {
    final hasRelatedEntity =
        notification.relatedEntityId != null && notification.relatedEntityType != null;

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
          'Detail Notifikasi',
          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            onPressed: () async {
              await context.read<AppDataProvider>().deleteNotification(notification.id);
              if (context.mounted) Navigator.pop(context);
            },
            icon: const Icon(Icons.delete_outline, color: AppColors.danger),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
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
                      Container(
                        width: 52,
                        height: 52,
                        decoration: BoxDecoration(
                          color: notification.color.withValues(alpha: 0.12),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(notification.icon, color: notification.color, size: 26),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              notification.title,
                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              notification.time,
                              style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                      if (notification.isUnread)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFBFDBFE),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            'Baru',
                            style: TextStyle(
                              color: Color(0xFF1D4ED8),
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    notification.body,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 15, height: 1.5),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      notification.group,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            if (hasRelatedEntity) ...[
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => _navigateToRelated(context),
                  icon: const Icon(Icons.open_in_new, color: Colors.white),
                  label: Text(
                    _relatedButtonLabel(),
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _relatedButtonLabel() {
    switch (notification.relatedEntityType) {
      case 'activity':
        return 'Lihat Kegiatan Terkait';
      case 'content_plan':
        return 'Lihat Content Plan Terkait';
      default:
        return 'Lihat Detail Terkait';
    }
  }

  void _navigateToRelated(BuildContext context) {
    final provider = context.read<AppDataProvider>();
    final entityId = notification.relatedEntityId!;

    switch (notification.relatedEntityType) {
      case 'activity':
        final activity = provider.activityById(entityId);
        if (activity == null) {
          _showNotFound(context);
          return;
        }
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => ActivityDetailScreen(activity: activity)),
        );
      case 'content_plan':
        final contentPlan = provider.contentPlanById(entityId);
        if (contentPlan == null) {
          _showNotFound(context);
          return;
        }
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => ContentPlanDetailScreen(item: contentPlan)),
        );
      default:
        _showNotFound(context);
    }
  }

  void _showNotFound(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Data terkait tidak ditemukan.'),
        backgroundColor: AppColors.danger,
      ),
    );
  }
}