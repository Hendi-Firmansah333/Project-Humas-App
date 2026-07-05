import 'package:flutter/material.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/widgets/common_widgets.dart';
import 'package:url_launcher/url_launcher.dart';

class HelpScreen extends StatefulWidget {
  const HelpScreen({super.key});

  @override
  State<HelpScreen> createState() => _HelpScreenState();
}

class _HelpScreenState extends State<HelpScreen> {
  static const _faqs = [
    (
      'Bagaimana cara mendapatkan informasi agenda kampus terbaru?',
      'Buka tab Activities atau Notifikasi. Semua penugasan dan pengumuman terbaru akan muncul di sana secara otomatis.',
    ),
    (
      'Di mana saya bisa melaporkan masalah terkait konten aplikasi?',
      'Hubungi admin melalui WhatsApp atau email resmi Humas yang tersedia di halaman ini.',
    ),
    (
      'Apakah layanan Humas buka setiap hari?',
      'Layanan Humas aktif pada hari kerja (Senin–Jumat) pukul 08:00–16:00 WIB.',
    ),
    (
      'Bagaimana prosedur pengajuan peliputan kegiatan mahasiswa?',
      'Ajukan melalui email humas@polinela.ac.id dengan melampirkan detail kegiatan, jadwal, dan narahubung.',
    ),
  ];

  final Set<int> _expanded = {};

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const AppHeader(
        showSearch: false,
        leading: BackButton(color: AppColors.primary),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.headset_mic, color: Colors.white, size: 36),
            ),
            const SizedBox(height: 16),
            const Text(
              'Pusat Bantuan',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.primaryDark),
            ),
            const SizedBox(height: 8),
            const Text(
              'Temukan jawaban atas pertanyaan umum atau hubungi tim Humas secara langsung.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondary, height: 1.5),
            ),
            const SizedBox(height: 28),
            const Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Hubungi Kami',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
              ),
            ),
            const SizedBox(height: 12),
            _ContactCard(
              icon: Icons.chat,
              iconColor: AppColors.success,
              iconBg: const Color(0xFFDCFCE7),
              title: 'WhatsApp Admin',
              subtitle: 'Respon cepat di jam kerja (08:00 - 16:00)',
              actionLabel: 'Chat Sekarang →',
              onTap: () => _openUrl('https://wa.me/6281234567890'),
            ),
            const SizedBox(height: 10),
            _ContactCard(
              icon: Icons.email_outlined,
              iconColor: AppColors.accent,
              iconBg: AppColors.blueLight,
              title: 'Email Resmi',
              subtitle: 'humas@polinela.ac.id',
              actionLabel: 'Kirim Pesan →',
              onTap: () => _openUrl('mailto:humas@polinela.ac.id'),
            ),
            const SizedBox(height: 28),
            const Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Pertanyaan Umum (FAQ)',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
              ),
            ),
            const SizedBox(height: 12),
            ...List.generate(_faqs.length, (index) {
              final (question, answer) = _faqs[index];
              final expanded = _expanded.contains(index);
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  children: [
                    ListTile(
                      title: Text(
                        question,
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                      ),
                      trailing: Icon(
                        expanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                        color: AppColors.textSecondary,
                      ),
                      onTap: () => setState(() {
                        if (expanded) {
                          _expanded.remove(index);
                        } else {
                          _expanded.add(index);
                        }
                      }),
                    ),
                    if (expanded)
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            answer,
                            style: const TextStyle(color: AppColors.textSecondary, height: 1.5, fontSize: 13),
                          ),
                        ),
                      ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}

class _ContactCard extends StatelessWidget {
  const _ContactCard({
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.title,
    required this.subtitle,
    required this.actionLabel,
    required this.onTap,
  });

  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String title;
  final String subtitle;
  final String actionLabel;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
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
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: iconColor),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                    const SizedBox(height: 2),
                    Text(subtitle, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          GestureDetector(
            onTap: onTap,
            child: Text(
              actionLabel,
              style: const TextStyle(
                color: AppColors.accent,
                fontWeight: FontWeight.w700,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }
}