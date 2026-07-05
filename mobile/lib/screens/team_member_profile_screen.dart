import 'package:flutter/material.dart';
import 'package:poli_humas/models/team_member.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/widgets/common_widgets.dart';
import 'package:url_launcher/url_launcher.dart';

class TeamMemberProfileScreen extends StatelessWidget {
  const TeamMemberProfileScreen({super.key, required this.member});

  final TeamMember member;

  String _lastUpdatedLabel() {
    final updated = member.lastUpdated;
    if (updated == null) return 'Belum ada update';
    final diff = DateTime.now().difference(updated);
    if (diff.inMinutes < 1) return 'Diperbarui baru saja';
    if (diff.inMinutes < 60) return 'Diperbarui ${diff.inMinutes} mnt lalu';
    return 'Diperbarui ${diff.inHours} jam lalu';
  }

  Future<void> _openWhatsApp() async {
    final phone = member.phone?.replaceAll(RegExp(r'[^0-9]'), '') ?? '';
    if (phone.isEmpty) return;
    final uri = Uri.parse('https://wa.me/$phone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
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
          'Profil Anggota',
          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            PicAvatar(initials: member.initials, size: 96),
            const SizedBox(height: 14),
            if (member.isOnDuty)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.tealLight,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(color: AppColors.success, shape: BoxShape.circle),
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      'Sedang Bertugas',
                      style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 12),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 12),
            Text(
              member.name,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
            ),
            Text(
              member.division,
              style: const TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 20),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  const Icon(Icons.check_circle, color: AppColors.success, size: 28),
                  const SizedBox(height: 8),
                  Text(
                    '${member.completedTasks}',
                    style: const TextStyle(
                      fontSize: 36,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primaryDark,
                    ),
                  ),
                  const Text(
                    'TUGAS SELESAI',
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const Align(
              alignment: Alignment.centerLeft,
              child: Text('Informasi Kontak', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
            ),
            const SizedBox(height: 12),
            _InfoCard(
              icon: Icons.phone,
              title: 'WhatsApp',
              value: member.phone ?? '-',
            ),
            const SizedBox(height: 10),
            _InfoCard(
              icon: Icons.location_on_outlined,
              title: 'Lokasi Terakhir',
              value: member.location,
              subtitle: _lastUpdatedLabel(),
            ),
            const SizedBox(height: 20),
            const Align(
              alignment: Alignment.centerLeft,
              child: Text('Riwayat Kegiatan', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
            ),
            const SizedBox(height: 12),
            if (member.activityHistory.isEmpty)
              const Text('Belum ada riwayat kegiatan.', style: TextStyle(color: AppColors.textSecondary))
            else
              ...member.activityHistory.map(
                (record) => Container(
                  width: double.infinity,
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(color: AppColors.success, shape: BoxShape.circle),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(record.title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                            const SizedBox(height: 4),
                            Text(
                              record.dateLocation,
                              style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                      StatusBadge(label: record.status),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: member.phone != null ? _openWhatsApp : null,
                icon: const Icon(Icons.chat, color: Colors.white),
                label: const Text(
                  'Chat WhatsApp',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({
    required this.icon,
    required this.title,
    required this.value,
    this.subtitle,
  });

  final IconData icon;
  final String title;
  final String value;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppColors.primary, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                const SizedBox(height: 2),
                Text(value, style: const TextStyle(fontSize: 13)),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(subtitle!, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}