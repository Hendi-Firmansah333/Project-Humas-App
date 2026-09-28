import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:poli_humas/animations/app_animations.dart';
import 'package:poli_humas/models/activity.dart';
import 'package:poli_humas/models/duty_schedule.dart';
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

// ══════════════════════════════════════════════
// Design Tokens
// ══════════════════════════════════════════════
const _c1 = Color(0xFF0F9EA1); // primary teal
const _c3 = Color(0xFF085759); // darkest teal
const _cBg = Color(0xFFF0FAFA); // page bg
const _cCard = Colors.white;
const _cText1 = Color(0xFF0D2B2C);
const _cText2 = Color(0xFF5E7E80);

// Named color map for Quick Actions
const _qaColors = [
  [Color(0xFF0D9488), Color(0xFF0B7A74)],   // Kegiatan - teal
  [Color(0xFF2563EB), Color(0xFF1D4ED8)],   // Content - blue
  [Color(0xFF7C3AED), Color(0xFF6D28D9)],   // Location - purple
  [Color(0xFFD97706), Color(0xFFB45309)],   // Pengumuman - amber
];

// ══════════════════════════════════════════════
// Text style helpers (Poppins)
// ══════════════════════════════════════════════
TextStyle _p(double size, FontWeight w, Color color, {double? height, double? ls}) =>
    GoogleFonts.poppins(fontSize: size, fontWeight: w, color: color, height: height, letterSpacing: ls);

