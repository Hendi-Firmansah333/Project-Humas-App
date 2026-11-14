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
                            // ── 1. USER GREETING HEADER ──
                            _UserGreetingCard(
                              profile: profile,
                            ),

                            const SizedBox(height: 16),

                            // ── 2. ACTIVE SCHEDULE HERO CARD ──
                            _ActiveScheduleHeroCard(
                              schedules: provider.activeSchedules,
                              onTapActivity: (act) => pushSmooth(
                                context,
                                ActivityDetailScreen(activity: act),
                              ),
                              onTapCheckIn: (act) => _openActivityCheckIn(context, act),
                              onViewAll: () => onNavigate(1),
                            ),

                            const SizedBox(height: 22),

                            // ── 3. LIVE LOCATION TIM WIDGET ──
                            _LiveLocationPreviewCard(
                              activeCount: activeTeamCount,
                              totalCount: provider.teamMembers.length,
                              member: firstActiveMember,
                              activeMembers: provider.teamMembers.where((m) => m.isOnDuty).toList(),
                              currentUserName: profile.name,
                              currentUserInitials: profile.initials,
                              onOpenMap: () => pushSmooth(context, const LiveLocationScreen()),
                            ),

                            const SizedBox(height: 22),

                            // ── 4. JADWAL PIKET (IF ANY) ──
                            if (provider.dutySchedules.isNotEmpty) ...[
                              _DutySection(schedules: provider.dutySchedules, index: 4),
                              const SizedBox(height: 22),
                            ],

                            // ── 5. AGENDA MENDATANG (FIGMA #4471:406) ──
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'AGENDA MENDATANG',
                                      style: _pj(
                                        12,
                                        FontWeight.w800,
                                        isDark ? Colors.white : AppColors.slate900,
                                        ls: 0.8,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      'Jadwal kegiatan publikasi & pers pekan ini',
                                      style: _pj(
                                        11,
                                        FontWeight.w500,
                                        isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                                      ),
                                    ),
                                  ],
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
                                            AppColors.primary,
                                          ),
                                        ),
                                        const SizedBox(width: 2),
                                        const Icon(
                                          Icons.arrow_forward_ios_rounded,
                                          size: 11,
                                          color: AppColors.primary,
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),

                            if (provider.upcomingActivities.isEmpty)
                              _EmptyUpcomingCard(
                                onTapCalendar: () => onNavigate(1),
                              )
                            else
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
// 1. User Greeting Header (Figma #4471:254)
// ══════════════════════════════════════════════
class _UserGreetingCard extends StatelessWidget {
  const _UserGreetingCard({
    required this.profile,
  });

  final dynamic profile;

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Selamat bertugas,',
            style: _pj(
              12,
              FontWeight.w600,
              isDark ? Colors.white60 : const Color(0xFF64748B),
              ls: -0.1,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            profile.name.isNotEmpty ? profile.name : 'Yuda Pratama, S.I.Kom',
            style: _pj(
              20,
              FontWeight.w800,
              isDark ? Colors.white : const Color(0xFF0F172A),
              ls: -0.4,
              height: 1.25,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            profile.role.isNotEmpty ? profile.role : 'Staff Dokumentasi & Peliputan Media',
            style: _pj(
              12,
              FontWeight.w500,
              isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
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
      viewportFraction: widget.schedules.length > 1 ? 0.92 : 1.0,
    );
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
              colors: [Color(0xFF003D58), Color(0xFF00567A), Color(0xFF0284C7)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF003D58).withValues(alpha: 0.35),
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
        height: 318,
        child: _buildCardItem(widget.schedules.first, index: 0, total: 1),
      );
    }

