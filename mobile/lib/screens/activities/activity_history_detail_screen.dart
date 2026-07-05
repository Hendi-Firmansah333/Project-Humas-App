import 'dart:io';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:poli_humas/models/activity.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/widgets/common_widgets.dart';
import 'package:poli_humas/widgets/local_image_preview.dart';
import 'package:url_launcher/url_launcher.dart';

class ActivityHistoryDetailScreen extends StatelessWidget {
  const ActivityHistoryDetailScreen({super.key, required this.activity});

  final ActivityItem activity;

  Future<void> _openDocumentation(String? url) async {
    if (url == null || url.isEmpty) return;
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final item =
        context.watch<AppDataProvider>().activityById(activity.id) ?? activity;
    final hasDoc = item.documentationUrl != null && item.documentationUrl!.isNotEmpty;
    final hasSelfie = item.selfiePath != null && item.selfiePath!.isNotEmpty;

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
          'Detail Riwayat',
          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Stack(
                children: [
                  Container(
                    height: 160,
                    width: double.infinity,
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [AppColors.primaryDark, AppColors.primary],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: const Icon(Icons.photo_camera_outlined, color: Colors.white24, size: 64),
                  ),
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        'Dokumentasi',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 11),
                      ),
                    ),
                  ),
                  Positioned(
                    left: 16,
                    right: 16,
                    bottom: 16,
                    child: Text(
                      item.title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 20,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _InfoChip(icon: Icons.calendar_today, label: 'Tanggal', value: item.date)),
                const SizedBox(width: 10),
                Expanded(child: _InfoChip(icon: Icons.location_on_outlined, label: 'Lokasi', value: item.location)),
              ],
            ),
            const SizedBox(height: 20),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle, color: AppColors.success, size: 24),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Status Kehadiran', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                        Text(
                          item.checkInStatus.contains('Berhasil') || item.hasCheckedIn
                              ? 'Hadir • ${item.checkInTime ?? item.time.split(' - ').first}'
                              : item.checkInStatus.replaceFirst('Check-in: ', ''),
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const Text('Foto Bukti Kehadiran', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: hasSelfie
                  ? (!kIsWeb && File(item.selfiePath!).existsSync()
                      ? SizedBox(
                          height: 240,
                          width: double.infinity,
                          child: buildLocalImagePreview(path: item.selfiePath!, fit: BoxFit.cover),
                        )
                      : Container(
                          height: 240,
                          color: AppColors.tealLight,
                          child: const Center(
                            child: Icon(Icons.person, size: 64, color: AppColors.primary),
                          ),
                        ))
                  : Container(
                      height: 240,
                      width: double.infinity,
                      color: AppColors.tealLight,
                      child: const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.image_not_supported_outlined, color: AppColors.textSecondary, size: 40),
                          SizedBox(height: 8),
                          Text('Tidak ada foto bukti', style: TextStyle(color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
            ),
            const SizedBox(height: 20),
            if (item.verificationStatus != null) ...[
              Row(
                children: [
                  const Text('Status Verifikasi', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                  const Spacer(),
                  StatusBadge(label: item.verificationStatus!, color: AppColors.accent),
                ],
              ),
              const SizedBox(height: 16),
            ],
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: hasDoc ? () => _openDocumentation(item.documentationUrl) : null,
                icon: const Icon(Icons.folder_open, color: Colors.white),
                label: const Text(
                  'Buka Dokumentasi',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryDark,
                  disabledBackgroundColor: const Color(0xFFE5E7EB),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),
            if (item.adminNote != null && item.adminNote!.isNotEmpty) ...[
              const SizedBox(height: 24),
              const Text('Catatan Admin', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Text(
                  item.adminNote!,
                  style: const TextStyle(color: AppColors.textSecondary, height: 1.5),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.primary, size: 20),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
        ],
      ),
    );
  }
}