// ══════════════════════════════════════════════
// HomeScreen
// ══════════════════════════════════════════════
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
        return Icons.check_circle_rounded;
      case CheckInState.late:
        return Icons.schedule_rounded;
      case CheckInState.missed:
      case CheckInState.none:
        return Icons.highlight_off_rounded;
    }
  }

  void _openTodaySchedule(BuildContext context, ActivityItem? schedule) {
    if (schedule == null) { onNavigate(1); return; }
    pushSmooth(context, ActivityDetailScreen(activity: schedule));
  }

  void _openTodayStatus(BuildContext context, AppDataProvider provider) {
    final schedule = provider.todaySchedule;
    if (schedule == null) { onNavigate(1); return; }
    if (schedule.hasCheckedIn) { _openTodaySchedule(context, schedule); return; }
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
            final ciColor = _checkInColor(provider.todayCheckInState);
            final ciIcon  = _checkInIcon(provider.todayCheckInState);
            return Scaffold(
              backgroundColor: _cBg,
              body: Column(children: [
                OfflineBanner(isOffline: provider.isOffline),
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: provider.refreshAll,
                    color: Colors.white,
                    backgroundColor: _c1,
                    displacement: 100,
                    child: CustomScrollView(
                      physics: appScrollPhysics,
                      slivers: [
                        // ── HERO HEADER ──────────────────────────
                        SliverAppBar(
                          expandedHeight: 240,
                          collapsedHeight: 80,
                          pinned: false,
                          floating: false,
                          elevation: 0,
                          backgroundColor: _c3,
                          systemOverlayStyle: SystemUiOverlayStyle.light,
                          flexibleSpace: FlexibleSpaceBar(
                            background: _HeroHeader(profile: profile),
                            collapseMode: CollapseMode.pin,
                          ),
                        ),

                        // ── CONTENT ──────────────────────────────
                        SliverPadding(
                          padding: const EdgeInsets.fromLTRB(18, 24, 18, 100),
                          sliver: SliverList(
                            delegate: SliverChildListDelegate([

                              // Status Hari Ini ─────────────────
                              _SectionHeader(icon: Icons.bolt_rounded, label: 'Status Hari Ini', index: 0),
                              const SizedBox(height: 10),
                              _StatusCard(
                                ciColor: ciColor,
                                ciIcon: ciIcon,
                                label: provider.todayCheckInLabel,
                                onTap: () => _openTodayStatus(context, provider),
                              ).staggeredEntrance(1),

                              const SizedBox(height: 28),

                              // Jadwal Hari Ini ─────────────────
                              _SectionHeader(icon: Icons.event_rounded, label: 'Jadwal Hari Ini', index: 2),
                              const SizedBox(height: 10),
                              _TodayCard(
                                schedule: provider.todaySchedule,
                                onTap: () => _openTodaySchedule(context, provider.todaySchedule),
                                index: 3,
                              ),

                              const SizedBox(height: 28),

                              // Jadwal Piket ────────────────────
                              _DutySection(schedules: provider.dutySchedules, index: 4),

                              const SizedBox(height: 28),

                              // Aksi Cepat ──────────────────────
                              _SectionHeader(icon: Icons.apps_rounded, label: 'Aksi Cepat', index: 5),
                              const SizedBox(height: 14),
                              _QuickActionRow(onNavigate: onNavigate),

                              const SizedBox(height: 28),

                              // Humas Lapangan ──────────────────
                              _SectionHeader(icon: Icons.groups_rounded, label: 'Humas Lapangan', index: 6),
                              const SizedBox(height: 12),
                              Row(children: [
                                Expanded(child: _GradientActionBtn(
                                  icon: Icons.history_rounded,
                                  label: 'Riwayat\nKegiatan',
                                  colors: const [Color(0xFF0F9EA1), Color(0xFF0C7A7D)],
                                  index: 0,
                                  onTap: () => pushSmooth(context, const ActivityHistoryScreen()),
                                )),
                                const SizedBox(width: 12),
                                Expanded(child: _GradientActionBtn(
                                  icon: Icons.location_on_rounded,
                                  label: 'Tim\nLapangan',
                                  colors: const [Color(0xFF1FA7A9), Color(0xFF148587)],
                                  index: 1,
                                  onTap: () => pushSmooth(context, const LiveLocationScreen()),
                                )),
                              ]).staggeredEntrance(7),

                              const SizedBox(height: 28),

                              // Kegiatan Terdekat ───────────────
                              Row(children: [
                                _SectionHeader(icon: Icons.calendar_today_rounded, label: 'Kegiatan Terdekat', index: 8),
                                const Spacer(),
                                GestureDetector(
                                  onTap: () => onNavigate(1),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: _c1.withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Text('Lihat Semua', style: _p(11, FontWeight.w700, _c1)),
                                  ),
                                ),
                              ]).staggeredEntrance(8),
                              const SizedBox(height: 14),

                              if (provider.upcomingActivities.isEmpty)
                                _EmptyState(index: 9)
                              else
                                ...provider.upcomingActivities.asMap().entries.map((e) =>
                                  Padding(
                                    padding: const EdgeInsets.only(bottom: 12),
                                    child: _UpcomingCard(
                                      activity: e.value,
                                      index: e.key + 9,
                                      onTap: () => pushSmooth(context, ActivityDetailScreen(activity: e.value)),
                                    ),
                                  ),
                                ),
                            ]),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ]),
            );
          },
        );
      },
    );
  }
}

// ══════════════════════════════════════════════
// HERO HEADER
// ══════════════════════════════════════════════
class _HeroHeader extends StatelessWidget {
  const _HeroHeader({required this.profile});
  final dynamic profile;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        image: DecorationImage(
          image: AssetImage('assets/images/bg_polihumas_1.png'),
          fit: BoxFit.cover,
        ),
      ),
      child: Stack(
        children: [
          // Content
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(22, 10, 22, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Top row
                  Row(children: [
                    // Avatar with ring
                    Container(
                      padding: const EdgeInsets.all(2.5),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: [Colors.white.withValues(alpha: 0.9), Colors.white.withValues(alpha: 0.4)],
                        ),
                      ),
                      child: ProfileAvatar(photoPath: profile.photoPath, radius: 22),
                    ),
                    const SizedBox(width: 12),
                    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(
                        'Selamat datang 👋',
                        style: _p(11.5, FontWeight.w500, Colors.white.withValues(alpha: 0.9)).copyWith(
                          shadows: [Shadow(color: Colors.black.withValues(alpha: 0.5), blurRadius: 4, offset: const Offset(0, 1))],
                        ),
                      ),
                      Text(
                        profile.name,
                        style: _p(16, FontWeight.w700, Colors.white).copyWith(
                          shadows: [Shadow(color: Colors.black.withValues(alpha: 0.5), blurRadius: 4, offset: const Offset(0, 1))],
                        ),
                      ),
                    ]),
                    const Spacer(),
                    _GlassCircleBtn(icon: Icons.notifications_outlined, onTap: () {}),
                  ]).staggeredEntrance(0),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Decorative blob
