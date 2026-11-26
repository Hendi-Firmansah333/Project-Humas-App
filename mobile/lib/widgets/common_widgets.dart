import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:poli_humas/screens/global_search_screen.dart';
import 'package:poli_humas/services/app_navigation_service.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/utils/app_navigator.dart';
import 'package:poli_humas/utils/translation_helper.dart';

class AppLogo extends StatelessWidget {
  const AppLogo({
    super.key,
    this.size = 36,
    this.showShadow = true,
  });

  final double size;
  final bool showShadow;

  static const assetPath = 'assets/images/logo.png';

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Image.asset(
        assetPath,
        fit: BoxFit.contain,
      ),
    );
  }
}

class AppHeader extends StatelessWidget implements PreferredSizeWidget {
  const AppHeader({
    super.key,
    this.title = 'TIM HUMAS POLINELA',
    this.subtitle,
    this.showSearch = true,
    this.showNotifications = false,
    this.unreadCount = 0,
    this.leading,
    this.onSearch,
    this.onNotifications,
    this.trailing,
  });

  final String title;
  final String? subtitle;
  final bool showSearch;
  final bool showNotifications;
  final int unreadCount;
  final Widget? leading;
  final VoidCallback? onSearch;
  final VoidCallback? onNotifications;
  final Widget? trailing;

  @override
  Size get preferredSize => const Size.fromHeight(56);

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;
    return AppBar(
      backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white.withValues(alpha: 0.98),
      elevation: 0,
      scrolledUnderElevation: 0,
      automaticallyImplyLeading: false,
      titleSpacing: 16,
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(
          color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
          height: 1,
        ),
      ),
      title: leading ??
          GestureDetector(
            onTap: AppNavigationService.instance.goHome,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const AppLogo(size: 32),
                const SizedBox(width: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'TIM HUMAS',
                      style: GoogleFonts.plusJakartaSans(
                        color: isDark ? Colors.white : AppColors.slate900,
                        fontWeight: FontWeight.w800,
                        fontSize: 12.5,
                        letterSpacing: 0.5,
                        height: 1.1,
                      ),
                    ),
                    Text(
                      'Politeknik Negeri Lampung',
                      style: GoogleFonts.plusJakartaSans(
                        color: isDark ? Colors.white60 : AppColors.slate400,
                        fontWeight: FontWeight.w600,
                        fontSize: 10.5,
                        letterSpacing: -0.2,
                        height: 1.1,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
      actions: [
        ?trailing,
        if (showSearch)
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: InkWell(
              onTap: onSearch ?? () => pushSmooth(context, const GlobalSearchScreen()),
              borderRadius: BorderRadius.circular(12),
              child: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
                  ),
                ),
                child: Icon(
                  Icons.search_rounded,
                  color: isDark ? Colors.white70 : AppColors.slate600,
                  size: 19,
                ),
              ),
            ),
          ),
        if (showNotifications)
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: InkWell(
              onTap: onNotifications,
              borderRadius: BorderRadius.circular(12),
              child: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
                  ),
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Icon(
                      Icons.notifications_outlined,
                      color: isDark ? Colors.white70 : AppColors.slate600,
                      size: 19,
                    ),
                    if (unreadCount > 0)
                      Positioned(
                        top: 7,
                        right: 7,
                        child: Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: AppColors.rose,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 1.5),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          )
        else
          const SizedBox(width: 8),
      ],
    );
  }
}

class FilterChipsRow extends StatelessWidget {
  const FilterChipsRow({
    super.key,
    required this.filters,
    required this.selected,
    required this.onSelected,
  });

