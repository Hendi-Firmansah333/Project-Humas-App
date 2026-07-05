import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/widgets/common_widgets.dart';
import 'package:url_launcher/url_launcher.dart';

class AboutAppScreen extends StatefulWidget {
  const AboutAppScreen({super.key});

  @override
  State<AboutAppScreen> createState() => _AboutAppScreenState();
}

class _AboutAppScreenState extends State<AboutAppScreen> {
  String _version = '1.0.0';
  String _buildNumber = '1';

  @override
  void initState() {
    super.initState();
    _loadVersion();
  }

  Future<void> _loadVersion() async {
    final info = await PackageInfo.fromPlatform();
    if (!mounted) return;
    setState(() {
      _version = info.version;
      _buildNumber = info.buildNumber;
    });
  }

  Future<void> _openLink(String url) async {
    final uri = Uri.parse(url);
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
          'Tentang Aplikasi',
          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  const AppLogo(size: 56),
                  const SizedBox(height: 14),
                  const Text(
                    'TIM HUMAS POLINELA',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Versi $_version (Build $_buildNumber)',
                    style: const TextStyle(color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            _section(
              title: 'Deskripsi Aplikasi',
              child: const Text(
                'Aplikasi mobile untuk mendukung operasional Tim Hubungan Masyarakat (HUMAS) Politeknik Negeri Lampung dalam mengelola kegiatan, dokumentasi, content plan, kehadiran, serta monitoring tim secara terintegrasi.',
                style: TextStyle(color: AppColors.textSecondary, height: 1.5),
              ),
            ),
            _section(
              title: 'Tujuan Pengembangan',
              child: const Text(
                'Mempermudah koordinasi tim humas dalam pelaksanaan liputan kegiatan, penjadwalan konten publikasi, absensi berbasis lokasi, dan pelacakan aktivitas anggota tim secara real-time.',
                style: TextStyle(color: AppColors.textSecondary, height: 1.5),
              ),
            ),
            _section(
              title: 'Pengembang',
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Tim Pengembang IT Polinela', style: TextStyle(fontWeight: FontWeight.w600)),
                  SizedBox(height: 4),
                  Text(
                    'Dikembangkan untuk Unit Kerja Humas Politeknik Negeri Lampung',
                    style: TextStyle(color: AppColors.textSecondary, height: 1.4),
                  ),
                ],
              ),
            ),
            _section(
              title: 'Hubungi Kami',
              child: Column(
                children: [
                  _contactTile(
                    icon: Icons.email_outlined,
                    label: 'humas@polinela.ac.id',
                    onTap: () => _openLink('mailto:humas@polinela.ac.id'),
                  ),
                  _contactTile(
                    icon: Icons.language,
                    label: 'www.polinela.ac.id',
                    onTap: () => _openLink('https://www.polinela.ac.id'),
                  ),
                  _contactTile(
                    icon: Icons.phone_outlined,
                    label: '(0721) 123456',
                    onTap: () => _openLink('tel:+62721123456'),
                  ),
                  _contactTile(
                    icon: Icons.camera_alt_outlined,
                    label: '@humaspolinela',
                    onTap: () => _openLink('https://instagram.com/humaspolinela'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              '© 2026 Politeknik Negeri Lampung. All rights reserved.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondary, fontSize: 11),
            ),
          ],
        ),
      ),
    );
  }

  Widget _section({required String title, required Widget child}) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
          const SizedBox(height: 10),
          child,
        ],
      ),
    );
  }

  Widget _contactTile({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon, color: AppColors.primary),
      title: Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
      trailing: const Icon(Icons.open_in_new, size: 18, color: AppColors.textSecondary),
      onTap: onTap,
    );
  }
}