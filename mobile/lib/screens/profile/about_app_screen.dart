import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/widgets/common_widgets.dart';
import 'package:url_launcher/url_launcher.dart';

TextStyle _pj(
  double size,
  FontWeight w,
  Color color, {
  double? height,
  double? ls,
}) =>
    GoogleFonts.plusJakartaSans(
      fontSize: size,
      fontWeight: w,
      color: color,
      height: height,
      letterSpacing: ls,
    );

class AboutAppScreen extends StatefulWidget {
  const AboutAppScreen({super.key});

  @override
  State<AboutAppScreen> createState() => _AboutAppScreenState();
}

class _AboutAppScreenState extends State<AboutAppScreen> {
  String _version = '1.0.0';
  bool _checkingUpdate = false;

  @override
  void initState() {
    super.initState();
    _loadVersion();
  }

  Future<void> _loadVersion() async {
    try {
      final info = await PackageInfo.fromPlatform();
      if (!mounted) return;
      setState(() {
        _version = info.version;
      });
    } catch (_) {}
  }

  Future<void> _openLink(String url) async {
    final uri = Uri.tryParse(url);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _checkForUpdates() async {
    if (_checkingUpdate) return;
    HapticFeedback.lightImpact();
    setState(() => _checkingUpdate = true);
    await Future<void>.delayed(const Duration(milliseconds: 650));
    if (!mounted) return;
    setState(() => _checkingUpdate = false);
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(
            'Aplikasi PRIMA sudah versi terkini (v$_version).',
            style: _pj(13, FontWeight.w600, Colors.white),
          ),
          backgroundColor: AppColors.primary,
          behavior: SnackBarBehavior.floating,
        ),
      );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FF),
      body: Column(
        children: [
          // ── TOP APP BAR (Figma 5441:3569) ──
          SafeArea(
            bottom: false,
            child: Container(
              height: 56,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8F9FF).withValues(alpha: 0.94),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 2,
                    offset: const Offset(0, 1),
                  ),
                ],
              ),
              child: Row(
                children: [
                  InkWell(
                    onTap: () => Navigator.pop(context),
                    borderRadius: BorderRadius.circular(9999),
                    child: const SizedBox(
                      width: 40,
                      height: 40,
                      child: Icon(
                        Icons.arrow_back_rounded,
                        color: Color(0xFF002636),
                        size: 20,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Tentang Aplikasi',
                    style: _pj(
                      18,
                      FontWeight.w700,
                      const Color(0xFF002636),
                      ls: -0.45,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── MAIN CONTENT ──
          Expanded(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
              child: Column(
                children: [
                  // ── HERO BRAND CARD (Figma 5441:3502) ──
                  Container(
                    width: double.infinity,
                    clipBehavior: Clip.antiAlias,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFDCE9FF)),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.07),
                          blurRadius: 20,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Stack(
                      children: [
                        // Subtle ambient accents
                        Positioned(
                          right: -40,
                          top: -40,
                          child: Container(
                            width: 140,
                            height: 140,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: const Color(0xFF62FAE3)
                                  .withValues(alpha: 0.16),
                            ),
                          ),
                        ),
                        Positioned(
                          left: -44,
                          bottom: -36,
                          child: Container(
                            width: 120,
                            height: 120,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: const Color(0xFFC2E8FF)
                                  .withValues(alpha: 0.22),
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(20, 26, 20, 24),
                          child: Column(
                            children: [
                              // PRIMA Brand Shield + Verified Micro-Badge
                              SizedBox(
                                width: 84,
                                height: 84,
                                child: Stack(
                                  clipBehavior: Clip.none,
                                  alignment: Alignment.center,
                                  children: [
                                    Container(
                                      width: 80,
                                      height: 80,
                                      padding: const EdgeInsets.all(4),
                                      decoration: BoxDecoration(
                                        color: AppColors.primary,
                                        shape: BoxShape.circle,
                                        boxShadow: [
                                          BoxShadow(
                                            color: const Color(0xFF62FAE3)
                                                .withValues(alpha: 0.4),
                                            spreadRadius: 4,
                                            blurRadius: 0,
                                          ),
                                          BoxShadow(
                                            color: Colors.black
                                                .withValues(alpha: 0.1),
                                            blurRadius: 14,
                                            offset: const Offset(0, 6),
                                          ),
                                        ],
                                      ),
                                      child: Container(
                                        decoration: const BoxDecoration(
                                          color: Colors.white,
                                          shape: BoxShape.circle,
                                        ),
                                        alignment: Alignment.center,
                                        child: const AppLogo(size: 46),
                                      ),
                                    ),
                                    Positioned(
                                      right: 0,
                                      bottom: 0,
                                      child: Container(
                                        width: 24,
                                        height: 24,
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF006B5F),
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: Colors.white,
                                            width: 2,
                                          ),
                                          boxShadow: [
                                            BoxShadow(
                                              color: Colors.black
                                                  .withValues(alpha: 0.12),
                                              blurRadius: 4,
                                              offset: const Offset(0, 2),
                                            ),
                                          ],
                                        ),
                                        child: const Icon(
                                          Icons.verified_rounded,
                                          size: 13,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'Tim Humas Polinela Mobile',
                                textAlign: TextAlign.center,
                                style: _pj(
                                  22,
                                  FontWeight.w700,
                                  const Color(0xFF0B1C30),
                                  ls: -0.5,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Sistem Manajemen Kegiatan & Publikasi Humas',
                                textAlign: TextAlign.center,
                                style: _pj(
                                  12,
                                  FontWeight.w400,
                                  const Color(0xFF41484C),
                                ),
                              ),
                              const SizedBox(height: 16),

                              // Version Pill
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 13,
                                  vertical: 5,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFE5EEFF),
                                  borderRadius: BorderRadius.circular(9999),
                                  border: Border.all(
                                    color: const Color(0xFFDCE9FF),
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.code_rounded,
                                      size: 14,
                                      color: Color(0xFF1E4B61),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      'Versi $_version (Stable Internal Release)',
                                      style: _pj(
                                        11,
                                        FontWeight.w600,
                                        const Color(0xFF1E4B61),
                                        ls: 0.2,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 8),

                              // Up-to-date Status Pill
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 13,
                                  vertical: 5,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF62FAE3)
                                      .withValues(alpha: 0.3),
                                  borderRadius: BorderRadius.circular(9999),
                                  border: Border.all(
                                    color: const Color(0xFF3CDDC7)
                                        .withValues(alpha: 0.4),
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      width: 8,
                                      height: 8,
                                      decoration: const BoxDecoration(
                                        color: Color(0xFF006B5F),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      'Aplikasi Terkini (Up to date)',
                                      style: _pj(
                                        11,
                                        FontWeight.w700,
                                        const Color(0xFF007165),
                                        ls: 0.2,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // ── INSTITUTIONAL DETAILS & PURPOSE CARD (Figma 5441:3522) ──
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFDCE9FF)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.03),
                          blurRadius: 4,
                          offset: const Offset(0, 1),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(
                              Icons.info_rounded,
                              size: 18,
                              color: Color(0xFF006B5F),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Tentang Sistem Internal',
                              style: _pj(
                                14,
                                FontWeight.w600,
                                const Color(0xFF002636),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Aplikasi internal resmi untuk koordinasi liputan, publikasi konten media sosial, absensi kehadiran, dan arsip dokumentasi Politeknik Negeri Lampung. Dirancang untuk mempercepat alur diseminasi informasi publik secara terintegrasi dan akuntabel.',
                          style: _pj(
                            12,
                            FontWeight.w400,
                            const Color(0xFF41484C),
                            height: 1.6,
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Divider(height: 1, color: Color(0xFFEFF4FF)),
                        const SizedBox(height: 14),

                        // Pengelola Resmi
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color: const Color(0xFFE5EEFF),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(
                                Icons.account_balance_rounded,
                                size: 16,
                                color: Color(0xFF002636),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Pengelola Resmi',
                                    style: _pj(
                                      10,
                                      FontWeight.w700,
                                      const Color(0xFF71787D),
                                      ls: 0.3,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Subbagian Humas & Protokoler - Politeknik Negeri Lampung',
                                    style: _pj(
                                      12,
                                      FontWeight.w600,
                                      const Color(0xFF0B1C30),
                                      height: 1.35,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 14),

                        // Kontak Support & Helpdesk IT
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color: const Color(0xFF62FAE3)
                                    .withValues(alpha: 0.4),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(
                                Icons.support_agent_rounded,
                                size: 16,
                                color: Color(0xFF006B5F),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Kontak Support & Helpdesk IT',
                                    style: _pj(
                                      10,
                                      FontWeight.w700,
                                      const Color(0xFF71787D),
                                      ls: 0.3,
                                    ),
                                  ),
                                  const SizedBox(height: 3),
                                  GestureDetector(
                                    onTap: () =>
                                        _openLink('mailto:humas@polinela.ac.id'),
                                    child: Text(
                                      'humas@polinela.ac.id',
                                      style: _pj(
                                        12,
                                        FontWeight.w500,
                                        const Color(0xFF002636),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  GestureDetector(
                                    onTap: () => _openLink('tel:+62721703995'),
                                    child: Text(
                                      'Telp: (0721) 703995',
                                      style: _pj(
                                        12,
                                        FontWeight.w500,
                                        const Color(0xFF41484C),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // ── CHECK FOR UPDATES CTA BUTTON (Figma 5441:3555) ──
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton.icon(
                      onPressed: _checkingUpdate ? null : _checkForUpdates,
                      icon: _checkingUpdate
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.sync_rounded, size: 18),
                      label: Text(
                        _checkingUpdate
                            ? 'Memeriksa Pembaruan...'
                            : 'Periksa Pembaruan Sistem',
                        style: _pj(13, FontWeight.w600, Colors.white, ls: 0.13),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        elevation: 2,
                        shadowColor: Colors.black.withValues(alpha: 0.15),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // ── INSTITUTIONAL FOOTER NOTE ──
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.school_outlined,
                        size: 13,
                        color: Color(0xFF71787D),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Politeknik Negeri Lampung - Kampus Mandiri',
                        style: _pj(
                          10,
                          FontWeight.w700,
                          const Color(0xFF71787D),
                          ls: 0.35,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '© 2026 Politeknik Negeri Lampung. Hak Cipta Dilindungi.',
                    textAlign: TextAlign.center,
                    style: _pj(
                      10,
                      FontWeight.w700,
                      const Color(0xFF71787D),
                      ls: 0.35,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