  final List<String> filters;
  final String selected;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: filters.map((filter) {
          final isSelected = filter == selected;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () {
                HapticFeedback.selectionClick();
                onSelected(filter);
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.primary : AppColors.card,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: isSelected
                        ? AppColors.primary
                        : (AppColors.isDark ? Colors.white12 : const Color(0xFFE5E7EB)),
                  ),
                ),
                child: Text(
                  filter,
                  style: TextStyle(
                    color: isSelected ? Colors.white : AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class StatusBadge extends StatelessWidget {
  const StatusBadge({super.key, required this.label, this.color});

  final String label;
  final Color? color;

  Color _resolveColor() {
    if (color != null) return color!;
    switch (label) {
      case 'Selesai':
      case 'Sudah Check-in':
      case 'In Progress':
        return AppColors.success;
      case 'Menunggu':
        return AppColors.warning;
      case 'Dibatalkan':
        return const Color(0xFF9CA3AF);
      case 'Sedang Berlangsung':
        return AppColors.purple;
      case 'Akan Datang':
        return const Color(0xFF38BDF8);
      case 'Sedang Dikerjakan':
        return AppColors.purple;
      case 'Belum Dikerjakan':
        return AppColors.warning;
      case 'Menunggu Review':
        return AppColors.warning;
      case 'Perlu Revisi':
        return const Color(0xFFF97316);
      case 'Ditolak':
        return AppColors.danger;
      default:
        return AppColors.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final badgeColor = _resolveColor();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: badgeColor.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: badgeColor,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class PicAvatar extends StatelessWidget {
  const PicAvatar({super.key, required this.initials, this.size = 32});

  final String initials;
  final double size;

  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      radius: size / 2,
      backgroundColor: AppColors.primaryLight,
      child: Text(
        initials,
        style: TextStyle(
          color: AppColors.primaryDark,
          fontWeight: FontWeight.w700,
          fontSize: size * 0.35,
        ),
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle({
    super.key,
    required this.title,
    this.action,
    this.onActionTap,
  });

  final String title;
  final String? action;
  final VoidCallback? onActionTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          title,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: AppColors.textPrimary,
          ),
        ),
        const Spacer(),
        if (action != null)
          GestureDetector(
            onTap: onActionTap,
            child: Text(
              action!,
              style: const TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ),
      ],
    );
  }
}

class _NavItemConfig {
  const _NavItemConfig({
    required this.activeIcon,
    required this.inactiveIcon,
    required this.labelKey,
  });

  final IconData activeIcon;
  final IconData inactiveIcon;
  final String labelKey;
}

class AppBottomNav extends StatelessWidget {
  const AppBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
    this.unreadCount = 0,
  });

  final int currentIndex;
  final ValueChanged<int> onTap;
  final int unreadCount;

  static const _items = [
    _NavItemConfig(
      activeIcon: Icons.home_rounded,
      inactiveIcon: Icons.home_rounded,
      labelKey: 'home',
    ),
    _NavItemConfig(
      activeIcon: Icons.assignment_rounded,
      inactiveIcon: Icons.assignment_outlined,
      labelKey: 'activities',
    ),
    _NavItemConfig(
      activeIcon: Icons.calendar_month_rounded,
      inactiveIcon: Icons.calendar_month_outlined,
      labelKey: 'content',
    ),
    _NavItemConfig(
      activeIcon: Icons.history_rounded,
      inactiveIcon: Icons.history_rounded,
      labelKey: 'history',
    ),
    _NavItemConfig(
      activeIcon: Icons.person_rounded,
      inactiveIcon: Icons.person_rounded,
      labelKey: 'profile',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      minimum: const EdgeInsets.fromLTRB(22, 0, 22, 14),
      child: Container(
        height: 62,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: const Color(0xFF012247),
          borderRadius: BorderRadius.circular(100),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.16),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 6,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: Row(
          children: List.generate(_items.length, (index) {
            final item = _items[index];
            final selected = index == currentIndex;
            return Expanded(
              child: _BottomNavItem(
                activeIcon: item.activeIcon,
                inactiveIcon: item.inactiveIcon,
                label: T.t(item.labelKey),
                selected: selected,
                showBadge: false,
                onTap: () {
                  HapticFeedback.lightImpact();
                  onTap(index);
                },
              ),
            );
          }),
        ),
      ),
    );
  }
}

class _BottomNavItem extends StatelessWidget {
  const _BottomNavItem({
    required this.activeIcon,
    required this.inactiveIcon,
    required this.label,
    required this.selected,
    required this.onTap,
    this.showBadge = false,
  });

  final IconData activeIcon;
  final IconData inactiveIcon;
  final String label;
  final bool selected;
  final bool showBadge;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final itemColor = selected ? const Color(0xFF5EEAD4) : const Color(0xFFF1F5F9);

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 26,
              height: 24,
              child: Stack(
                clipBehavior: Clip.none,
                alignment: Alignment.center,
                children: [
                  Icon(
                    selected ? activeIcon : inactiveIcon,
                    color: itemColor,
                    size: 22,
                  ),
                  if (showBadge)
                    Positioned(
                      right: -2,
                      top: -1,
                      child: Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: AppColors.rose,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: const Color(0xFF012247),
                            width: 1.5,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(
                fontSize: 10,
                fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                color: itemColor,
                height: 1.3,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