class _Blob extends StatelessWidget {
  const _Blob({required this.size, required this.color});
  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color),
    );
  }
}

// Glass circle button
class _GlassCircleBtn extends StatelessWidget {
  const _GlassCircleBtn({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () { HapticFeedback.lightImpact(); onTap(); },
      child: ClipOval(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
          child: Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.18),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white.withValues(alpha: 0.35), width: 1),
            ),
            child: Icon(icon, color: Colors.white, size: 22),
          ),
        ),
      ),
    );
  }
}

// Wave underline painter
class _WavePainter extends CustomPainter {
  const _WavePainter({required this.color});
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    final path = Path();
    path.moveTo(0, size.height * 0.6);
    for (int i = 0; i < 4; i++) {
      final dx = size.width / 4;
      final x1 = i * dx + dx * 0.3;
      final x2 = i * dx + dx;
      path.quadraticBezierTo(
        x1, i.isEven ? 0 : size.height,
        x2, size.height * 0.5,
      );
    }
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ══════════════════════════════════════════════
// Section Header
// ══════════════════════════════════════════════
class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.icon, required this.label, this.index = 0});
  final IconData icon;
  final String label;
  final int index;

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF14B8BB), Color(0xFF0C7A7D)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(9),
          boxShadow: [
            BoxShadow(color: _c1.withValues(alpha: 0.35), blurRadius: 8, offset: const Offset(0, 3)),
          ],
        ),
        child: Icon(icon, color: Colors.white, size: 17),
      ),
      const SizedBox(width: 10),
      Text(label, style: _p(15.5, FontWeight.w700, _cText1)),
    ]).staggeredEntrance(index);
  }
}

// ══════════════════════════════════════════════
// Status Card
// ══════════════════════════════════════════════
class _StatusCard extends StatelessWidget {
  const _StatusCard({
    required this.ciColor,
    required this.ciIcon,
    required this.label,
    required this.onTap,
  });

  final Color ciColor;
  final IconData ciIcon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () { HapticFeedback.lightImpact(); onTap(); },
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: _cCard,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(color: ciColor.withValues(alpha: 0.15), blurRadius: 20, offset: const Offset(0, 6)),
            BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2)),
          ],
          border: Border.all(color: ciColor.withValues(alpha: 0.12), width: 1.5),
        ),
        child: Row(children: [
          // Icon circle
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [ciColor.withValues(alpha: 0.15), ciColor.withValues(alpha: 0.07)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(ciIcon, color: ciColor, size: 26),
          ),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Status Hari Ini', style: _p(11.5, FontWeight.w500, _cText2)),
            const SizedBox(height: 3),
            Text(label, style: _p(17, FontWeight.w800, ciColor)),
          ])),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: ciColor,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(color: ciColor.withValues(alpha: 0.4), blurRadius: 10, offset: const Offset(0, 4)),
              ],
            ),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Text('Detail', style: _p(12, FontWeight.w700, Colors.white)),
              const SizedBox(width: 4),
              const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white, size: 11),
            ]),
          ),
        ]),
      ),
    );
  }
}

// ══════════════════════════════════════════════
// Today Schedule Card
// ══════════════════════════════════════════════
class _TodayCard extends StatelessWidget {
  const _TodayCard({required this.schedule, required this.onTap, this.index = 0});
  final ActivityItem? schedule;
  final VoidCallback onTap;
  final int index;