    return Column(
      children: [
        SizedBox(
          height: 318,
          child: PageView.builder(
            controller: _pageController,
            itemCount: widget.schedules.length,
            onPageChanged: (idx) => setState(() => _currentPage = idx),
            itemBuilder: (context, index) {
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
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
    final timeStr = item.time.isNotEmpty ? item.time : '08:00 - 11:30 WIB';
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
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF002738), Color(0xFF003D58), Color(0xFF034B6C)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF003D58).withValues(alpha: 0.35),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Stack(
            children: [
              // Ambient glow circles from Figma (#4471:271 & #4471:272)
              Positioned(
                top: -30,
                right: -20,
                child: Container(
                  width: 140,
                  height: 140,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFF38BDF8).withValues(alpha: 0.15),
                  ),
                ),
              ),
              Positioned(
                bottom: -20,
                right: 30,
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFF34D399).withValues(alpha: 0.1),
                  ),
                ),
              ),

              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // 1. Header Badges Row inside Card (Figma #4471:273)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.15),
                            ),
                          ),
                          child: Text(
                            total > 1
                                ? 'JADWAL ANGGOTA (${index + 1}/$total)'
                                : 'JADWAL UTAMA HARI INI',
                            style: _pj(
                              9.5,
                              FontWeight.w800,
                              const Color(0xFFCCFBF1),
                              ls: 0.6,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3.5),
                          decoration: BoxDecoration(
                            color: hasCheckedIn
                                ? const Color(0xFF34D399).withValues(alpha: 0.2)
                                : const Color(0xFFFBBF24).withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: hasCheckedIn
                                  ? const Color(0xFF6EE7B7).withValues(alpha: 0.4)
                                  : const Color(0xFFFCD34D).withValues(alpha: 0.4),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                hasCheckedIn ? Icons.check_circle_rounded : Icons.schedule_rounded,
                                size: 11,
                                color: hasCheckedIn
                                    ? const Color(0xFFA7F3D0)
                                    : const Color(0xFFFDE68A),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                statusText,
                                style: _pj(
                                  10.5,
                                  FontWeight.w700,
                                  hasCheckedIn
                                      ? const Color(0xFFA7F3D0)
                                      : const Color(0xFFFDE68A),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    // 2. Activity Title & Role Assignment (Figma #4471:280)
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: _pj(16, FontWeight.w800, Colors.white, height: 1.25, ls: -0.2),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 5),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.25),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.badge_outlined,
                                size: 12,
                                color: Color(0xFFCCFBF1),
                              ),
                              const SizedBox(width: 5),
                              RichText(
                                text: TextSpan(
                                  children: [
                                    TextSpan(
                                      text: 'Peran: ',
                                      style: _pj(11, FontWeight.w500, const Color(0xFFCCFBF1)),
                                    ),
                                    TextSpan(
                                      text: roleText,
                                      style: _pj(11, FontWeight.w800, const Color(0xFFCCFBF1)),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    // 3. Realistic Metadata Grid (Time & Venue) (Figma #4471:288)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.09),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.12),
                        ),
                      ),
                      child: Row(
                        children: [
                          // Left Column: Waktu
                          Expanded(
                            child: Row(
                              children: [
                                Container(
                                  width: 26,
                                  height: 26,
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Icon(
                                    Icons.access_time_filled_rounded,
                                    size: 13,
                                    color: Color(0xFF5EEAD4),
                                  ),
                                ),
                                const SizedBox(width: 7),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        'Waktu Pelaksanaan',
                                        style: _pj(9, FontWeight.w600, const Color(0xFF99F6E4)),
                                      ),
                                      Text(
                                        timeStr,
                                        style: _pj(11, FontWeight.w700, Colors.white),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            height: 26,
                            width: 1,
                            color: Colors.white.withValues(alpha: 0.15),
                            margin: const EdgeInsets.symmetric(horizontal: 6),
                          ),
                          // Right Column: Lokasi
                          Expanded(
                            child: Row(
                              children: [
                                Container(
                                  width: 26,
                                  height: 26,
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Icon(
                                    Icons.location_on_rounded,
                                    size: 13,
                                    color: Color(0xFF5EEAD4),
                                  ),
                                ),
                                const SizedBox(width: 7),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        'Lokasi Penugasan',
                                        style: _pj(9, FontWeight.w600, const Color(0xFF99F6E4)),
                                      ),
                                      Text(
                                        locationStr,
                                        style: _pj(11, FontWeight.w700, Colors.white),
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
                    ),

                    // 4. Call to Action Button & Note (Figma #4471:314)
                    Column(
                      children: [
                        SizedBox(
                          width: double.infinity,
                          height: 40,
                          child: ElevatedButton(
                            onPressed: () {
                              HapticFeedback.lightImpact();
                              widget.onTapCheckIn(item);
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: const Color(0xFF003D58),
                              elevation: 2,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                              padding: const EdgeInsets.symmetric(horizontal: 14),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  hasCheckedIn
                                      ? Icons.check_circle_rounded
                                      : Icons.camera_alt_rounded,
                                  size: 16,
                                  color: const Color(0xFF003D58),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  hasCheckedIn
                                      ? 'Sudah Presensi • Buka Detail'
                                      : 'Presensi & Mulai Liputan',
                                  style: _pj(13, FontWeight.w800, const Color(0xFF003D58)),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 5),
                        Text(
                          'Radius GPS aktif • Presensi dibuka 15 menit sebelum waktu acara',
                          style: _pj(10, FontWeight.w500, Colors.white.withValues(alpha: 0.85)),
                          textAlign: TextAlign.center,
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
// 3. Live Location Preview Card
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

  String _formatUpdated(DateTime? dt) {
    if (dt == null) return 'Baru saja';
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Baru saja';
    if (diff.inMinutes < 60) return '${diff.inMinutes} mnt lalu';
    return '${diff.inHours} jam lalu';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;
    final denominator = totalCount > 0 ? totalCount : activeCount;
    final pin1 = activeMembers.isNotEmpty ? activeMembers[0] : null;
    final pin2 = activeMembers.length > 1 ? activeMembers[1] : null;
    final pillMember = member ?? pin1;
    final pillInitials = pillMember != null
        ? pillMember.initials
        : (currentUserInitials.isNotEmpty ? currentUserInitials : 'HM');
    final pillName = pillMember != null
        ? pillMember.name
        : (currentUserName.isNotEmpty ? '$currentUserName (Anda)' : 'Monitoring Tim');
    final pillSub = pillMember != null
        ? '${_shortLoc(pillMember.location)} • ${_formatUpdated(pillMember.lastUpdated)}'
        : 'Lokasi Kampus Polinela';

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
          // Header (Figma #4471:325)
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
                    'Pantau Lokasi Tim di Lapangan',
                    style: _pj(
                      13.5,
                      FontWeight.w800,
                      isDark ? Colors.white : AppColors.slate900,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3.5),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF003D58).withValues(alpha: 0.3) : const Color(0xFFE0F2FE),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isDark ? const Color(0xFF0284C7).withValues(alpha: 0.4) : const Color(0xFFBAE6FD),
                  ),
                ),
                child: Text(
                  '$activeCount / $denominator Siaga',
                  style: _pj(
                    10,
                    FontWeight.w700,
                    isDark ? const Color(0xFF7DD3FC) : const Color(0xFF0369A1),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Map Banner Simulator (Figma #4471:334)
          GestureDetector(
            onTap: onOpenMap,
            child: Container(
              height: 192,
              width: double.infinity,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                gradient: const RadialGradient(
                  center: Alignment(0.2, -0.2),
                  radius: 1.2,
                  colors: [
                    Color(0xFF002738),
                    Color(0xFF09202A),
                    Color(0xFF051218),
                  ],
                ),
                border: Border.all(
                  color: const Color(0xFF2DD4BF).withValues(alpha: 0.25),
                  width: 1,
                ),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Stack(
                  children: [
                    // Grid blueprint lines & landmarks
                    CustomPaint(
                      size: const Size(double.infinity, 192),
                      painter: _GridBlueprintPainter(),
                    ),

                    // Landmark 1: GSG Polinela
                    Positioned(
                      top: 40,
                      right: 48,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF002738).withValues(alpha: 0.85),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: const Color(0xFF38BDF8).withValues(alpha: 0.4),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'GSG Polinela',
                              style: _pj(10, FontWeight.w700, const Color(0xFFE0F2FE)),
                            ),
                            Text(
                              'Venue Utama',
                              style: _pj(8, FontWeight.w500, const Color(0xFF7DD3FC)),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Landmark 2: Gedung Rektorat
                    Positioned(
                      top: 92,
                      left: 20,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0F172A).withValues(alpha: 0.85),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: const Color(0xFF64748B).withValues(alpha: 0.4),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'Gedung Rektorat',
                              style: _pj(9.5, FontWeight.w700, const Color(0xFFCBD5E1)),
                            ),
                            Text(
                              'Pusat Media',
                              style: _pj(8, FontWeight.w500, const Color(0xFF94A3B8)),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Floating top zone badge (Figma #4471:349)
                    Positioned(
                      top: 10,
                      left: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF001B28).withValues(alpha: 0.85),
                          borderRadius: BorderRadius.circular(9999),
                          border: Border.all(
                            color: const Color(0xFF2DD4BF).withValues(alpha: 0.4),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(
                                color: Color(0xFF2DD4BF),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 5),
                            RichText(
                              text: TextSpan(
                                style: _pj(10, FontWeight.w500, const Color(0xFFCCFBF1)),
                                children: [
                                  const TextSpan(text: 'Zona Aktif: '),
                                  TextSpan(
                                    text: 'GSG & Rektorat',
                                    style: _pj(10, FontWeight.w800, Colors.white),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Pin Personil 1 (Dinamis)
                    if (pin1 != null)
                      Positioned(
                        top: 72,
                        right: 58,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                          decoration: BoxDecoration(
                            color: const Color(0xFF003D58),
                            borderRadius: BorderRadius.circular(9999),
                            border: Border.all(
                              color: const Color(0xFF38BDF8),
                              width: 1.5,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF003D58).withValues(alpha: 0.5),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 6,
                                height: 6,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF10B981),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 5),
                              Text(
                                '${pin1.name.split(' ').first} (${_shortLoc(pin1.location)})',
                                style: _pj(10, FontWeight.w800, Colors.white, ls: 0.2),
                              ),
                            ],
                          ),
                        ),
                      ),

                    // Pin Personil 2 (Dinamis)
                    if (pin2 != null)
                      Positioned(
                        top: 60,
                        left: 110,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0F172A).withValues(alpha: 0.95),
                            borderRadius: BorderRadius.circular(9999),
                            border: Border.all(
                              color: const Color(0xFF38BDF8).withValues(alpha: 0.6),
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.4),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 5,
                                height: 5,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF38BDF8),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '${pin2.name.split(' ').first} (${_shortLoc(pin2.location)})',
                                style: _pj(9.5, FontWeight.w700, const Color(0xFFBAE6FD)),
                              ),
                            ],
                          ),
                        ),
                      ),

                    // Bottom overlay bar inside map (Figma #4471:366)
                    Positioned(
                      left: 10,
                      right: 10,
                      bottom: 10,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Left User Status Pill
                          Expanded(
                            child: Container(
                              margin: const EdgeInsets.only(right: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                              decoration: BoxDecoration(
                                color: const Color(0xFF001B28).withValues(alpha: 0.9),
                                borderRadius: BorderRadius.circular(9999),
                                border: Border.all(
                                  color: const Color(0xFF334155).withValues(alpha: 0.8),
                                ),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 26,
                                    height: 26,
                                    decoration: const BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: Color(0xFF0284C7),
                                    ),
                                    alignment: Alignment.center,
                                    child: Text(
                                      pillInitials,
                                      style: _pj(10, FontWeight.w800, Colors.white),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          pillName,
                                          style: _pj(11, FontWeight.w800, Colors.white),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        Text(
                                          pillSub,
                                          style: _pj(9.5, FontWeight.w600, const Color(0xFF7DD3FC)),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),

                          // Buka Peta Button (Figma #4471:377)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(9999),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.primary.withValues(alpha: 0.5),
                                  blurRadius: 10,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  'Buka Peta',
                                  style: _pj(11.5, FontWeight.w800, Colors.white),
                                ),
                                const SizedBox(width: 4),
                                const Icon(
                                  Icons.arrow_forward_rounded,
                                  size: 13,
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

          const SizedBox(height: 12),

          // Bottom row with facepile and personil count (Figma #4471:383)
          Container(
            padding: const EdgeInsets.only(top: 10),
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
                    SizedBox(
                      height: 24,
                      child: Row(
                        children: [
                          ...activeMembers.take(4).toList().asMap().entries.map((entry) {
                            final idx = entry.key;
                            final m = entry.value;
                            return Transform.translate(
                              offset: Offset(idx * -6.0, 0),
                              child: Container(
                                width: 24,
                                height: 24,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: [
                                    const Color(0xFF003D58),
                                    const Color(0xFF0284C7),
                                    const Color(0xFF0D9488),
                                    const Color(0xFF64748B),
                                  ][idx % 4],
                                  border: Border.all(
                                    color: isDark ? const Color(0xFF1E293B) : Colors.white,
                                    width: 1.5,
                                  ),
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  m.initials,
                                  style: _pj(8.5, FontWeight.w800, Colors.white),
                                ),
                              ),
                            );
                          }),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${activeMembers.isNotEmpty ? activeMembers.length : 5} Personil Humas Ditugaskan',
                      style: _pj(
                        11.5,
                        FontWeight.w700,
                        isDark ? Colors.white70 : AppColors.slate700,
                      ),
                    ),
                  ],
                ),
                Text(
                  'Siaga Lapangan',
                  style: _pj(
                    11,
                    FontWeight.w600,
                    const Color(0xFF10B981),
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
// 4. Empty Upcoming Card
// ══════════════════════════════════════════════
class _EmptyUpcomingCard extends StatelessWidget {
  const _EmptyUpcomingCard({required this.onTapCalendar});
  final VoidCallback onTapCalendar;

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
        ),
        boxShadow: AppColors.shadowCard,
      ),
      child: Column(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: isDark
                  ? AppColors.brand600.withValues(alpha: 0.15)
                  : const Color(0xFFF0FDFA),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.event_available_rounded,
              color: AppColors.brand600,
              size: 22,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'Tidak ada kegiatan terdekat',
            style: _pj(
              14,
              FontWeight.w800,
              isDark ? Colors.white : AppColors.slate800,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Semua agenda tim telah selesai atau belum ada kegiatan baru terjadwal.',
            textAlign: TextAlign.center,
            style: _pj(
              12,
              FontWeight.w500,
              isDark ? Colors.white60 : AppColors.slate500,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 12),
          InkWell(
            onTap: onTapCalendar,
            borderRadius: BorderRadius.circular(10),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
              decoration: BoxDecoration(
                color: isDark ? Colors.white12 : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.calendar_month_rounded,
                    size: 13,
                    color: isDark ? AppColors.brand300 : AppColors.brand700,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Lihat Agenda Lengkap',
                    style: _pj(
                      11,
                      FontWeight.w700,
                      isDark ? AppColors.brand300 : AppColors.brand700,
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

    // Fallback extraction
    final trimmed = raw.trim();
    final digits = trimmed.replaceAll(RegExp(r'\D'), '');
    return (digits.isNotEmpty ? digits.padLeft(2, '0') : '01', 'AGENDA');
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;
    final (day, dayLabel) = _parseDate(activity.date, activity.scheduledAt);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          onTap();
        },
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E293B) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
            ),
            boxShadow: AppColors.shadowCard,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Date Box (Figma #4471:418 & #4471:437)
              Container(
                width: 50,
                height: 58,
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF003D58).withValues(alpha: 0.3)
                      : const Color(0xFFE8F2F6),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isDark
                        ? const Color(0xFF0284C7).withValues(alpha: 0.35)
                        : const Color(0xFFC7DEE9),
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      dayLabel,
                      maxLines: 1,
                      style: _pj(
                        9,
                        FontWeight.w800,
                        isDark ? const Color(0xFF7DD3FC) : const Color(0xFF003D58),
                        ls: 0.5,
                      ),
                    ),
                    const SizedBox(height: 1),
                    Text(
                      day,
                      maxLines: 1,
                      style: _pj(
                        18,
                        FontWeight.w900,
                        isDark ? Colors.white : const Color(0xFF003D58),
                        height: 1.0,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),

              // Details (Figma #4471:423)
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Category Badge + Time Row (Figma #4471:424)
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF003D58).withValues(alpha: 0.25)
                                : const Color(0xFFE8F2F6),
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(
                              color: isDark
                                  ? const Color(0xFF0284C7).withValues(alpha: 0.3)
                                  : const Color(0xFFC7DEE9),
                            ),
                          ),
                          child: Text(
                            activity.jobDesk.isNotEmpty ? activity.jobDesk : 'Liputan',
                            style: _pj(
                              9.5,
                              FontWeight.w700,
                              isDark ? const Color(0xFF7DD3FC) : const Color(0xFF003D58),
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            '• ${activity.time.isNotEmpty ? activity.time : "09:00 WIB"}',
                            style: _pj(
                              11,
                              FontWeight.w500,
                              isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),

                    // Title
                    Text(
                      activity.title,
                      style: _pj(
                        13.5,
                        FontWeight.w800,
                        isDark ? Colors.white : AppColors.slate900,
                        height: 1.25,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),

                    // Location
                    Row(
                      children: [
                        Icon(
                          Icons.location_on_outlined,
                          size: 13,
                          color: isDark ? Colors.white54 : AppColors.slate400,
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            activity.location,
                            style: _pj(
                              11,
                              FontWeight.w500,
                              isDark ? Colors.white60 : const Color(0xFF475569),
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
            12.5,
            FontWeight.w800,
            isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
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
