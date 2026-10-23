import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
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

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  Future<void> _handleLogout(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Keluar Akun', style: _pj(16, FontWeight.w800, AppColors.slate900)),
        content: Text('Yakin ingin menyelesaikan sesi perangkat ini?', style: _pj(13, FontWeight.w500, AppColors.slate600)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Batal', style: _pj(13, FontWeight.w600, AppColors.slate500)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('Keluar', style: _pj(13, FontWeight.w700, AppColors.rose)),
          ),
        ],
      ),
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
                  padding: const EdgeInsets.fromLTRB(18, 14, 18, 80),
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
                                      colors: [Color(0xFF14B8A6), Color(0xFF2DD4BF), Color(0xFF6EE7B7)],
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
                              profile.name.isNotEmpty ? profile.name : 'Komang Ari',
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
                                    profile.role.isNotEmpty
                                        ? profile.role
                                        : 'Staff Tim Kehumasan Polinela',
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
                                    value: profile.phone.isNotEmpty ? profile.phone : '+62 812-3456-7890',
                                  ),
                                  const SizedBox(height: 8),
                                  _ContactPill(
                                    icon: Icons.mail_outline_rounded,
                                    value: profile.email.isNotEmpty ? profile.email : 'komang@polinela.ac.id',
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
                                value: '${stats.totalActivities > 0 ? stats.totalActivities : 24}',
                                label: 'Jumlah Kegiatan',
                                isHighlight: false,
                              ),
                              const SizedBox(width: 10),
                              _StatBox(
                                value: '${stats.completedContent > 0 ? stats.completedContent : 18}',
                                label: 'Konten Selesai',
                                isHighlight: true,
                              ),
                              const SizedBox(width: 10),
                              _StatBox(
                                value: '${stats.attendanceRate > 0 ? stats.attendanceRate : 95}%',
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
                              subtitle: 'Versi 2.4.0 (Polinela Internal)',
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
