import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:provider/provider.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/activities/activity_history_screen.dart';
import 'package:poli_humas/screens/login_screen.dart';
import 'package:poli_humas/screens/profile/about_app_screen.dart';
import 'package:poli_humas/screens/profile/change_password_screen.dart';
import 'package:poli_humas/screens/profile/edit_profile_screen.dart';
import 'package:poli_humas/screens/profile/settings_screen.dart';
import 'package:poli_humas/services/auth_service.dart';
import 'package:poli_humas/services/user_profile_service.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/utils/app_navigator.dart';
import 'package:poli_humas/widgets/profile_avatar.dart';

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

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String _appVersion = '1.0.0';
  String _buildNumber = '1';

  @override
  void initState() {
    super.initState();
    _loadVersion();
    if (UserProfileService.instance.profile.name.trim().isEmpty) {
      UserProfileService.instance.refreshFromApi();
    }
  }

  Future<void> _loadVersion() async {
    try {
      final info = await PackageInfo.fromPlatform();
      if (!mounted) return;
      setState(() {
        _appVersion = info.version;
        _buildNumber = info.buildNumber;
      });
    } catch (_) {}
  }

  Future<void> _handleLogout(BuildContext context) async {
    final profile = UserProfileService.instance.profile;
    final displayName =
        profile.name.trim().isNotEmpty ? profile.name.trim() : 'Anggota';

    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      barrierColor: const Color(0xFF0B1E33).withValues(alpha: 0.65),
      isScrollControlled: true,
      builder: (sheetCtx) {
        return Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            border: const Border(
              top: BorderSide(color: Color(0xFFDCE9FF), width: 1),
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0B1E33).withValues(alpha: 0.28),
                blurRadius: 32,
                offset: const Offset(0, -8),
              ),
            ],
          ),
          child: SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Drag handle
                  Container(
                    width: 48,
                    height: 6,
                    decoration: BoxDecoration(
                      color: const Color(0xFFC1C7CD).withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(9999),
                    ),
                  ),
                  const SizedBox(height: 22),

                  // Red coral circle icon with halo ring
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEE2E2),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFFEE2E2).withValues(alpha: 0.45),
                          spreadRadius: 8,
                          blurRadius: 0,
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.logout_rounded,
                      color: Color(0xFFEF4444),
                      size: 32,
                    ),
                  ),
                  const SizedBox(height: 22),

                  // Headline
                  Text(
                    'Keluar dari Akun?',
                    textAlign: TextAlign.center,
                    style: _pj(
                      22,
                      FontWeight.w700,
                      const Color(0xFF0B1E33),
                      ls: -0.22,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Description
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: RichText(
                      textAlign: TextAlign.center,
                      text: TextSpan(
                        style: _pj(
                          14,
                          FontWeight.w400,
                          const Color(0xFF41484C),
                          height: 1.6,
                        ),
                        children: [
                          const TextSpan(
                            text: 'Apakah Anda yakin ingin keluar dari akun ',
                          ),
                          TextSpan(
                            text: displayName,
                            style: _pj(
                              14,
                              FontWeight.w600,
                              const Color(0xFF002636),
                            ),
                          ),
                          const TextSpan(
                            text:
                                ' (Tim Humas)? Sesi aktif pada perangkat ini akan diakhiri dan Anda perlu login kembali.',
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),

                  // Cloud safe callout box
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF4FF),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFDCE9FF)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Padding(
                          padding: EdgeInsets.only(top: 2),
                          child: Icon(
                            Icons.cloud_done_outlined,
                            size: 18,
                            color: Color(0xFF006B5F),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Data kegiatan dan draft konten yang tersimpan di cloud tidak akan hilang.',
                            style: _pj(
                              12,
                              FontWeight.w400,
                              const Color(0xFF0B1C30),
                              height: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 22),

                  // Primary Confirm Logout Button
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton.icon(
                      onPressed: () => Navigator.pop(sheetCtx, true),
                      icon: const Icon(Icons.logout_rounded, size: 18),
                      label: Text(
                        'Ya, Keluar Akun',
                        style: _pj(14, FontWeight.w700, Colors.white),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFDC2626),
                        foregroundColor: Colors.white,
                        elevation: 4,
                        shadowColor:
                            const Color(0xFFDC2626).withValues(alpha: 0.35),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Cancel Button
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(sheetCtx, false),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primary,
                        side: BorderSide(
                          color: const Color(0xFFC1C7CD).withValues(alpha: 0.6),
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        'Batal',
                        style: _pj(14, FontWeight.w700, AppColors.primary),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Institutional Footer Note
                  Text(
                    'Politeknik Negeri Lampung • Sistem Hubungan Masyarakat',
                    textAlign: TextAlign.center,
                    style: _pj(
                      10,
                      FontWeight.w700,
                      const Color(0xFF71787D),
                      ls: 0.3,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );

    if (confirmed == true && context.mounted) {
      await AuthService.instance.logoutRemote();
      if (!context.mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (_) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;

    return ListenableBuilder(
      listenable: UserProfileService.instance,
      builder: (context, _) {
        final profile = UserProfileService.instance.profile;

        return Scaffold(
          backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
          body: Column(
            children: [
              // ── Top Header ──
              SafeArea(
                bottom: false,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF0F172A) : Colors.white.withValues(alpha: 0.95),
                    border: Border(
                      bottom: BorderSide(
                        color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
                      ),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const SizedBox(width: 40),
                      Text(
                        'Profil & Akun',
                        style: _pj(
                          16,
                          FontWeight.w800,
                          isDark ? Colors.white : AppColors.slate800,
                        ),
                      ),
                      IconButton(
                        onPressed: () => pushSmooth(context, const SettingsScreen()),
                        icon: Icon(
                          Icons.settings_outlined,
                          color: isDark ? Colors.white70 : AppColors.slate600,
                        ),
                        tooltip: 'Pengaturan',
                      ),
                    ],
                  ),
                ),
              ),

              // ── Scroll Content ──
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(18, 14, 18, 112),
                  child: Column(
                    children: [
                      // ── Hero Profile Card ──
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : Colors.white,
                          borderRadius: BorderRadius.circular(28),
                          border: Border.all(
                            color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
                          ),
                          boxShadow: AppColors.shadowSoft,
                        ),
                        child: Column(
                          children: [
                            // Avatar with gradient ring and verified badge
                            Stack(
                              clipBehavior: Clip.none,
                              children: [
                                Container(
                                  width: 88,
                                  height: 88,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    gradient: const LinearGradient(
                                      colors: [Color(0xFF003D58), Color(0xFF0284C7), Color(0xFF38BDF8)],
                                      begin: Alignment.bottomLeft,
                                      end: Alignment.topRight,
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: AppColors.brand500.withValues(alpha: 0.3),
                                        blurRadius: 14,
                                        offset: const Offset(0, 5),
                                      ),
                                    ],
                                  ),
                                  padding: const EdgeInsets.all(3),
                                  child: Container(
                                    decoration: const BoxDecoration(
                                      color: Colors.white,
                                      shape: BoxShape.circle,
                                    ),
                                    padding: const EdgeInsets.all(2),
                                    child: ClipOval(
                                      child: ProfileAvatar(photoPath: profile.photoPath, radius: 40),
                                    ),
                                  ),
                                ),
                                Positioned(
                                  bottom: 2,
                                  right: 2,
                                  child: Container(
                                    width: 22,
                                    height: 22,
                                    decoration: BoxDecoration(
                                      color: AppColors.brand600,
                                      shape: BoxShape.circle,
                                      border: Border.all(color: Colors.white, width: 2),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withValues(alpha: 0.15),
                                          blurRadius: 4,
                                        ),
                                      ],
                                    ),
                                    child: const Icon(Icons.check_rounded, color: Colors.white, size: 13),
                                  ),
                                ),
                              ],
                            ),

                            const SizedBox(height: 12),

                            // Name
                            Text(
                              profile.name.trim().isNotEmpty
                                  ? profile.name.trim()
                                  : 'Anggota Humas',
                              style: _pj(
                                20,
                                FontWeight.w900,
                                isDark ? Colors.white : AppColors.slate900,
                                ls: -0.3,
                              ),
                            ),

                            const SizedBox(height: 4),

                            // Role Badge
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              decoration: BoxDecoration(
                                color: isDark
                                    ? AppColors.brand600.withValues(alpha: 0.2)
                                    : const Color(0xFFF0FDFA),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: isDark
                                      ? AppColors.brand600.withValues(alpha: 0.4)
                                      : const Color(0xFFCCFBF1),
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.shield_outlined,
                                    size: 13,
                                    color: isDark ? AppColors.brand300 : AppColors.brand700,
                                  ),
                                  const SizedBox(width: 5),
                                  Text(
                                    profile.role.trim().isNotEmpty
                                        ? profile.role.trim()
                                        : 'Anggota Humas',
                                    style: _pj(
                                      11,
                                      FontWeight.w700,
                                      isDark ? AppColors.brand300 : AppColors.brand700,
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            const SizedBox(height: 16),

                            // Quick contacts
                            Container(
                              padding: const EdgeInsets.only(top: 14),
                              decoration: BoxDecoration(
                                border: Border(
                                  top: BorderSide(
                                    color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
                                  ),
                                ),
                              ),
                              child: Column(
                                children: [
                                  _ContactPill(
                                    icon: Icons.phone_rounded,
                                    value: profile.phone.trim().isNotEmpty
                                        ? profile.phone.trim()
                                        : 'Belum ada nomor telepon',
                                  ),
                                  const SizedBox(height: 8),
                                  _ContactPill(
                                    icon: Icons.mail_outline_rounded,
                                    value: profile.email.trim().isNotEmpty
                                        ? profile.email.trim()
                                        : 'Belum ada email',
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // ── Performance Stats Grid ──
                      Consumer<AppDataProvider>(
                        builder: (context, provider, _) {
                          final stats = provider.profileStats;
                          return Row(
                            children: [
                              _StatBox(
                                value: '${stats.totalActivities}',
                                label: 'Jumlah Kegiatan',
                                isHighlight: false,
                              ),
                              const SizedBox(width: 10),
                              _StatBox(
                                value: '${stats.completedContent}',
                                label: 'Konten Selesai',
                                isHighlight: true,
                              ),
                              const SizedBox(width: 10),
                              _StatBox(
                                value: '${stats.attendanceRate}%',
                                label: 'Kehadiran',
                                isHighlight: false,
                              ),
                            ],
                          );
                        },
                      ),

                      const SizedBox(height: 16),

                      // ── Account Settings Navigation List ──
                      Container(
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
                          ),
                          boxShadow: AppColors.shadowSoft,
                        ),
                        child: Column(
                          children: [
                            _SettingsMenuItem(
                              icon: Icons.edit_note_rounded,
                              title: 'Ubah Profil',
                              subtitle: 'Biodata, kontak, dan penugasan',
                              iconBg: isDark ? AppColors.brand600.withValues(alpha: 0.2) : const Color(0xFFF0FDFA),
                              iconColor: AppColors.brand600,
                              onTap: () => pushSmooth(context, const EditProfileScreen()),
                              showDivider: true,
                            ),
                            _SettingsMenuItem(
                              icon: Icons.archive_outlined,
                              title: 'Riwayat & Arsip Dokumen',
                              subtitle: 'Log kehadiran & bukti upload',
                              iconBg: isDark ? AppColors.brand600.withValues(alpha: 0.2) : const Color(0xFFF0FDFA),
                              iconColor: AppColors.brand600,
                              onTap: () => pushSmooth(context, const ActivityHistoryScreen()),
                              showDivider: true,
                            ),
                            _SettingsMenuItem(
                              icon: Icons.lock_outline_rounded,
                              title: 'Ubah Password & Keamanan',
                              subtitle: 'PIN, kata sandi & autentikasi',
                              iconBg: isDark ? Colors.white10 : AppColors.slate100,
                              iconColor: isDark ? Colors.white70 : AppColors.slate600,
                              onTap: () => pushSmooth(context, const ChangePasswordScreen()),
                              showDivider: true,
                            ),
                            _SettingsMenuItem(
                              icon: Icons.info_outline_rounded,
                              title: 'Tentang Aplikasi Tim Humas',
                              subtitle: 'Versi $_appVersion (Build $_buildNumber)',
                              iconBg: isDark ? Colors.white10 : AppColors.slate100,
                              iconColor: isDark ? Colors.white70 : AppColors.slate600,
                              onTap: () => pushSmooth(context, const AboutAppScreen()),
                              showDivider: true,
                            ),
                            _SettingsMenuItem(
                              icon: Icons.logout_rounded,
                              title: 'Keluar Akun',
                              subtitle: 'Selesaikan sesi perangkat ini',
                              iconBg: const Color(0xFFFFF1F2),
                              iconColor: AppColors.rose,
                              titleColor: AppColors.rose,
                              onTap: () => _handleLogout(context),
                              showDivider: false,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ContactPill extends StatelessWidget {
  const _ContactPill({required this.icon, required this.value});
  final IconData icon;
  final String value;

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 15, color: AppColors.brand600),
          const SizedBox(width: 8),
          Text(
            value,
            style: _pj(
              12,
              FontWeight.w600,
              isDark ? Colors.white70 : AppColors.slate700,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatBox extends StatelessWidget {
  const _StatBox({
    required this.value,
    required this.label,
    required this.isHighlight,
  });

  final String value;
  final String label;
  final bool isHighlight;

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;

    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E293B) : Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
          ),
          boxShadow: AppColors.shadowSoft,
        ),
        child: Column(
          children: [
            Text(
              value,
              style: _pj(
                22,
                FontWeight.w900,
                isHighlight
                    ? AppColors.brand600
                    : (isDark ? Colors.white : AppColors.slate900),
                ls: -0.5,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: _pj(
                10,
                FontWeight.w600,
                isDark ? Colors.white54 : AppColors.slate500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SettingsMenuItem extends StatelessWidget {
  const _SettingsMenuItem({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.iconBg,
    required this.iconColor,
    required this.onTap,
    this.titleColor,
    this.showDivider = true,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Color iconBg;
  final Color iconColor;
  final Color? titleColor;
  final VoidCallback onTap;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          onTap();
        },
        borderRadius: BorderRadius.circular(18),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: iconBg,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(icon, color: iconColor, size: 20),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: _pj(
                            13,
                            FontWeight.w700,
                            titleColor ?? (isDark ? Colors.white : AppColors.slate800),
                          ),
                        ),
                        Text(
                          subtitle,
                          style: _pj(
                            11,
                            FontWeight.w400,
                            isDark ? Colors.white54 : AppColors.slate400,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    Icons.arrow_forward_ios_rounded,
                    size: 14,
                    color: titleColor ?? (isDark ? Colors.white30 : AppColors.slate300),
                  ),
                ],
              ),
            ),
            if (showDivider)
              Divider(
                height: 1,
                indent: 68,
                endIndent: 16,
                color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
              ),
          ],
        ),
      ),
    );
  }
}
