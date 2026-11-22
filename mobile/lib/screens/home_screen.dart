import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:poli_humas/models/activity.dart';
import 'package:poli_humas/models/duty_schedule.dart';
import 'package:poli_humas/models/team_member.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/activities/activity_detail_screen.dart';
import 'package:poli_humas/screens/activities/checkin_screen.dart';
import 'package:poli_humas/screens/global_search_screen.dart';
import 'package:poli_humas/screens/live_location_screen.dart';
import 'package:poli_humas/services/user_profile_service.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/theme/rigid_scroll_behavior.dart';
import 'package:poli_humas/utils/app_navigator.dart';
import 'package:poli_humas/widgets/async_states.dart';
import 'package:poli_humas/widgets/common_widgets.dart';
import 'package:provider/provider.dart';

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

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key, required this.onNavigate});

  final ValueChanged<int> onNavigate;

  void _openActivityCheckIn(BuildContext context, ActivityItem activity) {
    if (activity.hasCheckedIn) {
      pushSmooth(context, ActivityDetailScreen(activity: activity));
      return;
    }
    pushSmooth(context, CheckinScreen(activity: activity));
  }

  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.of(context).padding.top;

    return ListenableBuilder(
      listenable: UserProfileService.instance,
      builder: (context, _) {
        final profile = UserProfileService.instance.profile;
        return Consumer<AppDataProvider>(
          builder: (context, provider, _) {
            final activeMembers = provider.teamMembers.where((m) => m.isOnDuty).toList();
            final activeTeamCount = activeMembers.length;
            final firstActiveMember = activeMembers.firstOrNull ?? provider.teamMembers.firstOrNull;

            return AnnotatedRegion<SystemUiOverlayStyle>(
              value: SystemUiOverlayStyle.light,
              child: Scaffold(
                backgroundColor: Colors.white,
                body: Column(
                  children: [
                    OfflineBanner(isOffline: provider.isOffline),
                    Expanded(
                      child: RefreshIndicator(
                        onRefresh: provider.refreshAll,
                        color: Colors.white,
                        backgroundColor: AppColors.brand600,
                        displacement: 40,
                        child: SingleChildScrollView(
                          physics: appScrollPhysics,
                          padding: const EdgeInsets.only(bottom: 112),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // ── 1 & 2. CURVED NAVY HEADER + OVERLAPPING SCHEDULE HERO CARD ──
                              Stack(
                                children: [
                                  _CurvedHomeHeaderBackground(topInset: topInset),
                                  Padding(
                                    padding: EdgeInsets.fromLTRB(20, topInset + 14, 20, 0),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        _HomeHeaderTopBar(
                                          unreadCount: provider.unreadNotificationCount,
                                          onSearch: () => pushSmooth(
                                            context,
                                            const GlobalSearchScreen(),
                                          ),
                                          onNotifications: () => onNavigate(3),
                                        ),
                                        const SizedBox(height: 23),
                                        _HomeHeaderGreeting(profile: profile),
                                        const SizedBox(height: 20),
                                        _ActiveScheduleHeroCard(
                                          schedules: provider.activeSchedules,
                                          onTapActivity: (act) => pushSmooth(
                                            context,
                                            ActivityDetailScreen(activity: act),
                                          ),
                                          onTapCheckIn: (act) => _openActivityCheckIn(context, act),
                                          onViewAll: () => onNavigate(1),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(height: 16),

                              // ── 3. LIVE LOCATION TIM WIDGET ──
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 20),
                                child: _LiveLocationPreviewCard(
                                  activeCount: activeTeamCount,
                                  totalCount: provider.teamMembers.length,
                                  member: firstActiveMember,
                                  activeMembers: activeMembers,
                                  currentUserName: profile.name,
                                  currentUserInitials: profile.initials,
                                  onOpenMap: () => pushSmooth(
                                    context,
                                    const LiveLocationScreen(),
                                  ),
                                ),
                              ),

                              if (provider.dutySchedules.isNotEmpty) ...[
                                const SizedBox(height: 18),
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 20),
                                  child: _DutySection(schedules: provider.dutySchedules),
                                ),
                              ],

                              const SizedBox(height: 20),

                              // ── 4. AGENDA MENDATANG (FIGMA #5250:2289) ──
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 20),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      crossAxisAlignment: CrossAxisAlignment.center,
                                      children: [
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                'AGENDA MENDATANG',
                                                style: _pj(
                                                  14,
                                                  FontWeight.w700,
                                                  const Color(0xFF0F172A),
                                                  ls: 0.35,
                                                ),
                                              ),
                                              const SizedBox(height: 2),
                                              Text(
                                                'Jadwal kegiatan publikasi & pers pekan ini',
                                                style: _pj(
                                                  12,
                                                  FontWeight.w500,
                                                  const Color(0xFF64748B),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        GestureDetector(
                                          behavior: HitTestBehavior.opaque,
                                          onTap: () => onNavigate(1),
                                          child: Padding(
                                            padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Text(
                                                  'Lihat Semua',
                                                  style: _pj(
                                                    12,
                                                    FontWeight.w700,
                                                    const Color(0xFF003D58),
                                                  ),
                                                ),
                                                const SizedBox(width: 2),
                                                const Icon(
                                                  Icons.chevron_right_rounded,
                                                  size: 16,
                                                  color: Color(0xFF003D58),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),

                                    if (provider.upcomingActivities.isEmpty)
                                      _EmptyUpcomingCard(
                                        onTapCalendar: () => onNavigate(1),
                                      )
                                    else
                                      ...provider.upcomingActivities.take(3).toList().asMap().entries.map(
                                            (entry) => Padding(
                                              padding: const EdgeInsets.only(bottom: 12),
                                              child: _UpcomingActivityCard(
                                                activity: entry.value,
                                                index: entry.key,
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
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}

// ══════════════════════════════════════════════
// 1. Curved Deep Navy/Teal Header (Figma #5247:2117)
// ══════════════════════════════════════════════
class _CurvedHomeHeaderBackground extends StatelessWidget {
  const _CurvedHomeHeaderBackground({required this.topInset});

  final double topInset;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: topInset + 228,
      child: ClipRRect(
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(70),
          bottomRight: Radius.circular(70),
        ),
        child: Stack(
          children: [
            Container(
              decoration: const BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment(0.75, -0.65),
                  radius: 1.35,
                  colors: [
                    Color(0xFF269EBD),
                    Color(0xFF136C8A),
                    Color(0xFF0A5370),
                    Color(0xFF003A56),
                    Color(0xFF012247),
                  ],
                  stops: [0.0, 0.22, 0.38, 0.58, 1.0],
                ),
              ),
            ),
            // Decorative radar ring 1 (top right inner circle)
            Positioned(
              right: -32,
              top: -48,
              child: Container(
                width: 192,
                height: 192,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.55),
                    width: 1,
                  ),
                ),
              ),
            ),
            // Decorative filled soft circle (bottom left)
            Positioned(
              left: -16,
              bottom: -45,
              child: Container(
                width: 192,
                height: 192,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF0D5580).withValues(alpha: 0.55),
                ),
              ),
            ),
            // Decorative radar ring 2 (large outer circle)
            Positioned(
              right: -128,
              top: -144,
              child: Container(
                width: 384,
                height: 384,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.12),
                    width: 1,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HomeHeaderTopBar extends StatelessWidget {
  const _HomeHeaderTopBar({
    required this.unreadCount,
    required this.onSearch,
    required this.onNotifications,
  });

  final int unreadCount;
  final VoidCallback onSearch;
  final VoidCallback onNotifications;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // Logo & Title
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: const Color(0xFF14B8A6).withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: const Color(0xFF2DD4BF).withValues(alpha: 0.4),
                  width: 1,
                ),
              ),
              alignment: Alignment.center,
              child: const AppLogo(size: 28),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'TIM HUMAS',
                  style: _pj(12, FontWeight.w700, Colors.white, ls: 0.6, height: 1.15),
                ),
                const SizedBox(height: 2),
                Text(
                  'Politeknik Negeri Lampung',
                  style: _pj(11, FontWeight.w500, Colors.white.withValues(alpha: 0.8), height: 1.25),
                ),
              ],
            ),
          ],
        ),

        // Search & Notification Action Buttons
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            InkWell(
              onTap: () {
                HapticFeedback.lightImpact();
                onSearch();
              },
              borderRadius: BorderRadius.circular(9999),
              child: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.10),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.15),
                    width: 1,
                  ),
                ),
                alignment: Alignment.center,
                child: const Icon(
                  Icons.search_rounded,
                  color: Colors.white,
                  size: 17,
                ),
              ),
            ),
            const SizedBox(width: 8),
            InkWell(
              onTap: () {
                HapticFeedback.lightImpact();
                onNotifications();
              },
              borderRadius: BorderRadius.circular(9999),
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.10),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.15),
                        width: 1,
                      ),
                    ),
                    alignment: Alignment.center,
                    child: const Icon(
                      Icons.notifications_none_rounded,
                      color: Colors.white,
                      size: 18,
                    ),
                  ),
                  if (unreadCount > 0)
                    Positioned(
                      top: -6,
                      right: -2,
                      child: Container(
                        constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFF383C),
                          borderRadius: BorderRadius.circular(9999),
                          border: Border.all(color: Colors.white, width: 1),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          unreadCount > 99 ? '99+' : '$unreadCount',
                          style: _pj(10, FontWeight.w700, Colors.white, height: 1.2),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _HomeHeaderGreeting extends StatelessWidget {
  const _HomeHeaderGreeting({required this.profile});

  final dynamic profile;

  @override
  Widget build(BuildContext context) {
    final name = profile.name.isNotEmpty ? profile.name : 'Yuda Pratama, S.I.Kom';
    final role = profile.role.isNotEmpty ? profile.role : 'Staff Dokumentasi & Peliputan Media';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          'Selamat bertugas,',
          style: _pj(
            13,
            FontWeight.w500,
            Colors.white.withValues(alpha: 0.92),
            ls: 0.325,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          name,
          style: _pj(
            20,
            FontWeight.w700,
            Colors.white,
            ls: -0.5,
            height: 1.35,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 2),
        Text(
          role,
          style: _pj(
            12,
            FontWeight.w500,
            Colors.white.withValues(alpha: 0.9),
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }
}

// ══════════════════════════════════════════════
// 2. Active Schedule Hero Card (Figma #5247:2153)
// ══════════════════════════════════════════════
class _ActiveScheduleHeroCard extends StatefulWidget {
  const _ActiveScheduleHeroCard({
    required this.schedules,
    required this.onTapActivity,
    required this.onTapCheckIn,
    required this.onViewAll,
  });

  final List<ActivityItem> schedules;
  final ValueChanged<ActivityItem> onTapActivity;
  final ValueChanged<ActivityItem> onTapCheckIn;
  final VoidCallback onViewAll;

  @override
  State<_ActiveScheduleHeroCard> createState() => _ActiveScheduleHeroCardState();
}

class _ActiveScheduleHeroCardState extends State<_ActiveScheduleHeroCard> {
  late final PageController _pageController;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(
      viewportFraction: widget.schedules.length > 1 ? 0.96 : 1.0,
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  (String, String) _formatScheduleTime(String raw) {
    final cleaned = raw.trim().isEmpty ? '08:00 - 11:30 WIB' : raw.trim();
    final primary = cleaned
        .replaceAll(RegExp(r'\s*WIB\b', caseSensitive: false), '')
        .replaceAll(' - ', ' – ')
        .trim();

    final matches = RegExp(r'(\d{1,2}):(\d{2})').allMatches(cleaned).toList();
    if (matches.length >= 2) {
      final startHour = int.tryParse(matches[0].group(1) ?? '');
      final startMin = int.tryParse(matches[0].group(2) ?? '');
      final endHour = int.tryParse(matches[1].group(1) ?? '');
      final endMin = int.tryParse(matches[1].group(2) ?? '');
      if (startHour != null && startMin != null && endHour != null && endMin != null) {
        final diff = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        if (diff > 0) {
          final hours = diff ~/ 60;
          final mins = diff % 60;
          final durationText = hours > 0 && mins > 0
              ? '$hours jam $mins mnt'
              : (hours > 0 ? '$hours jam' : '$mins mnt');
          return (primary.isNotEmpty ? primary : '08:00 – 11:30', 'WIB • $durationText');
        }
      }
    }

    return (primary.isNotEmpty ? primary : '08:00 – 11:30', 'WIB • Jadwal Aktif');
  }

  @override
  Widget build(BuildContext context) {
    if (widget.schedules.isEmpty) {
      return GestureDetector(
        onTap: widget.onViewAll,
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0xFFF1F5F9)),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0D4A63).withValues(alpha: 0.08),
                blurRadius: 25,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFFD5F4F0),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.event_available_rounded,
                  color: Color(0xFF0F6B64),
                  size: 24,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'JADWAL KEGIATAN',
                      style: _pj(10, FontWeight.w700, const Color(0xFF0F6B64), ls: 0.5),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Belum ada kegiatan terjadwal hari ini',
                      style: _pj(14, FontWeight.w700, const Color(0xFF1E293B)),
                    ),
                    Text(
                      'Ketuk untuk melihat seluruh agenda kegiatan tim',
                      style: _pj(11, FontWeight.w500, const Color(0xFF64748B)),
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_right_rounded,
                color: Color(0xFF64748B),
                size: 20,
              ),
            ],
          ),
        ),
      );
    }

    if (widget.schedules.length == 1) {
      return _buildCardItem(widget.schedules.first, index: 0, total: 1);
    }

    return Column(
      children: [
        SizedBox(
          height: 368,
          child: PageView.builder(
            controller: _pageController,
            itemCount: widget.schedules.length,
            onPageChanged: (idx) => setState(() => _currentPage = idx),
            itemBuilder: (context, index) {
              return Padding(
                padding: const EdgeInsets.only(right: 8, bottom: 4),
                child: _buildCardItem(
                  widget.schedules[index],
                  index: index,
                  total: widget.schedules.length,
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            widget.schedules.length,
            (idx) => AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: _currentPage == idx ? 18 : 6,
              height: 5,
              decoration: BoxDecoration(
                color: _currentPage == idx ? AppColors.brand600 : const Color(0xFFCBD5E1),
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCardItem(ActivityItem item, {required int index, required int total}) {
    final title = item.title;
    final roleText = item.jobDesk.isNotEmpty
        ? item.jobDesk
        : (item.picName.isNotEmpty ? 'PIC: ${item.picName}' : 'PIC Lapangan & Dokumentasi');
    final (timePrimary, timeSecondary) = _formatScheduleTime(item.time);
    final locationStr = item.location.isNotEmpty ? item.location : 'Gedung Serba Guna (GSG)';
    final isLive = item.status == 'Sedang Berlangsung' || item.status == 'IN_PROGRESS';
    final hasCheckedIn = item.hasCheckedIn;
    final statusText = hasCheckedIn
        ? 'Presensi Selesai'
        : (isLive ? 'Sedang Berlangsung' : 'Menunggu Presensi');

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        widget.onTapActivity(item);
      },
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFF1F5F9)),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0D4A63).withValues(alpha: 0.08),
              blurRadius: 25,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // 1. Top Status Badges Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Flexible(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFD5F4F0),
                      borderRadius: BorderRadius.circular(9999),
                    ),
                    child: Text(
                      total > 1
                          ? 'JADWAL ANGGOTA (${index + 1}/$total)'
                          : 'JADWAL UTAMA HARI INI',
                      style: _pj(
                        10,
                        FontWeight.w700,
                        const Color(0xFF0F6B64),
                        ls: 0.25,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: hasCheckedIn
                        ? const Color(0xFFD4F5E8)
                        : const Color(0xFFFEF3DB),
                    borderRadius: BorderRadius.circular(9999),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: hasCheckedIn
                              ? const Color(0xFF10B981)
                              : const Color(0xFFF59E0B),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        statusText,
                        style: _pj(
                          11,
                          FontWeight.w600,
                          hasCheckedIn
                              ? const Color(0xFF127A51)
                              : const Color(0xFFB47A16),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 10),

            // 2. Task Event Title
            Text(
              title,
              style: _pj(17, FontWeight.w800, const Color(0xFF1E293B), height: 1.35),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),

            const SizedBox(height: 10),

            // 3. Role Badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
              decoration: BoxDecoration(
                color: const Color(0xFFDAF2F0).withValues(alpha: 0.7),
                borderRadius: BorderRadius.circular(9999),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.camera_alt_outlined,
                    size: 14,
                    color: Color(0xFF0D5952),
                  ),
                  const SizedBox(width: 6),
                  Flexible(
                    child: RichText(
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      text: TextSpan(
                        children: [
                          TextSpan(
                            text: 'Peran: ',
                            style: _pj(12, FontWeight.w600, const Color(0xFF0D5952)),
                          ),
                          TextSpan(
                            text: roleText,
                            style: _pj(12, FontWeight.w700, const Color(0xFF0D5952)),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 10),

            // 4. Dashed Horizontal Divider
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 4),
              child: _DashedDivider(color: Color(0xFFBCE8E3)),
            ),

            const SizedBox(height: 8),

            // 5. Event Details (Waktu & Lokasi)
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Left: WAKTU
                Expanded(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: const Color(0xFF26C4D8),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          alignment: Alignment.center,
                          child: const Icon(
                            Icons.access_time_rounded,
                            size: 16,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'WAKTU',
                              style: _pj(10, FontWeight.w500, const Color(0xFF94A3B8)),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              timePrimary,
                              style: _pj(12, FontWeight.w700, const Color(0xFF1E293B), height: 1.25),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              timeSecondary,
                              style: _pj(10, FontWeight.w500, const Color(0xFF64748B)),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 12),

                // Right: LOKASI
                Expanded(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: const Color(0xFF22B5C7),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          alignment: Alignment.center,
                          child: const Icon(
                            Icons.location_on_outlined,
                            size: 16,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'LOKASI',
                              style: _pj(10, FontWeight.w500, const Color(0xFF94A3B8)),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              locationStr,
                              style: _pj(12, FontWeight.w700, const Color(0xFF1E293B), height: 1.25),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              'Polinela Kampus Utama',
                              style: _pj(10, FontWeight.w500, const Color(0xFF64748B)),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 14),

            // 6. Action Button & Subtext
            SizedBox(
              width: double.infinity,
              height: 46,
              child: ElevatedButton(
                onPressed: () {
                  HapticFeedback.lightImpact();
                  widget.onTapCheckIn(item);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1E4878),
                  foregroundColor: Colors.white,
                  elevation: 2,
                  shadowColor: Colors.black.withValues(alpha: 0.15),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      hasCheckedIn
                          ? Icons.check_circle_outline_rounded
                          : Icons.visibility_outlined,
                      size: 20,
                      color: const Color(0xFF2DD4BF),
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        hasCheckedIn
                            ? 'Sudah Presensi • Buka Detail'
                            : 'Presensi & Mulai Liputan',
                        style: _pj(14, FontWeight.w700, Colors.white, ls: 0.35),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 8),

            Center(
              child: Text(
                'Radius GPS aktif • Presensi dibuka 15 menit sebelum acara',
                style: _pj(10, FontWeight.w500, const Color(0xFF94A3B8)),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DashedDivider extends StatelessWidget {
  const _DashedDivider({required this.color});

  final Color color;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 2,
      child: CustomPaint(
        painter: _DashedLinePainter(color: color),
      ),
    );
  }
}

class _DashedLinePainter extends CustomPainter {
  const _DashedLinePainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1.6
      ..strokeCap = StrokeCap.round;

    const dashWidth = 5.0;
    const dashSpace = 4.0;
    double x = 0;
    final y = size.height / 2;
    while (x < size.width) {
      final endX = math.min(x + dashWidth, size.width);
      canvas.drawLine(Offset(x, y), Offset(endX, y), paint);
      x += dashWidth + dashSpace;
    }
  }

  @override
  bool shouldRepaint(covariant _DashedLinePainter oldDelegate) =>
      oldDelegate.color != color;
}

// ══════════════════════════════════════════════
// 3. Live Location Preview Card (Figma #5247:2205)
// ══════════════════════════════════════════════
class _LiveLocationPreviewCard extends StatelessWidget {
  const _LiveLocationPreviewCard({
    required this.activeCount,
    required this.totalCount,
    required this.member,
    this.activeMembers = const [],
    this.currentUserName = '',
    this.currentUserInitials = '',
    required this.onOpenMap,
  });

  final int activeCount;
  final int totalCount;
  final TeamMember? member;
  final List<TeamMember> activeMembers;
  final String currentUserName;
  final String currentUserInitials;
  final VoidCallback onOpenMap;

  String _shortLoc(String loc) {
    if (loc.isEmpty) return 'Kampus';
    if (loc.toLowerCase().contains('gsg')) return 'GSG';
    if (loc.toLowerCase().contains('rektorat') || loc.toLowerCase().contains('direktorat')) {
      return 'Rektorat';
    }
    final words = loc.split(' ');
    return words.take(2).join(' ');
  }

  @override
  Widget build(BuildContext context) {
    final denominator = totalCount > 0 ? totalCount : activeCount;
    final pin1 = member ?? (activeMembers.isNotEmpty ? activeMembers[0] : null);
    final pin2 = activeMembers.length > 1 ? activeMembers[1] : null;

    final leftLabel = pin2 != null
        ? '${pin2.name.split(' ').first} (${_shortLoc(pin2.location)})'
        : 'Dimas (Rektorat)';
    final fallbackSelfName = currentUserName.trim().isNotEmpty
        ? currentUserName.trim().split(' ').first
        : 'Yuda';
    final rightLabel = pin1 != null
        ? '${pin1.name.split(' ').first} (${_shortLoc(pin1.location)})'
        : '$fallbackSelfName (GSG)';

    final displayMembers = activeMembers.take(4).toList();
    final avatarInitials = displayMembers.isNotEmpty
        ? displayMembers.map((m) => m.initials).toList()
        : [
            currentUserInitials.isNotEmpty ? currentUserInitials : 'YP',
            'BS',
            'SA',
            'RF',
          ];

    final assignedCount = totalCount > 0
        ? totalCount
        : (activeMembers.isNotEmpty ? activeMembers.length : 5);
    final extraCount = assignedCount > avatarInitials.length
        ? assignedCount - avatarInitials.length
        : (activeMembers.isEmpty ? 1 : 0);

    const avatarColors = [
      Color(0xFF22D3EE),
      Color(0xFF0E5066),
      Color(0xFF082A39),
      Color(0xFF0284C7),
    ];

    final avatarCirclesCount = avatarInitials.length + (extraCount > 0 ? 1 : 0);

    return Container(
      padding: const EdgeInsets.all(17),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0D4A63).withValues(alpha: 0.08),
            blurRadius: 25,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          // Header Row (#5247:2207)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: const Color(0xFF0B2F42),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    alignment: Alignment.center,
                    child: Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFF5EEAD4), width: 2),
                      ),
                      alignment: Alignment.center,
                      child: Container(
                        width: 4,
                        height: 4,
                        decoration: const BoxDecoration(
                          color: Color(0xFF5EEAD4),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    'Pantau Lokasi Tim',
                    style: _pj(14, FontWeight.w700, const Color(0xFF1E293B)),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFD4F5E8),
                  borderRadius: BorderRadius.circular(9999),
                ),
                child: Text(
                  '$activeCount / $denominator Siaga',
                  style: _pj(11, FontWeight.w700, const Color(0xFF127A51)),
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Stylized Mint Map Preview Graphic (#5247:2216)
          GestureDetector(
            onTap: onOpenMap,
            child: Container(
              height: 96,
              width: double.infinity,
              decoration: BoxDecoration(
                color: const Color(0xFFD7F1EE),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFCCFBF1)),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(15),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Positioned.fill(
                      child: CustomPaint(
                        painter: _MintMapGridPainter(),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // Left White Pill
                          Flexible(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 5),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.95),
                                borderRadius: BorderRadius.circular(9999),
                                border: Border.all(color: const Color(0xFF99F6E4)),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.05),
                                    blurRadius: 2,
                                    offset: const Offset(0, 1),
                                  ),
                                ],
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    width: 8,
                                    height: 8,
                                    decoration: const BoxDecoration(
                                      color: Color(0xFF3B82F6),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Flexible(
                                    child: Text(
                                      leftLabel,
                                      style: _pj(10, FontWeight.w700, const Color(0xFF334155)),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          // Right Dark Navy Pill
                          Flexible(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 5),
                              decoration: BoxDecoration(
                                color: const Color(0xFF0C2F42),
                                borderRadius: BorderRadius.circular(9999),
                                border: Border.all(color: const Color(0xFF2DD4BF)),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.10),
                                    blurRadius: 6,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    width: 8,
                                    height: 8,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF34D399),
                                      shape: BoxShape.circle,
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFF6EE7B7).withValues(alpha: 0.4),
                                          spreadRadius: 2,
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Flexible(
                                    child: Text(
                                      rightLabel,
                                      style: _pj(10, FontWeight.w700, Colors.white),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(height: 12),

          // Bottom Row: Stacked Avatars + Buka Peta CTA (#5247:2230)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  SizedBox(
                    width: avatarCirclesCount * 18.0 + 6.0,
                    height: 24,
                    child: Stack(
                      children: [
                        for (int i = 0; i < avatarInitials.length; i++)
                          Positioned(
                            left: i * 18.0,
                            child: Container(
                              width: 24,
                              height: 24,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: avatarColors[i % avatarColors.length],
                                border: Border.all(color: Colors.white, width: 2),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                avatarInitials[i],
                                style: _pj(
                                  8,
                                  i == 0 ? FontWeight.w800 : FontWeight.w700,
                                  i == 0 ? const Color(0xFF0F172A) : Colors.white,
                                ),
                              ),
                            ),
                          ),
                        if (extraCount > 0)
                          Positioned(
                            left: avatarInitials.length * 18.0,
                            child: Container(
                              width: 24,
                              height: 24,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: const Color(0xFFE2E8F0),
                                border: Border.all(color: Colors.white, width: 2),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                '+$extraCount',
                                style: _pj(8, FontWeight.w700, const Color(0xFF334155)),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '$assignedCount Personil',
                        style: _pj(10, FontWeight.w600, const Color(0xFF475569), height: 1.25),
                      ),
                      Text(
                        'Ditugaskan',
                        style: _pj(10, FontWeight.w400, const Color(0xFF94A3B8), height: 1.25),
                      ),
                    ],
                  ),
                ],
              ),
              GestureDetector(
                onTap: () {
                  HapticFeedback.lightImpact();
                  onOpenMap();
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0C2F42),
                    borderRadius: BorderRadius.circular(9999),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.08),
                        blurRadius: 2,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Buka Peta',
                        style: _pj(12, FontWeight.w700, Colors.white),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '›',
                        style: _pj(13, FontWeight.w800, const Color(0xFF5EEAD4)),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MintMapGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final gridPaint = Paint()
      ..color = const Color(0xFF14B8A6).withValues(alpha: 0.14)
      ..strokeWidth = 1;

    const step = 20.0;
    for (double x = step; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }
    for (double y = step; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    // Subtle diagonal road path across the preview
    canvas.save();
    canvas.translate(size.width / 2, size.height / 2);
    canvas.rotate(-2.73 * math.pi / 180);
    final roadPaint = Paint()..color = Colors.white.withValues(alpha: 0.72);
    canvas.drawRect(
      Rect.fromCenter(
        center: Offset.zero,
        width: size.width + 40,
        height: 22,
      ),
      roadPaint,
    );
    canvas.restore();

    // Dashed inner perimeter rounded border
    final borderPaint = Paint()
      ..color = const Color(0xFF5EEAD4).withValues(alpha: 0.75)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    final innerRRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(8, 8, size.width - 16, size.height - 16),
      const Radius.circular(12),
    );
    final path = Path()..addRRect(innerRRect);
    for (final metric in path.computeMetrics()) {
      double distance = 0;
      const dashLen = 6.0;
      const gapLen = 4.0;
      while (distance < metric.length) {
        final next = math.min(distance + dashLen, metric.length);
        canvas.drawPath(metric.extractPath(distance, next), borderPaint);
        distance += dashLen + gapLen;
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ══════════════════════════════════════════════
// 4. Empty Upcoming Card
// ══════════════════════════════════════════════
class _EmptyUpcomingCard extends StatelessWidget {
  const _EmptyUpcomingCard({required this.onTapCalendar});
  final VoidCallback onTapCalendar;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0).withValues(alpha: 0.8)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: const BoxDecoration(
              color: Color(0xFFF0FDFA),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.event_available_rounded,
              color: Color(0xFF003D58),
              size: 22,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'Tidak ada kegiatan terdekat',
            style: _pj(14, FontWeight.w700, const Color(0xFF1E293B)),
          ),
          const SizedBox(height: 4),
          Text(
            'Semua agenda tim telah selesai atau belum ada kegiatan baru terjadwal.',
            textAlign: TextAlign.center,
            style: _pj(12, FontWeight.w500, const Color(0xFF64748B), height: 1.35),
          ),
          const SizedBox(height: 12),
          InkWell(
            onTap: onTapCalendar,
            borderRadius: BorderRadius.circular(10),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.calendar_month_rounded,
                    size: 13,
                    color: Color(0xFF003D58),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Lihat Agenda Lengkap',
                    style: _pj(11, FontWeight.w700, const Color(0xFF003D58)),
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

// ══════════════════════════════════════════════
// 5. Upcoming Activity Card (Figma #5250:2300)
// ══════════════════════════════════════════════
class _UpcomingActivityCard extends StatelessWidget {
  const _UpcomingActivityCard({
    required this.activity,
    required this.index,
    required this.onTap,
  });

  final ActivityItem activity;
  final int index;
  final VoidCallback onTap;

  (String, String) _parseDate(String raw, [DateTime? scheduledAt]) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final tomorrow = today.add(const Duration(days: 1));

    DateTime? targetDate;
    if (scheduledAt != null) {
      targetDate = DateTime(scheduledAt.year, scheduledAt.month, scheduledAt.day);
    } else {
      final parsed = DateTime.tryParse(raw.trim());
      if (parsed != null) {
        targetDate = DateTime(parsed.year, parsed.month, parsed.day);
      }
    }

    final dayNameMap = ['', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'];

    if (targetDate != null) {
      String label;
      if (targetDate.isAtSameMomentAs(today)) {
        label = 'HARI INI';
      } else if (targetDate.isAtSameMomentAs(tomorrow)) {
        label = 'BESOK';
      } else {
        label = dayNameMap[targetDate.weekday.clamp(1, 7)];
      }
      return (targetDate.day.toString().padLeft(2, '0'), label);
    }

    final trimmed = raw.trim();
    final digits = trimmed.replaceAll(RegExp(r'\D'), '');
    return (digits.isNotEmpty ? digits.padLeft(2, '0') : '01', 'AGENDA');
  }

  @override
  Widget build(BuildContext context) {
    final (day, dayLabel) = _parseDate(activity.date, activity.scheduledAt);
    final isTodayOrTomorrow = dayLabel == 'HARI INI' || dayLabel == 'BESOK';

    final badgeLabel = activity.jobDesk.isNotEmpty ? activity.jobDesk : 'Liputan';
    final lowerBadge = badgeLabel.toLowerCase();
    final lowerTitle = activity.title.toLowerCase();
    final isAmberBadge = lowerBadge.contains('konferensi') ||
        lowerBadge.contains('pers') ||
        lowerTitle.contains('konferensi') ||
        lowerTitle.contains('pers') ||
        index.isOdd;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          onTap();
        },
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(15),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: const Color(0xFFE2E8F0).withValues(alpha: 0.8),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 2,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Date Box (#5250:2301 & #5250:2320)
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: isTodayOrTomorrow
                      ? const Color(0xFFF0FDFA)
                      : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isTodayOrTomorrow
                        ? const Color(0xFFCCFBF1).withValues(alpha: 0.8)
                        : const Color(0xFFE2E8F0),
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      dayLabel,
                      maxLines: 1,
                      style: _pj(
                        10,
                        FontWeight.w800,
                        isTodayOrTomorrow
                            ? const Color(0xFF003D58)
                            : const Color(0xFF334155),
                        height: 1.0,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      day,
                      maxLines: 1,
                      style: _pj(
                        16,
                        FontWeight.w800,
                        isTodayOrTomorrow
                            ? const Color(0xFF003D58)
                            : const Color(0xFF334155),
                        height: 1.0,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 14),

              // Details (#5250:2306)
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      crossAxisAlignment: WrapCrossAlignment.center,
                      spacing: 8,
                      runSpacing: 4,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: isAmberBadge
                                ? const Color(0xFFFFFBEB)
                                : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(4),
                            border: isAmberBadge
                                ? Border.all(color: const Color(0xFFFDE68A))
                                : null,
                          ),
                          child: Text(
                            badgeLabel,
                            style: _pj(
                              10,
                              FontWeight.w700,
                              isAmberBadge
                                  ? const Color(0xFFB45309)
                                  : const Color(0xFF334155),
                            ),
                          ),
                        ),
                        Text(
                          '• ${activity.time.isNotEmpty ? activity.time : "09:00 WIB"}',
                          style: _pj(12, FontWeight.w500, const Color(0xFF64748B)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      activity.title,
                      style: _pj(
                        12,
                        FontWeight.w700,
                        const Color(0xFF1E293B),
                        height: 1.35,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(
                          Icons.location_on_outlined,
                          size: 14,
                          color: Color(0xFF64748B),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            activity.location,
                            style: _pj(13, FontWeight.w400, const Color(0xFF475569)),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════
// 6. Duty Section & Card
// ══════════════════════════════════════════════
class _DutySection extends StatelessWidget {
  const _DutySection({required this.schedules});
  final List<DutyScheduleItem> schedules;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'JADWAL PIKET ANDA',
          style: _pj(
            12.5,
            FontWeight.w800,
            const Color(0xFF64748B),
            ls: 0.8,
          ),
        ),
        const SizedBox(height: 10),
        ...schedules.take(2).map(
              (duty) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _DutyCard(schedule: duty),
              ),
            ),
      ],
    );
  }
}

class _DutyCard extends StatelessWidget {
  const _DutyCard({required this.schedule});
  final DutyScheduleItem schedule;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: AppColors.shadowCard,
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDFA),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              'Shift ${schedule.shiftName}',
              style: _pj(11, FontWeight.w800, AppColors.brand600),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  schedule.formattedDate,
                  style: _pj(13, FontWeight.w800, AppColors.slate800),
                ),
                Text(
                  '${schedule.timeLabel} • ${schedule.location}',
                  style: _pj(11, FontWeight.w500, AppColors.slate500),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
