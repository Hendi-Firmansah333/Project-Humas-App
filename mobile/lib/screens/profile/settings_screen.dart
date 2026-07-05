import 'package:flutter/material.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/profile/help_screen.dart';
import 'package:poli_humas/services/app_settings_service.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:provider/provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _settings = AppSettingsService.instance;

  @override
  void initState() {
    super.initState();
    _settings.load();
    _settings.addListener(_onSettingsChanged);
  }

  @override
  void dispose() {
    _settings.removeListener(_onSettingsChanged);
    super.dispose();
  }

  void _onSettingsChanged() => setState(() {});

  Future<void> _confirmReset() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reset Data'),
        content: const Text(
          'Data lokal akan dihapus dan dimuat ulang dari server. Lanjutkan?',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Batal')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Reset', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    await context.read<AppDataProvider>().refreshAll();
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Data berhasil dimuat ulang.'), backgroundColor: AppColors.success),
    );
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
          'Pengaturan',
          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800),
        ),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _sectionTitle('Umum'),
          _SettingsTile(
            icon: Icons.notifications_outlined,
            iconColor: AppColors.primary,
            title: 'Notifikasi',
            subtitle: 'Aktifkan pemberitahuan push',
            trailing: Switch(
              value: _settings.notificationsEnabled,
              activeTrackColor: AppColors.primary,
              onChanged: _settings.setNotifications,
            ),
          ),
          _SettingsTile(
            icon: Icons.location_on_outlined,
            iconColor: AppColors.primary,
            title: 'Lokasi',
            subtitle: 'Izinkan akses lokasi untuk check-in',
            trailing: Switch(
              value: _settings.locationEnabled,
              activeTrackColor: AppColors.primary,
              onChanged: _settings.setLocation,
            ),
          ),
          _SettingsTile(
            icon: Icons.dark_mode_outlined,
            iconColor: AppColors.primary,
            title: 'Mode Gelap',
            subtitle: 'Tema gelap aplikasi',
            trailing: Switch(
              value: _settings.darkModeEnabled,
              activeTrackColor: AppColors.primary,
              onChanged: _settings.setDarkMode,
            ),
          ),
          _SettingsTile(
            icon: Icons.language,
            iconColor: AppColors.primary,
            title: 'Bahasa',
            subtitle: _settings.language,
            onTap: () => _showLanguagePicker(),
          ),
          const SizedBox(height: 20),
          _sectionTitle('Data'),
          _SettingsTile(
            icon: Icons.refresh,
            iconColor: AppColors.warning,
            title: 'Reset Data',
            subtitle: 'Hapus cache lokal dan muat ulang',
            onTap: _confirmReset,
          ),
          const SizedBox(height: 20),
          _sectionTitle('Bantuan'),
          _SettingsTile(
            icon: Icons.help_outline,
            iconColor: AppColors.primary,
            title: 'Pusat Bantuan',
            subtitle: 'FAQ dan kontak tim Humas',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const HelpScreen()),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10, left: 4),
      child: Text(
        title,
        style: const TextStyle(
          fontWeight: FontWeight.w800,
          fontSize: 14,
          color: AppColors.textSecondary,
        ),
      ),
    );
  }

  Future<void> _showLanguagePicker() async {
    const options = ['Indonesia', 'English'];
    await showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text('Pilih Bahasa', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
            ),
            ...options.map(
              (lang) => ListTile(
                title: Text(lang),
                trailing: _settings.language == lang
                    ? const Icon(Icons.check, color: AppColors.primary)
                    : null,
                onTap: () {
                  _settings.setLanguage(lang);
                  Navigator.pop(context);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  const _SettingsTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    this.trailing,
    this.onTap,
  });

  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
      ),
      child: ListTile(
        onTap: onTap,
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: iconColor, size: 22),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
        trailing: trailing ?? const Icon(Icons.chevron_right, color: AppColors.textSecondary),
      ),
    );
  }
}