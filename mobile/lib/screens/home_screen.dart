import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:poli_humas/animations/app_animations.dart';
import 'package:poli_humas/models/activity.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/activities/activity_detail_screen.dart';
import 'package:poli_humas/screens/activities/checkin_screen.dart';
import 'package:poli_humas/screens/activities/activity_history_screen.dart';
import 'package:poli_humas/screens/live_location_screen.dart';
import 'package:poli_humas/services/user_profile_service.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/theme/rigid_scroll_behavior.dart';
import 'package:poli_humas/utils/app_navigator.dart';
import 'package:poli_humas/widgets/async_states.dart';
import 'package:poli_humas/widgets/common_widgets.dart';
import 'package:poli_humas/widgets/profile_avatar.dart';
import 'package:provider/provider.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key, required this.onNavigate});

  final ValueChanged<int> onNavigate;

  Color _checkInColor(CheckInState state) {
    switch (state) {
      case CheckInState.checkedIn:
        return AppColors.success;
      case CheckInState.late:
        return AppColors.warning;
      case CheckInState.missed:
      case CheckInState.none:
        return AppColors.danger;
    }
  }

  IconData _checkInIcon(CheckInState state) {
    switch (state) {
      case CheckInState.checkedIn:
        return Icons.check_circle;
      case CheckInState.late:
        return Icons.schedule;
      case CheckInState.missed:
      case CheckInState.none:
        return Icons.cancel_outlined;
    }
  }

  void _openTodaySchedule(BuildContext context, ActivityItem? schedule) {
    if (schedule == null) {
      onNavigate(1);
      return;
    }
    pushSmooth(context, ActivityDetailScreen(activity: schedule));
  }

  void _openTodayStatus(BuildContext context, AppDataProvider provider) {
    final schedule = provider.todaySchedule;
    if (schedule == null) {
      onNavigate(1);
      return;
    }
    if (schedule.hasCheckedIn) {
      _openTodaySchedule(context, schedule);
      return;
    }
    pushSmooth(context, CheckinScreen(activity: schedule));
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: UserProfileService.instance,
      builder: (context, _) {
        final profile = UserProfileService.instance.profile;

        return Consumer<AppDataProvider>(
          builder: (context, provider, _) {
            final checkInColor = _checkInColor(provider.todayCheckInState);
            final checkInIcon = _checkInIcon(provider.todayCheckInState);

            return Scaffold(
              backgroundColor: AppColors.background,
              appBar: const AppHeader(),
              body: Column(
                children: [
                  OfflineBanner(isOffline: provider.isOffline),
                  Expanded(
                    child: RefreshIndicator(
                      onRefresh: provider.refreshAll,
                      color: AppColors.primary,
                      child: SingleChildScrollView(
                        physics: appScrollPhysics,
                        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Halo,',
                                        style: TextStyle(color: AppColors.textSecondary, fontSize: 15),
                                      ),
                                      Text(
                                        profile.name,
                                        style: const TextStyle(
                                          fontSize: 26,
                                          fontWeight: FontWeight.w800,
                                          color: AppColors.primaryDark,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                ProfileAvatar(photoPath: profile.photoPath, radius: 28),
                              ],
                            ).staggeredEntrance(0),
                            const SizedBox(height: 20),
                            _TappableHomeCard(
                              onTap: () => _openTodayStatus(context, provider),
                              index: 1,
                              child: Row(
                                children: [
                                  const Text(
                                    'Status hari ini',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                  const Spacer(),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: checkInColor.withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Row(
                                      children: [
                                        Icon(checkInIcon, color: checkInColor, size: 16),
                                        const SizedBox(width: 6),
                                        Text(
                                          provider.todayCheckInLabel,
                                          style: TextStyle(
                                            color: checkInColor,
                                            fontWeight: FontWeight.w700,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  const Icon(Icons.chevron_right, color: AppColors.textSecondary, size: 20),
                                ],
                              ),
                            ),
                            const SizedBox(height: 20),
                            _TodayScheduleCard(
                              schedule: provider.todaySchedule,
                              index: 2,
                              onTap: () => _openTodaySchedule(context, provider.todaySchedule),
                            ),
                            const SizedBox(height: 24),
                            const SectionTitle(title: 'Aksi Cepat').staggeredEntrance(3),
                            const SizedBox(height: 14),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                _QuickAction(
                                  icon: Icons.event_note,
                                  label: 'Kegiatan',
                                  index: 0,
                                  onTap: () => onNavigate(1),
                                ),
                                _QuickAction(
                                  icon: Icons.calendar_month,
                                  label: 'Content Plan',
                                  index: 1,
                                  onTap: () => onNavigate(2),
                                ),
                                _QuickAction(
                                  icon: Icons.location_on_outlined,
                                  label: 'Live Location',
                                  index: 2,
                                  onTap: () => pushSmooth(context, const LiveLocationScreen()),
                                ),
                                _QuickAction(
                                  icon: Icons.campaign_outlined,
                                  label: 'Pengumuman',
                                  index: 3,
                                  onTap: () => onNavigate(3),
                                ),
                              ],
                            ),
                            const SizedBox(height: 24),
                            const SectionTitle(title: 'Humas Lapangan').staggeredEntrance(4),
                            const SizedBox(height: 14),
                            Row(
                              children: [
                                Expanded(
                                  child: _HumasAction(
                                    icon: Icons.history,
                                    label: 'Riwayat Kegiatan',
                                    index: 0,
                                    onTap: () => pushSmooth(context, const ActivityHistoryScreen()),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _HumasAction(
                                    icon: Icons.groups_outlined,
                                    label: 'Tim Lapangan',
                                    index: 1,
                                    onTap: () => pushSmooth(context, const LiveLocationScreen()),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 24),
                            SectionTitle(
                              title: 'Kegiatan Terdekat',
                              action: 'Lihat Semua',
                              onActionTap: () => onNavigate(1),
                            ),
                            const SizedBox(height: 14),
                            if (provider.upcomingActivities.isEmpty)
                              const Text(
                                'Belum ada kegiatan terdekat.',
                                style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                              )
                            else
                              ...provider.upcomingActivities.asMap().entries.map(
                                (entry) => Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: _UpcomingCard(
                                    activity: entry.value,
                                    index: entry.key + 5,
                                    onTap: () => pushSmooth(
                                      context,
                                      ActivityDetailScreen(activity: entry.value),
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

class _TappableHomeCard extends StatelessWidget {
  const _TappableHomeCard({
    required this.onTap,
    required this.child,
    this.border,
    this.index = 0,
  });

  final VoidCallback onTap;
  final Widget child;
  final Border? border;
  final int index;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      elevation: 1,
      shadowColor: Colors.black.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          onTap();
        },
        borderRadius: BorderRadius.circular(16),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: border,
            borderRadius: BorderRadius.circular(16),
          ),
          child: child,
        ),
      ),
    ).staggeredEntrance(index);
  }
}

class _TodayScheduleCard extends StatelessWidget {
  const _TodayScheduleCard({
    required this.schedule,
    required this.onTap,
    this.index = 0,
  });

  final ActivityItem? schedule;
  final VoidCallback onTap;
  final int index;

  @override
  Widget build(BuildContext context) {
    if (schedule == null) {
      return _TappableHomeCard(
        onTap: onTap,
        index: index,
        border: const Border(left: BorderSide(color: AppColors.textSecondary, width: 4)),
        child: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'JADWAL HARI INI',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, letterSpacing: 0.5),
                ),
                Spacer(),
                Icon(Icons.chevron_right, color: AppColors.textSecondary, size: 20),
              ],
            ),
            SizedBox(height: 12),
            Text(
              'Tidak ada jadwal hari ini.',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
            ),
          ],
        ),
      );
    }

    return _TappableHomeCard(
      onTap: onTap,
      index: index,
      border: const Border(left: BorderSide(color: AppColors.success, width: 4)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'JADWAL HARI INI',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, letterSpacing: 0.5),
              ),
              const Spacer(),
              StatusBadge(label: schedule!.status),
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right, color: AppColors.textSecondary, size: 20),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            schedule!.title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
            ),
          ),
          if (schedule!.jobDesk.isNotEmpty) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.assignment_outlined, size: 16, color: AppColors.textSecondary),
                const SizedBox(width: 6),
                Text(
                  'Job Desk: ${schedule!.jobDesk}',
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(Icons.access_time, size: 16, color: AppColors.textSecondary),
              const SizedBox(width: 6),
              Text(schedule!.time, style: const TextStyle(color: AppColors.textSecondary)),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.location_on_outlined, size: 16, color: AppColors.textSecondary),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  schedule!.location,
                  style: const TextStyle(color: AppColors.textSecondary),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.icon,
    required this.label,
    required this.onTap,
    this.index = 0,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final int index;

  @override
  Widget build(BuildContext context) {
    return Animate(
      delay: Duration(milliseconds: index * 60),
      child: GestureDetector(
        onTap: () {
          HapticFeedback.lightImpact();
          onTap();
        },
        child: Column(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: const BoxDecoration(
                color: AppColors.tealLight,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: AppColors.primary),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    )
        .fadeIn(duration: 300.ms, curve: Curves.easeOutCubic)
        .scale(
          begin: const Offset(0.9, 0.9),
          end: const Offset(1, 1),
          curve: Curves.easeOutBack,
        );
  }
}

class _HumasAction extends StatelessWidget {
  const _HumasAction({
    required this.icon,
    required this.label,
    required this.onTap,
    this.index = 0,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final int index;

  @override
  Widget build(BuildContext context) {
    return Animate(
      delay: Duration(milliseconds: index * 80),
      child: RepaintBoundary(
        child: Material(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(14),
          elevation: 1,
          shadowColor: Colors.black12,
          child: InkWell(
            onTap: () {
              HapticFeedback.lightImpact();
              onTap();
            },
            borderRadius: BorderRadius.circular(14),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: const BoxDecoration(
                      color: AppColors.tealLight,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(icon, color: AppColors.primary, size: 20),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      label,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    )
        .fadeIn(duration: 320.ms, curve: Curves.easeOutCubic)
        .slideX(begin: 0.06, curve: Curves.easeOutCubic);
  }
}

class _UpcomingCard extends StatelessWidget {
  const _UpcomingCard({
    required this.activity,
    required this.onTap,
    this.index = 0,
  });

  final ActivityItem activity;
  final VoidCallback onTap;
  final int index;

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 52,
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                activity.date,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    activity.title,
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${activity.time} • ${activity.location}',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                  ),
                  const SizedBox(height: 6),
                  StatusBadge(label: activity.status),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
    ).staggeredEntrance(index);
  }
}