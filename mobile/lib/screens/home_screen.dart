import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:poli_humas/models/activity.dart';
import 'package:poli_humas/models/duty_schedule.dart';
import 'package:poli_humas/models/team_member.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/activities/activity_detail_screen.dart';
import 'package:poli_humas/screens/activities/checkin_screen.dart';
import 'package:poli_humas/screens/live_location_screen.dart';
import 'package:poli_humas/services/user_profile_service.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/theme/rigid_scroll_behavior.dart';
import 'package:poli_humas/utils/app_navigator.dart';
import 'package:poli_humas/widgets/async_states.dart';
import 'package:poli_humas/widgets/common_widgets.dart';
import 'package:poli_humas/widgets/profile_avatar.dart';
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
    final isDark = AppColors.isDark;

    return ListenableBuilder(
      listenable: UserProfileService.instance,
      builder: (context, _) {
        final profile = UserProfileService.instance.profile;
        return Consumer<AppDataProvider>(
          builder: (context, provider, _) {
            final activeTeamCount = provider.teamMembers.where((m) => m.isOnDuty).length;
            final firstActiveMember = provider.teamMembers.where((m) => m.isOnDuty).firstOrNull ??
                provider.teamMembers.firstOrNull;

            return Scaffold(
              backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
              appBar: AppHeader(
                showSearch: true,
                showNotifications: true,
                unreadCount: provider.unreadNotificationCount,
                onNotifications: () => onNavigate(3),
              ),
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
                        padding: const EdgeInsets.fromLTRB(18, 14, 18, 28),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // ── 1. USER GREETING CARD ──
                            _UserGreetingCard(
                              profile: profile,
                              checkInLabel: provider.todayCheckInLabel,
                              isCheckedIn: provider.todayCheckInState == CheckInState.checkedIn,
                              onTapCheckIn: () => _openTodayStatus(context, provider),
                            ),

                            const SizedBox(height: 16),

                            // ── 2. ACTIVE SCHEDULE HERO CARD ──
                            _ActiveScheduleHeroCard(
                              schedules: provider.activeSchedules,
                              onTapActivity: (act) => pushSmooth(
                                context,
                                ActivityDetailScreen(activity: act),
                              ),
                              onViewAll: () => onNavigate(1),
                            ),

                            const SizedBox(height: 22),

                            // ── 3. AKSES CEPAT (QUICK ACTIONS) ──
                            Text(
                              'AKSES CEPAT',
                              style: _pj(
                                11,
                                FontWeight.w800,
                                isDark ? Colors.white54 : AppColors.slate400,
                                ls: 1.1,
                              ),
                            ),
                            const SizedBox(height: 10),
                            _QuickActionsGrid(
                              onNavigate: onNavigate,
                              onOpenLiveLoc: () => pushSmooth(context, const LiveLocationScreen()),
                            ),

                            const SizedBox(height: 20),

                            // ── 4. LIVE LOCATION TIM WIDGET ──
                            _LiveLocationPreviewCard(
                              activeCount: activeTeamCount > 0 ? activeTeamCount : 3,
                              member: firstActiveMember,
                              onOpenMap: () => pushSmooth(context, const LiveLocationScreen()),
                            ),

                            const SizedBox(height: 22),

                            // ── 5. JADWAL PIKET (IF ANY) ──
                            if (provider.dutySchedules.isNotEmpty) ...[
                              _DutySection(schedules: provider.dutySchedules, index: 4),
                              const SizedBox(height: 22),
                            ],

                            // ── 6. KEGIATAN TERDEKAT ──
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'KEGIATAN TERDEKAT',
                                  style: _pj(
                                    11,
                                    FontWeight.w800,
                                    isDark ? Colors.white54 : AppColors.slate400,
                                    ls: 1.1,
                                  ),
                                ),
                                GestureDetector(
                                  onTap: () => onNavigate(1),
                                  child: Text(
                                    'Lihat Semua',
                                    style: _pj(
                                      12,
                                      FontWeight.w700,
                                      AppColors.brand600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),

                            if (provider.upcomingActivities.isEmpty) ...[
                              Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: _UpcomingActivityCard(
                                  activity: const ActivityItem(
                                    id: 'mock-1',
                                    title: 'Rapat Koordinasi Dies Natalis',
                                    description: 'Rapat koordinasi persiapan Dies Natalis Politeknik Negeri Lampung.',
                                    date: '24 Okt',
                                    time: '13:00 - 15:00 WIB',
                                    location: 'R. Sidang Utama',
                                    picName: 'Panitia Dies Natalis',
                                    picInitials: 'PD',
                                    status: 'Akan Datang',
                                  ),
                                  onTap: () => onNavigate(1),
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: _UpcomingActivityCard(
                                  activity: const ActivityItem(
                                    id: 'mock-2',
                                    title: 'Persiapan Konten Sosmed',
                                    description: 'Produksi konten feed dan reels sosial media Humas Polinela.',
                                    date: '25 Okt',
                                    time: '09:00 - 11:00 WIB',
                                    location: 'Studio Humas Polinela',
                                    picName: 'Tim Multimedia',
                                    picInitials: 'TM',
                                    status: 'Akan Datang',
                                  ),
                                  onTap: () => onNavigate(1),
                                ),
                              ),
                            ] else
                              ...provider.upcomingActivities.take(3).map(
                                    (act) => Padding(
                                      padding: const EdgeInsets.only(bottom: 10),
                                      child: _UpcomingActivityCard(
                                        activity: act,
                                        onTap: () => pushSmooth(
                                          context,
                                          ActivityDetailScreen(activity: act),
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

// ══════════════════════════════════════════════
// 1. User Greeting Card
// ══════════════════════════════════════════════
class _UserGreetingCard extends StatelessWidget {
  const _UserGreetingCard({
    required this.profile,
    required this.checkInLabel,
    required this.isCheckedIn,
    required this.onTapCheckIn,
  });

  final dynamic profile;
  final String checkInLabel;
  final bool isCheckedIn;
  final VoidCallback onTapCheckIn;

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
        ),
        boxShadow: AppColors.shadowSoft,
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          'Halo,',
                          style: _pj(
                            12,
                            FontWeight.w600,
                            isDark ? Colors.white60 : AppColors.slate400,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: isDark
                                ? AppColors.brand600.withValues(alpha: 0.2)
                                : const Color(0xFFF0FDFA),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: isDark
                                  ? AppColors.brand600.withValues(alpha: 0.4)
                                  : const Color(0xFF99F6E4),
                            ),
                          ),
                          child: Text(
                            profile.role.isNotEmpty ? profile.role : 'Staff Humas',
                            style: _pj(
                              10,
                              FontWeight.w700,
                              isDark ? AppColors.brand300 : AppColors.brand700,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      profile.name.isNotEmpty ? profile.name : 'Komang Ari',
                      style: _pj(
                        20,
                        FontWeight.w800,
                        isDark ? Colors.white : AppColors.slate900,
                        ls: -0.3,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              // Avatar with gradient ring and online green indicator
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const LinearGradient(
                        colors: [AppColors.brand500, AppColors.polinelaCyan],
                        begin: Alignment.bottomLeft,
                        end: Alignment.topRight,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.brand500.withValues(alpha: 0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(2),
                    child: Container(
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      padding: const EdgeInsets.all(1.5),
                      child: ClipOval(
                        child: ProfileAvatar(photoPath: profile.photoPath, radius: 22),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 1,
                    right: 1,
                    child: Container(
                      width: 13,
                      height: 13,
                      decoration: BoxDecoration(
                        color: AppColors.emerald,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.only(top: 12),
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(
                  color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
                ),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.schedule_rounded,
                      size: 15,
                      color: isDark ? Colors.white54 : AppColors.slate400,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Status hari ini:',
                      style: _pj(
                        12,
                        FontWeight.w500,
                        isDark ? Colors.white60 : AppColors.slate500,
                      ),
                    ),
                  ],
                ),
                GestureDetector(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    onTapCheckIn();
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: isCheckedIn
                          ? (isDark
                              ? AppColors.brand600.withValues(alpha: 0.2)
                              : const Color(0xFFF0FDFA))
                          : (isDark
                              ? AppColors.amber.withValues(alpha: 0.2)
                              : const Color(0xFFFFFBEB)),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isCheckedIn
                            ? (isDark
                                ? AppColors.brand600.withValues(alpha: 0.4)
                                : const Color(0xFF99F6E4))
                            : (isDark
                                ? AppColors.amber.withValues(alpha: 0.4)
                                : const Color(0xFFFDE68A)),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          isCheckedIn ? Icons.check_circle_rounded : Icons.info_outline_rounded,
                          size: 13,
                          color: isCheckedIn ? AppColors.brand600 : AppColors.amber,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          checkInLabel,
                          style: _pj(
                            11,
                            FontWeight.w700,
                            isCheckedIn
                                ? (isDark ? AppColors.brand300 : AppColors.brand700)
                                : (isDark ? const Color(0xFFFCD34D) : const Color(0xFFB45309)),
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
    );
  }
}

// ══════════════════════════════════════════════
// 2. Active Schedule Hero Card
// ══════════════════════════════════════════════
// ══════════════════════════════════════════════
// 2. Active Schedule Hero Card (Menyesuaikan Semua Kegiatan Anggota Humas)
// ══════════════════════════════════════════════
class _ActiveScheduleHeroCard extends StatefulWidget {
  const _ActiveScheduleHeroCard({
    required this.schedules,
    required this.onTapActivity,
    required this.onViewAll,
  });

  final List<ActivityItem> schedules;
  final ValueChanged<ActivityItem> onTapActivity;
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
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.schedules.isEmpty) {
      return GestureDetector(
        onTap: widget.onViewAll,
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF0D9488), Color(0xFF0F766E), Color(0xFF0284C7)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0F766E).withValues(alpha: 0.35),
                blurRadius: 24,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.event_available_rounded, color: Colors.white, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'JADWAL KEGIATAN',
                      style: _pj(10, FontWeight.w800, Colors.white.withValues(alpha: 0.8), ls: 0.8),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Belum ada kegiatan terjadwal hari ini',
                      style: _pj(14, FontWeight.w700, Colors.white),
                    ),
                    Text(
                      'Ketuk untuk melihat seluruh agenda kegiatan tim',
                      style: _pj(11, FontWeight.w400, Colors.white.withValues(alpha: 0.8)),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white70, size: 14),
            ],
          ),
        ),
      );
    }

    if (widget.schedules.length == 1) {
      return SizedBox(
        height: 195,
        child: _buildCardItem(widget.schedules.first, index: 0, total: 1),
      );
    }

    return Column(
      children: [
        SizedBox(
          height: 195,
          child: PageView.builder(
            controller: _pageController,
            itemCount: widget.schedules.length,
            onPageChanged: (idx) => setState(() => _currentPage = idx),
            itemBuilder: (context, index) {
              return _buildCardItem(
                widget.schedules[index],
                index: index,
                total: widget.schedules.length,
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
    final subtitle = item.jobDesk.isNotEmpty
        ? item.jobDesk
        : (item.description.isNotEmpty ? item.description : 'Dokumentasi & peliputan kegiatan');
    final timeStr = item.time.isNotEmpty ? item.time : '09:00 - 12:00 WIB';
    final locationStr = item.location.isNotEmpty ? item.location : 'Gedung Serba Guna (GSG)';
    final isLive = item.status == 'Sedang Berlangsung' || item.status == 'IN_PROGRESS';
    final statusText = isLive ? 'Sedang Berlangsung' : item.status;

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        widget.onTapActivity(item);
      },
      child: Container(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF0D9488), Color(0xFF0F766E), Color(0xFF0284C7)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0F766E).withValues(alpha: 0.35),
              blurRadius: 24,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: Stack(
            children: [
              // Subtle background decorative glows
              Positioned(
                right: -30,
                bottom: -30,
                child: Container(
                  width: 160,
                  height: 160,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withValues(alpha: 0.08),
                  ),
                ),
              ),
              Positioned(
                right: 20,
                top: 15,
                child: Container(
                  width: 70,
                  height: 70,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
                  ),
                ),
              ),

              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.18),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.25),
                            ),
                          ),
                          child: Text(
                            total > 1
                                ? 'JADWAL ANGGOTA (${index + 1}/$total)'
                                : 'JADWAL HARI INI',
                            style: _pj(10, FontWeight.w800, Colors.white, ls: 0.8),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFF34D399).withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: const Color(0xFF6EE7B7).withValues(alpha: 0.5),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 7,
                                height: 7,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF6EE7B7),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 5),
                              Text(
                                statusText,
                                style: _pj(11, FontWeight.w700, const Color(0xFFA7F3D0)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      title,
                      style: _pj(18, FontWeight.w800, Colors.white, height: 1.25),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        if (item.picName.isNotEmpty) ...[
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 1.5),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.person_rounded, size: 10, color: Colors.white),
                                const SizedBox(width: 3),
                                Text(
                                  'PIC: ${item.picName}',
                                  style: _pj(10, FontWeight.w700, Colors.white),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 6),
                        ],
                        Expanded(
                          child: Text(
                            subtitle,
                            style: _pj(12, FontWeight.w400, const Color(0xFFCCFBF1)),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.only(top: 10),
                      decoration: BoxDecoration(
                        border: Border(
                          top: BorderSide(color: Colors.white.withValues(alpha: 0.18)),
                        ),
                      ),
                      child: Row(
                        children: [
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 24,
                                height: 24,
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(7),
                                ),
                                child: const Icon(
                                  Icons.access_time_rounded,
                                  size: 13,
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(width: 7),
                              Text(
                                timeStr,
                                style: _pj(12, FontWeight.w700, Colors.white),
                              ),
                            ],
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Row(
                              children: [
                                Container(
                                  width: 24,
                                  height: 24,
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(7),
                                  ),
                                  child: const Icon(
                                    Icons.location_on_rounded,
                                    size: 13,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(width: 7),
                                Expanded(
                                  child: Text(
                                    locationStr,
                                    style: _pj(12, FontWeight.w600, const Color(0xFFF0FDFA)),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
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
            ],
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════
// 3. Quick Actions Grid
// ══════════════════════════════════════════════
class _QuickActionsGrid extends StatelessWidget {
  const _QuickActionsGrid({
    required this.onNavigate,
    required this.onOpenLiveLoc,
  });

  final ValueChanged<int> onNavigate;
  final VoidCallback onOpenLiveLoc;

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;

    final items = [
      (
        Icons.calendar_month_rounded,
        'Kegiatan',
        const Color(0xFFF0FDFA),
        const Color(0xFF0D9488),
        () => onNavigate(1),
      ),
      (
        Icons.article_outlined,
        'Content Plan',
        const Color(0xFFECFEFF),
        const Color(0xFF0891B2),
        () => onNavigate(2),
      ),
      (
        Icons.location_on_rounded,
        'Live Loc',
        const Color(0xFFECFDF5),
        const Color(0xFF059669),
        onOpenLiveLoc,
      ),
      (
        Icons.campaign_rounded,
        'Warta',
        const Color(0xFFF0F9FF),
        const Color(0xFF0284C7),
        () => onNavigate(3),
      ),
    ];

    return Row(
      children: items.map((item) {
        final (icon, label, bgColor, iconColor, onTap) = item;
        return Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () {
                  HapticFeedback.lightImpact();
                  onTap();
                },
                borderRadius: BorderRadius.circular(18),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E293B) : Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
                    ),
                    boxShadow: AppColors.shadowCard,
                  ),
                  child: Column(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: isDark ? iconColor.withValues(alpha: 0.2) : bgColor,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Icon(icon, color: iconColor, size: 22),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        label,
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: _pj(
                          11,
                          FontWeight.w700,
                          isDark ? Colors.white : AppColors.slate700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

// ══════════════════════════════════════════════
// 4. Live Location Preview Card
// ══════════════════════════════════════════════
class _LiveLocationPreviewCard extends StatelessWidget {
  const _LiveLocationPreviewCard({
    required this.activeCount,
    required this.member,
    required this.onOpenMap,
  });

  final int activeCount;
  final TeamMember? member;
  final VoidCallback onOpenMap;

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;

    return Container(
      padding: const EdgeInsets.all(16),
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
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: AppColors.emerald,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.emerald.withValues(alpha: 0.5),
                          blurRadius: 6,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Live Location Tim',
                    style: _pj(
                      14,
                      FontWeight.w800,
                      isDark ? Colors.white : AppColors.slate800,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white12 : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '$activeCount Anggota Aktif',
                  style: _pj(
                    10,
                    FontWeight.w700,
                    isDark ? Colors.white70 : AppColors.slate600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Map Banner Simulator
          GestureDetector(
            onTap: onOpenMap,
            child: Container(
              height: 130,
              width: double.infinity,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(18),
                gradient: const RadialGradient(
                  center: Alignment(0.2, -0.2),
                  radius: 1.2,
                  colors: [
                    Color(0xFF134E4A),
                    Color(0xFF0F2723),
                    Color(0xFF061513),
                  ],
                ),
                border: Border.all(
                  color: const Color(0xFF2DD4BF).withValues(alpha: 0.25),
                  width: 1,
                ),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(18),
                child: Stack(
                  children: [
                    // Grid blueprint lines
                    CustomPaint(
                      size: const Size(double.infinity, 130),
                      painter: _GridBlueprintPainter(),
                    ),

                    // Floating marker for member
                    Positioned(
                      top: 14,
                      left: 14,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.95),
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.2),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 26,
                              height: 26,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: Color(0xFFCCFBF1),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                member != null ? member!.initials : 'BS',
                                style: _pj(10, FontWeight.w800, AppColors.brand700),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  member != null ? member!.name : 'Budi Santoso',
                                  style: _pj(11, FontWeight.w800, AppColors.slate900),
                                ),
                                Text(
                                  'GSG Polinela • 2 mnt lalu',
                                  style: _pj(9, FontWeight.w700, AppColors.brand600),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Bottom info & Buka Peta button
                    Positioned(
                      left: 14,
                      right: 14,
                      bottom: 12,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              const Icon(
                                Icons.radar_rounded,
                                size: 14,
                                color: Color(0xFF34D399),
                              ),
                              const SizedBox(width: 5),
                              Text(
                                'Monitoring Lapangan Aktif',
                                style: _pj(10, FontWeight.w600, const Color(0xFFE2E8F0)),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppColors.brand600,
                              borderRadius: BorderRadius.circular(10),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.brand600.withValues(alpha: 0.4),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  'Buka Peta',
                                  style: _pj(11, FontWeight.w800, Colors.white),
                                ),
                                const SizedBox(width: 4),
                                const Icon(
                                  Icons.arrow_forward_rounded,
                                  size: 11,
                                  color: Colors.white,
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
            ),
          ),
        ],
      ),
    );
  }
}

// Blueprint canvas lines
class _GridBlueprintPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF2DD4BF).withValues(alpha: 0.12)
      ..strokeWidth = 1;

    const step = 24.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }

    // A subtle radar circle
    final circlePaint = Paint()
      ..color = const Color(0xFF2DD4BF).withValues(alpha: 0.15)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawCircle(Offset(size.width * 0.75, size.height * 0.5), 35, circlePaint);
    canvas.drawCircle(Offset(size.width * 0.75, size.height * 0.5), 65, circlePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ══════════════════════════════════════════════
// 5. Upcoming Activity Card
// ══════════════════════════════════════════════
class _UpcomingActivityCard extends StatelessWidget {
  const _UpcomingActivityCard({
    required this.activity,
    required this.onTap,
  });

  final ActivityItem activity;
  final VoidCallback onTap;

  (String, String) _parseDate(String raw, [DateTime? scheduledAt]) {
    final months = ['', 'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
    if (scheduledAt != null) {
      return (scheduledAt.day.toString().padLeft(2, '0'), months[scheduledAt.month.clamp(1, 12)]);
    }
    final parsed = DateTime.tryParse(raw.trim());
    if (parsed != null) {
      return (parsed.day.toString().padLeft(2, '0'), months[parsed.month.clamp(1, 12)]);
    }
    final trimmed = raw.trim();
    final parts = trimmed.split(RegExp(r'[\s\n\-/]+'));
    if (parts.length >= 3 && parts[0].length == 4) {
      final m = int.tryParse(parts[1]) ?? 10;
      final d = int.tryParse(parts[2]) ?? 1;
      return (d.toString().padLeft(2, '0'), months[m.clamp(1, 12)]);
    }
    if (parts.length >= 2) {
      final d = parts[0].replaceAll(RegExp(r'\D'), '');
      return (d.isNotEmpty ? d.padLeft(2, '0') : parts[0], parts[1].toUpperCase());
    }
    final digits = trimmed.replaceAll(RegExp(r'\D'), '');
    return (digits.isNotEmpty ? digits.padLeft(2, '0') : (trimmed.isNotEmpty ? trimmed : '01'), 'OKT');
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;
    final (day, month) = _parseDate(activity.date, activity.scheduledAt);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          onTap();
        },
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E293B) : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
            ),
            boxShadow: AppColors.shadowCard,
          ),
          child: Row(
            children: [
              // Date Box
              Container(
                width: 52,
                height: 56,
                decoration: BoxDecoration(
                  color: isDark
                      ? AppColors.brand600.withValues(alpha: 0.15)
                      : const Color(0xFFF0FDFA),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isDark
                        ? AppColors.brand600.withValues(alpha: 0.3)
                        : const Color(0xFFCCFBF1),
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      month,
                      maxLines: 1,
                      style: _pj(
                        10,
                        FontWeight.w800,
                        isDark ? AppColors.brand300 : AppColors.brand600,
                        ls: 0.5,
                      ),
                    ),
                    const SizedBox(height: 1),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        day,
                        maxLines: 1,
                        style: _pj(
                          18,
                          FontWeight.w900,
                          isDark ? Colors.white : AppColors.slate900,
                          height: 1.0,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 14),

              // Details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      activity.title,
                      style: _pj(
                        13,
                        FontWeight.w800,
                        isDark ? Colors.white : AppColors.slate900,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(
                          Icons.access_time_rounded,
                          size: 12,
                          color: isDark ? Colors.white54 : AppColors.slate400,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          activity.time,
                          style: _pj(
                            11,
                            FontWeight.w500,
                            isDark ? Colors.white60 : AppColors.slate500,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Icon(
                          Icons.location_on_outlined,
                          size: 12,
                          color: isDark ? Colors.white54 : AppColors.slate400,
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            activity.location,
                            style: _pj(
                              11,
                              FontWeight.w500,
                              isDark ? Colors.white60 : AppColors.slate500,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(width: 8),

              // Status badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  activity.status.isNotEmpty ? activity.status : 'Akan Datang',
                  style: _pj(
                    10,
                    FontWeight.w700,
                    isDark ? Colors.white70 : AppColors.slate600,
                  ),
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
  const _DutySection({required this.schedules, this.index = 0});
  final List<DutyScheduleItem> schedules;
  final int index;

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'JADWAL PIKET ANDA',
          style: _pj(
            11,
            FontWeight.w800,
            isDark ? Colors.white54 : AppColors.slate400,
            ls: 1.1,
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
    final isDark = AppColors.isDark;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
        ),
        boxShadow: AppColors.shadowCard,
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: isDark
                  ? AppColors.brand600.withValues(alpha: 0.2)
                  : const Color(0xFFF0FDFA),
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
                  style: _pj(13, FontWeight.w800, isDark ? Colors.white : AppColors.slate800),
                ),
                Text(
                  '${schedule.timeLabel} • ${schedule.location}',
                  style: _pj(11, FontWeight.w500, isDark ? Colors.white60 : AppColors.slate500),
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