  @override
  Widget build(BuildContext context) {
    if (schedule == null) {
      return _EmptyTodayCard(onTap: onTap, index: index);
    }

    return GestureDetector(
      onTap: () { HapticFeedback.lightImpact(); onTap(); },
      child: Container(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF14B8BB), Color(0xFF0F9EA1), Color(0xFF085759)],
          ),
          borderRadius: BorderRadius.circular(22),
          boxShadow: [
            BoxShadow(color: _c1.withValues(alpha: 0.45), blurRadius: 24, offset: const Offset(0, 8)),
            BoxShadow(color: _c1.withValues(alpha: 0.15), blurRadius: 8, offset: const Offset(0, 2)),
          ],
        ),
        child: Stack(children: [
          // Decorative shapes
          Positioned(top: -30, right: -30,
            child: Container(width: 120, height: 120,
              decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withValues(alpha: 0.06)))),
          Positioned(bottom: -20, right: 50,
            child: Container(width: 80, height: 80,
              decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withValues(alpha: 0.04)))),

          Padding(
            padding: const EdgeInsets.all(22),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
                  ),
                  child: Text('JADWAL HARI INI',
                      style: _p(10, FontWeight.w700, Colors.white, ls: 0.8)),
                ),
                const Spacer(),
                _WhitePill(label: schedule!.status),
                const SizedBox(width: 6),
                Icon(Icons.arrow_forward_ios_rounded, color: Colors.white.withValues(alpha: 0.65), size: 14),
              ]),
              const SizedBox(height: 16),
              Text(schedule!.title,
                  style: _p(20, FontWeight.w800, Colors.white, height: 1.2),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis),
              if (schedule!.jobDesk.isNotEmpty) ...[
                const SizedBox(height: 8),
                Row(children: [
                  Icon(Icons.assignment_rounded, size: 14, color: Colors.white.withValues(alpha: 0.75)),
                  const SizedBox(width: 6),
                  Text(schedule!.jobDesk,
                      style: _p(12.5, FontWeight.w600, Colors.white.withValues(alpha: 0.9))),
                ]),
              ],
              const SizedBox(height: 16),
              Row(children: [
                _TimeLocationChip(icon: Icons.access_time_rounded, text: schedule!.time),
                const SizedBox(width: 8),
                Flexible(child: _TimeLocationChip(icon: Icons.location_on_rounded, text: schedule!.location)),
              ]),
            ]),
          ),
        ]),
      ),
    ).staggeredEntrance(index);
  }
}

class _EmptyTodayCard extends StatelessWidget {
  const _EmptyTodayCard({required this.onTap, this.index = 0});
  final VoidCallback onTap;
  final int index;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () { HapticFeedback.selectionClick(); onTap(); },
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: _cCard,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 14, offset: const Offset(0, 4)),
          ],
          border: Border.all(color: _c1.withValues(alpha: 0.08), width: 1.5),
        ),
        child: Row(children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: const Color(0xFFE8F5F5),
              borderRadius: BorderRadius.circular(13),
            ),
            child: const Icon(Icons.event_busy_rounded, color: Color(0xFF9DBDBE), size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(child: Text('Tidak ada jadwal hari ini.',
              style: _p(13.5, FontWeight.w500, _cText2))),
          Icon(Icons.chevron_right_rounded, color: _cText2.withValues(alpha: 0.5), size: 22),
        ]),
      ),
    ).staggeredEntrance(index);
  }
}

// ══════════════════════════════════════════════
// White Pill Badge (on teal card)
// ══════════════════════════════════════════════
class _WhitePill extends StatelessWidget {
  const _WhitePill({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.25),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.45), width: 1),
      ),
      child: Text(label, style: _p(11, FontWeight.w700, Colors.white)),
    );
  }
}

// Time / Location chip on teal card
class _TimeLocationChip extends StatelessWidget {
  const _TimeLocationChip({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, color: Colors.white, size: 13),
        const SizedBox(width: 5),
        Flexible(child: Text(text,
            style: _p(11.5, FontWeight.w600, Colors.white),
            overflow: TextOverflow.ellipsis, maxLines: 1)),
      ]),
    );
  }
}

// ══════════════════════════════════════════════
// Quick Actions Row
// ══════════════════════════════════════════════
class _QuickActionRow extends StatelessWidget {
  const _QuickActionRow({required this.onNavigate});
  final ValueChanged<int> onNavigate;

