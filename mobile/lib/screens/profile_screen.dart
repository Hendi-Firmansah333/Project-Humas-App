import 'package:flutter/material.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/login_screen.dart';
import 'package:poli_humas/screens/profile/about_app_screen.dart';
import 'package:poli_humas/screens/profile/change_password_screen.dart';
import 'package:poli_humas/screens/profile/edit_profile_screen.dart';
import 'package:poli_humas/screens/profile/help_screen.dart';
import 'package:poli_humas/screens/profile/settings_screen.dart';
import 'package:poli_humas/services/auth_service.dart';
import 'package:poli_humas/services/user_profile_service.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/widgets/profile_avatar.dart';
import 'package:provider/provider.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: UserProfileService.instance,
      builder: (context, _) {
        final profile = UserProfileService.instance.profile;

        return Scaffold(
          backgroundColor: AppColors.background,
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 0,
            title: const Text(
              'Profil',
              style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800),
            ),
            centerTitle: true,
          ),
          body: SingleChildScrollView(
            child: Column(
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 28),
                  decoration: const BoxDecoration(
                    color: AppColors.tealLight,
                    borderRadius: BorderRadius.only(
                      bottomLeft: Radius.circular(24),
                      bottomRight: Radius.circular(24),
                    ),
                  ),
                  child: Column(
                    children: [
                      ProfileAvatar(photoPath: profile.photoPath, radius: 48),
                      const SizedBox(height: 14),
                      Text(
                        profile.name,
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
                      ),
                      Text(
                        profile.role,
                        style: const TextStyle(color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 16),
                      _ContactField(icon: Icons.phone, value: profile.phone),
                      const SizedBox(height: 10),
                      _ContactField(icon: Icons.email_outlined, value: profile.email),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      Consumer<AppDataProvider>(
                        builder: (context, provider, _) {
                          final stats = provider.profileStats;
                          return Row(
                            children: [
                              _StatCard(
                                value: '${stats.totalActivities}',
                                label: 'Jumlah Kegiatan',
                              ),
                              const SizedBox(width: 10),
                              _StatCard(
                                value: '${stats.completedContent}',
                                label: 'Konten Selesai',
                              ),
                              const SizedBox(width: 10),
                              _StatCard(
                                value: '${stats.attendanceRate}%',
                                label: 'Kehadiran',
                              ),
                            ],
                          );
                        },
                      ),
                      const SizedBox(height: 20),
                      _MenuTile(
                        icon: Icons.edit_outlined,
                        label: 'Ubah Profil',
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const EditProfileScreen()),
                        ),
                      ),
                      _MenuTile(
                        icon: Icons.lock_outline,
                        label: 'Ubah Password',
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const ChangePasswordScreen()),
                        ),
                      ),
                      _MenuTile(
                        icon: Icons.settings_outlined,
                        label: 'Pengaturan',
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const SettingsScreen()),
                        ),
                      ),
                      _MenuTile(
                        icon: Icons.help_outline,
                        label: 'Bantuan',
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const HelpScreen()),
                        ),
                      ),
                      _MenuTile(
                        icon: Icons.info_outline,
                        label: 'Tentang Aplikasi',
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const AboutAppScreen()),
                        ),
                      ),
                      _MenuTile(
                        icon: Icons.logout,
                        label: 'Keluar',
                        isDanger: true,
                        onTap: () async {
                          await AuthService.instance.logoutRemote();
                          if (!context.mounted) return;
                          Navigator.of(context).pushAndRemoveUntil(
                            MaterialPageRoute(builder: (_) => const LoginScreen()),
                            (_) => false,
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _ContactField extends StatelessWidget {
  const _ContactField({required this.icon, required this.value});

  final IconData icon;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.textSecondary),
          const SizedBox(width: 10),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500))),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 10, color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}

class _MenuTile extends StatelessWidget {
  const _MenuTile({
    required this.icon,
    required this.label,
    this.isDanger = false,
    this.onTap,
  });

  final IconData icon;
  final String label;
  final bool isDanger;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final color = isDanger ? AppColors.danger : AppColors.textPrimary;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        onTap: onTap,
        leading: Icon(icon, color: color),
        title: Text(
          label,
          style: TextStyle(fontWeight: FontWeight.w600, color: color),
        ),
        trailing: Icon(Icons.chevron_right, color: isDanger ? AppColors.danger : AppColors.textSecondary),
      ),
    );
  }
}