import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:poli_humas/screens/global_search_screen.dart';
import 'package:poli_humas/services/app_navigation_service.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/utils/app_navigator.dart';
import 'package:poli_humas/widgets/logo_painter.dart';

class AppLogo extends StatelessWidget {
  const AppLogo({
    super.key,
    this.size = 36,
    this.showShadow = false,
  });

  final double size;
  final bool showShadow;

  static const assetPath = 'assets/images/logo.png';

  @override
  Widget build(BuildContext context) {
    Widget img = Image.asset(
      assetPath,
      width: size,
      height: size,
      fit: BoxFit.contain,
    );
    if (showShadow) {
      return Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(size * 0.2),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.15),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: img,
      );
    }
    return img;
  }
}

class AppHeader extends StatelessWidget implements PreferredSizeWidget {
  const AppHeader({
    super.key,
    this.title = 'TIM HUMAS POLINELA',
    this.showSearch = true,
    this.leading,
    this.onSearch,
    this.trailing,
  });

  final String title;
  final bool showSearch;
  final Widget? leading;
  final VoidCallback? onSearch;
  final Widget? trailing;

  @override
  Size get preferredSize => const Size.fromHeight(56);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      scrolledUnderElevation: 0,
      leading: leading ??
          Padding(
            padding: const EdgeInsets.only(left: 8),
            child: Center(
              child: GestureDetector(
                onTap: AppNavigationService.instance.goHome,
                child: const AppLogo(),
              ),
            ),
          ),
      leadingWidth: leading != null ? 56 : 48,
      title: Text(
        title,
        style: const TextStyle(
          color: AppColors.primaryDark,
          fontWeight: FontWeight.w800,
          fontSize: 15,
          letterSpacing: 0.3,
        ),
      ),
      centerTitle: true,
      actions: [
        ?trailing,
        if (showSearch)
          IconButton(
            onPressed: onSearch ?? () => pushSmooth(context, const GlobalSearchScreen()),
            icon: const Icon(Icons.search, color: AppColors.textPrimary),
            tooltip: 'Cari',
          ),
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
                  color: isSelected ? AppColors.primary : Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: isSelected ? AppColors.primary : const Color(0xFFE5E7EB),
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
          style: const TextStyle(
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
    (Icons.home_rounded, 'Home'),
    (Icons.assignment_outlined, 'Activities'),
    (Icons.calendar_month_outlined, 'Content'),
    (Icons.notifications_outlined, 'Alerts'),
    (Icons.person_outline, 'Profile'),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: SizedBox(
            height: 56,
            child: Row(
              children: List.generate(_items.length, (index) {
                final (icon, label) = _items[index];
                final selected = index == currentIndex;
                return Expanded(
                  child: _BottomNavItem(
                    icon: icon,
                    label: label,
                    selected: selected,
                    showBadge: index == 3 && unreadCount > 0 && !selected,
                    onTap: () {
                      HapticFeedback.lightImpact();
                      onTap(index);
                    },
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

class _BottomNavItem extends StatelessWidget {
  const _BottomNavItem({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
    this.showBadge = false,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final bool showBadge;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        splashColor: AppColors.primary.withValues(alpha: 0.08),
        highlightColor: AppColors.primary.withValues(alpha: 0.04),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Stack(
            alignment: Alignment.center,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeInOutCubic,
                height: 48,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: selected ? AppColors.tealLight : Colors.transparent,
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: 28,
                    height: 24,
                    child: Stack(
                      clipBehavior: Clip.none,
                      alignment: Alignment.center,
                      children: [
                        Icon(
                          icon,
                          color: selected ? AppColors.primary : AppColors.textSecondary,
                          size: 22,
                        ),
                        if (showBadge)
                          const Positioned(
                            right: 0,
                            top: 0,
                            child: SizedBox(
                              width: 8,
                              height: 8,
                              child: DecoratedBox(
                                decoration: BoxDecoration(
                                  color: AppColors.danger,
                                  shape: BoxShape.circle,
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
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: selected ? AppColors.primary : AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}