  static const _items = [
    (Icons.event_note_rounded, 'Kegiatan'),
    (Icons.calendar_month_rounded, 'Content Plan'),
    (Icons.my_location_rounded, 'Live Location'),
    (Icons.campaign_rounded, 'Pengumuman'),
  ];

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: _items.asMap().entries.map((e) {
        final idx = e.key;
        final (icon, label) = e.value;
        final colors = _qaColors[idx];
        return Expanded(
          child: Animate(
            delay: Duration(milliseconds: idx * 60),
            child: GestureDetector(
              onTap: () {
                HapticFeedback.lightImpact();
                switch (idx) {
                  case 0: onNavigate(1);
                  case 1: onNavigate(2);
                  case 2: pushSmooth(context, const LiveLocationScreen());
                  case 3: onNavigate(3);
                }
              },
              child: Column(children: [
                Container(
                  width: 62,
                  height: 62,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: colors,
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(
                        color: colors[0].withValues(alpha: 0.40),
                        blurRadius: 14,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Icon(icon, color: Colors.white, size: 28),
                ),
                const SizedBox(height: 8),
                Text(label,
                    style: _p(10.5, FontWeight.w600, _cText1),
                    textAlign: TextAlign.center,
                    maxLines: 2),
              ]),
            ),
          )
              .fadeIn(duration: 350.ms, curve: Curves.easeOutCubic)
              .scale(begin: const Offset(0.75, 0.75), end: const Offset(1, 1), curve: Curves.easeOutBack),
        );
      }).toList(),
    );
  }
}

// ══════════════════════════════════════════════
// Gradient Action Button
// ══════════════════════════════════════════════
class _GradientActionBtn extends StatelessWidget {
  const _GradientActionBtn({
    required this.icon,
    required this.label,
    required this.colors,
    required this.onTap,
    this.index = 0,
  });
  final IconData icon;
  final String label;
  final List<Color> colors;
  final VoidCallback onTap;
  final int index;

  @override
  Widget build(BuildContext context) {
    return Animate(
      delay: Duration(milliseconds: index * 80),
      child: GestureDetector(
        onTap: () { HapticFeedback.lightImpact(); onTap(); },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: colors, begin: Alignment.topLeft, end: Alignment.bottomRight),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(color: colors[0].withValues(alpha: 0.45), blurRadius: 18, offset: const Offset(0, 6)),
            ],
          ),
          child: Stack(children: [
            Positioned(right: -8, bottom: -8,
              child: Container(width: 55, height: 55,
                decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withValues(alpha: 0.08)))),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(11),
                ),
                child: Icon(icon, color: Colors.white, size: 22),
              ),
              const SizedBox(height: 10),
              Text(label, style: _p(13.5, FontWeight.w700, Colors.white, height: 1.3)),
            ]),
          ]),
        ),
      ),
    )
        .fadeIn(duration: 350.ms, curve: Curves.easeOutCubic)
        .slideX(begin: 0.06, curve: Curves.easeOutCubic);
  }
}

// ══════════════════════════════════════════════
// Upcoming Activity Card
// ══════════════════════════════════════════════
class _UpcomingCard extends StatelessWidget {
  const _UpcomingCard({required this.activity, required this.onTap, this.index = 0});
  final ActivityItem activity;
  final VoidCallback onTap;
  final int index;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () { HapticFeedback.selectionClick(); onTap(); },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: _cCard,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 14, offset: const Offset(0, 4)),
            BoxShadow(color: _c1.withValues(alpha: 0.04), blurRadius: 6, offset: const Offset(0, 1)),
          ],
        ),
        child: Row(children: [
          // Date badge
          Container(
            width: 56,
            height: 64,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF14B8BB), Color(0xFF0C7A7D)],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
              borderRadius: BorderRadius.circular(15),
              boxShadow: [
                BoxShadow(color: _c1.withValues(alpha: 0.35), blurRadius: 10, offset: const Offset(0, 4)),
              ],
            ),
            child: Center(
              child: Text(activity.date,
                  textAlign: TextAlign.center,
                  style: _p(12, FontWeight.w800, Colors.white, height: 1.3)),
            ),
          ),
          const SizedBox(width: 14),
          // Info
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(activity.title,
                style: _p(13.5, FontWeight.w700, _cText1),
                maxLines: 2,
                overflow: TextOverflow.ellipsis),
            const SizedBox(height: 5),
            Row(children: [
              Icon(Icons.access_time_rounded, size: 12, color: _cText2),
              const SizedBox(width: 4),
              Text(activity.time, style: _p(11.5, FontWeight.w500, _cText2)),
              const SizedBox(width: 10),
              Icon(Icons.location_on_outlined, size: 12, color: _cText2),
              const SizedBox(width: 3),
              Expanded(child: Text(activity.location,
                  style: _p(11.5, FontWeight.w500, _cText2),
                  overflow: TextOverflow.ellipsis)),
            ]),
            const SizedBox(height: 8),
            StatusBadge(label: activity.status),
          ])),
          const SizedBox(width: 6),
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: _c1.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(Icons.arrow_forward_ios_rounded, color: _c1, size: 14),
          ),
        ]),
      ),
    ).staggeredEntrance(index);
  }
}

// ══════════════════════════════════════════════
// Empty upcoming state
// ══════════════════════════════════════════════
class _EmptyState extends StatelessWidget {
  const _EmptyState({this.index = 0});
  final int index;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: _cCard,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 3)),
        ],
      ),
      child: Column(children: [
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFE8F8F8), Color(0xFFCCEEEE)],
            ),
            borderRadius: BorderRadius.circular(18),
          ),
          child: Icon(Icons.event_available_rounded, size: 32, color: _c1.withValues(alpha: 0.5)),
        ),
        const SizedBox(height: 12),
        Text('Belum ada kegiatan terdekat.',
            style: _p(13, FontWeight.w500, _cText2)),
      ]),
    ).staggeredEntrance(index);
  }
}

// ══════════════════════════════════════════════
// Duty Schedule Section
// ══════════════════════════════════════════════
class _DutySection extends StatelessWidget {
  const _DutySection({required this.schedules, this.index = 0});
  final List<DutyScheduleItem> schedules;
  final int index;

  @override
  Widget build(BuildContext context) {
    if (schedules.isEmpty) {
      return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _SectionHeader(icon: Icons.pending_actions_rounded, label: 'Jadwal Piket Anda', index: index),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: _cCard,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 3)),
            ],
          ),
          child: Row(children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: const Color(0xFFE8F5F5),
                borderRadius: BorderRadius.circular(13),
              ),
              child: const Icon(Icons.free_breakfast_rounded, color: Color(0xFF9DBDBE), size: 24),
            ),
            const SizedBox(width: 14),
            Text('Tidak ada jadwal piket minggu ini.',
                style: _p(13, FontWeight.w500, _cText2)),
          ]),
        ).staggeredEntrance(index + 1),
      ]);
    }

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _SectionHeader(icon: Icons.pending_actions_rounded, label: 'Jadwal Piket Anda', index: index),
      const SizedBox(height: 12),
      ...schedules.asMap().entries.map((e) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: _DutyCard(schedule: e.value, index: index + e.key + 1),
      )),
    ]).staggeredEntrance(index);
  }
}

// ══════════════════════════════════════════════
// Duty Card
// ══════════════════════════════════════════════
class _DutyCard extends StatelessWidget {
  const _DutyCard({required this.schedule, required this.index});
  final DutyScheduleItem schedule;
  final int index;

  String _statusLabel(String s) => switch (s) {
    'SEDANG_BERLANGSUNG' => 'Sedang Berlangsung',
    'SELESAI'           => 'Selesai',
    _                   => 'Akan Datang',
  };

  Color _statusColor(String s) => switch (s) {
    'SEDANG_BERLANGSUNG' => AppColors.primary,
    'SELESAI'            => AppColors.success,
    _                    => const Color(0xFF38BDF8),
  };

  @override
  Widget build(BuildContext context) {
    final stColor = _statusColor(schedule.status);

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        showModalBottomSheet<void>(
          context: context,
          backgroundColor: Colors.transparent,
          isScrollControlled: true,
          builder: (_) => _DutyDetailSheet(schedule: schedule),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: _cCard,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(color: stColor.withValues(alpha: 0.12), blurRadius: 16, offset: const Offset(0, 5)),
            BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 6, offset: const Offset(0, 2)),
          ],
          border: Border.all(color: stColor.withValues(alpha: 0.1), width: 1.5),
        ),
        child: Row(children: [
          // Left color bar
          Container(
            width: 5,
            height: 96,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [stColor, stColor.withValues(alpha: 0.5)],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(20),
                bottomLeft: Radius.circular(20),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: _c1.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text('Shift ${schedule.shiftName}',
                        style: _p(11, FontWeight.w700, _c1)),
                  ),
                  const Spacer(),
                  StatusBadge(label: _statusLabel(schedule.status)),
                ]),
                const SizedBox(height: 8),
                Text(schedule.formattedDate, style: _p(15, FontWeight.w800, _cText1)),
                const SizedBox(height: 6),
                Row(children: [
                  Icon(Icons.access_time_rounded, size: 13, color: _cText2),
                  const SizedBox(width: 5),
                  Text(schedule.timeLabel, style: _p(12, FontWeight.w500, _cText2)),
                  const SizedBox(width: 12),
                  Icon(Icons.location_on_outlined, size: 13, color: _cText2),
                  const SizedBox(width: 4),
                  Expanded(child: Text(schedule.location,
                      style: _p(12, FontWeight.w500, _cText2),
                      overflow: TextOverflow.ellipsis)),
                ]),
              ]),
            ),
          ),
          const SizedBox(width: 12),
        ]),
      ),
    ).staggeredEntrance(index);
  }
}

// ══════════════════════════════════════════════
// Duty Detail Sheet
// ══════════════════════════════════════════════
class _DutyDetailSheet extends StatelessWidget {
  const _DutyDetailSheet({required this.schedule});
  final DutyScheduleItem schedule;

  String _statusLabel(String s) => switch (s) {
    'SEDANG_BERLANGSUNG' => 'Sedang Berlangsung',
    'SELESAI'            => 'Selesai',
    _                    => 'Akan Datang',
  };

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
      ),
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Handle
        Center(
          child: Container(
            width: 44,
            height: 4,
            decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
          ),
        ),
        const SizedBox(height: 24),

        // Header
        Row(children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF14B8BB), Color(0xFF0C7A7D)]),
              borderRadius: BorderRadius.circular(14),
              boxShadow: [BoxShadow(color: _c1.withValues(alpha: 0.35), blurRadius: 12, offset: const Offset(0, 4))],
            ),
            child: const Icon(Icons.calendar_month_rounded, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(child: Text('Detail Jadwal Piket',
              style: _p(19, FontWeight.w800, _cText1))),
          StatusBadge(label: _statusLabel(schedule.status)),
        ]),
        const SizedBox(height: 20),
        const Divider(height: 1),
        const SizedBox(height: 20),

        _SheetRow(Icons.event_rounded, 'Hari / Tanggal', schedule.formattedDate),
        const SizedBox(height: 14),
        _SheetRow(Icons.badge_outlined, 'Shift Kerja', 'Shift ${schedule.shiftName}'),
        const SizedBox(height: 14),
        _SheetRow(Icons.access_time_rounded, 'Waktu Piket', schedule.timeLabel),
        const SizedBox(height: 14),
        _SheetRow(Icons.location_on_outlined, 'Lokasi', schedule.location),
        if (schedule.notes.isNotEmpty) ...[
          const SizedBox(height: 14),
          _SheetRow(Icons.notes_rounded, 'Keterangan', schedule.notes),
        ],
        const SizedBox(height: 28),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: _c1,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 0,
              shadowColor: Colors.transparent,
            ).copyWith(
              overlayColor: WidgetStateProperty.all(Colors.white.withValues(alpha: 0.1)),
            ),
            child: Text('Tutup', style: _p(15, FontWeight.w700, Colors.white)),
          ),
        ),
      ]),
    );
  }
}

class _SheetRow extends StatelessWidget {
  const _SheetRow(this.icon, this.title, this.value);
  final IconData icon;
  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: _c1.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, size: 18, color: _c1),
      ),
      const SizedBox(width: 12),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: _p(11.5, FontWeight.w500, _cText2)),
        const SizedBox(height: 3),
        Text(value, style: _p(14, FontWeight.w700, _cText1)),
      ])),
    ]);
  }
}
