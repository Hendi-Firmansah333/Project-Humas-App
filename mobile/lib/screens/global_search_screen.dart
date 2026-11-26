import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:poli_humas/models/activity.dart';
import 'package:poli_humas/models/content_plan.dart';
import 'package:poli_humas/models/team_member.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/activities/activity_detail_screen.dart';
import 'package:poli_humas/screens/content/content_plan_detail_screen.dart';
import 'package:poli_humas/screens/live_location_screen.dart';
import 'package:poli_humas/screens/team_member_profile_screen.dart';
import 'package:poli_humas/services/local_storage.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/utils/app_navigator.dart';

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

class GlobalSearchScreen extends StatefulWidget {
  const GlobalSearchScreen({super.key});

  @override
  State<GlobalSearchScreen> createState() => _GlobalSearchScreenState();
}

class _GlobalSearchScreenState extends State<GlobalSearchScreen> {
  static const _recentSearchesKey = 'global_recent_searches_v1';
  static const _categories = ['Semua', 'Kegiatan', 'Personil', 'Konten', 'Lokasi'];

  final _searchController = TextEditingController();
  final _focusNode = FocusNode();

  String _query = '';
  String _selectedCategory = 'Semua';
  List<String> _recentSearches = [];

  @override
  void initState() {
    super.initState();
    _loadRecentSearches();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _loadRecentSearches() async {
    try {
      final raw = await LocalStorage.getString(_recentSearchesKey);
      if (raw != null && raw.isNotEmpty) {
        final decoded = jsonDecode(raw);
        if (decoded is List) {
          if (!mounted) return;
          setState(() {
            _recentSearches = decoded.map((e) => e.toString()).toList();
          });
          return;
        }
      }
    } catch (_) {}
  }

  Future<void> _saveRecentSearch(String term) async {
    final cleaned = term.trim();
    if (cleaned.length < 2) return;
    final updated = [
      cleaned,
      ..._recentSearches.where((e) => e.toLowerCase() != cleaned.toLowerCase()),
    ].take(6).toList();
    setState(() => _recentSearches = updated);
    await LocalStorage.setString(_recentSearchesKey, jsonEncode(updated));
  }

  Future<void> _removeRecentSearch(String term) async {
    final updated = _recentSearches.where((e) => e != term).toList();
    setState(() => _recentSearches = updated);
    await LocalStorage.setString(_recentSearchesKey, jsonEncode(updated));
  }

  Future<void> _clearRecentSearches() async {
    setState(() => _recentSearches = []);
    await LocalStorage.setString(_recentSearchesKey, '[]');
  }

  void _applyQuery(String value) {
    _searchController.text = value;
    _searchController.selection = TextSelection.fromPosition(
      TextPosition(offset: value.length),
    );
    setState(() => _query = value);
  }

  bool _matches(String text, String query) {
    if (query.isEmpty) return true;
    return text.toLowerCase().contains(query);
  }

  String _initials(String name) {
    final parts =
        name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return 'HM';
    if (parts.length == 1) {
      return parts.first.substring(0, parts.first.length >= 2 ? 2 : 1).toUpperCase();
    }
    return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppDataProvider>();
    final q = _query.trim().toLowerCase();
    final hasQuery = q.isNotEmpty;

    final allActivities = <ActivityItem>[
      ...provider.activitiesState.items,
      ...provider.historyState.items.where(
        (h) => !provider.activitiesState.items.any((a) => a.id == h.id),
      ),
    ];

    final matchedActivities = (_selectedCategory == 'Semua' ||
            _selectedCategory == 'Kegiatan')
        ? allActivities
            .where((item) =>
                _matches(item.title, q) ||
                _matches(item.description, q) ||
                _matches(item.location, q) ||
                _matches(item.jobDesk, q))
            .take(hasQuery ? 20 : 2)
            .toList()
        : <ActivityItem>[];

    final matchedMembers = (_selectedCategory == 'Semua' ||
            _selectedCategory == 'Personil')
        ? provider.teamMembers
            .where((m) =>
                _matches(m.name, q) ||
                _matches(m.division, q) ||
                _matches(m.location, q))
            .take(hasQuery ? 20 : 2)
            .toList()
        : <TeamMember>[];

    final matchedContent = (_selectedCategory == 'Semua' ||
            _selectedCategory == 'Konten')
        ? provider.contentPlansState.items
            .where((c) =>
                _matches(c.title, q) ||
                _matches(c.description, q) ||
                _matches(c.pic, q))
            .take(hasQuery ? 20 : 2)
            .toList()
        : <ContentPlanItem>[];

    // Unique locations from activities
    final seenLocs = <String>{};
    final matchedLocations = <ActivityItem>[];
    if (_selectedCategory == 'Semua' || _selectedCategory == 'Lokasi') {
      for (final act in allActivities) {
        final loc = act.location.trim();
        if (loc.isEmpty) continue;
        if (!_matches(loc, q) && !_matches(act.title, q)) continue;
        if (seenLocs.add(loc.toLowerCase())) {
          matchedLocations.add(act);
        }
        if (matchedLocations.length >= (hasQuery ? 10 : 1)) break;
      }
    }

    final totalCount = matchedActivities.length +
        matchedMembers.length +
        matchedContent.length +
        matchedLocations.length;

    return Scaffold(
      backgroundColor: const Color(0xFFF7FAFD),
      body: Column(
        children: [
          // ── DEEP OCEAN-NAVY TO TEAL HEADER + OVERLAPPING SEARCH CARD (Figma 5738:6204) ──
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: double.infinity,
                padding: EdgeInsets.fromLTRB(
                  16,
                  MediaQuery.of(context).padding.top + 14,
                  16,
                  44,
                ),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color(0xFF07253C),
                      Color(0xFF0B4A68),
                      Color(0xFF0E748A),
                    ],
                  ),
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(24),
                    bottomRight: Radius.circular(24),
                  ),
                ),
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    // Decorative concentric rings
                    Positioned(
                      right: -64,
                      top: -72,
                      child: Container(
                        width: 220,
                        height: 220,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.14),
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      right: -32,
                      top: -40,
                      child: Container(
                        width: 144,
                        height: 144,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.10),
                          ),
                        ),
                      ),
                    ),
                    Row(
                      children: [
                        InkWell(
                          onTap: () => Navigator.pop(context),
                          borderRadius: BorderRadius.circular(9999),
                          child: Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.15),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.arrow_back_rounded,
                              color: Colors.white,
                              size: 20,
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Pencarian',
                                style: _pj(
                                  20,
                                  FontWeight.w700,
                                  Colors.white,
                                  ls: -0.2,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'TIM HUMAS • Politeknik Negeri Lampung',
                                style: _pj(
                                  12,
                                  FontWeight.w400,
                                  const Color(0xFFCCF9FF),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Overlapping Floating Search Bar
              Positioned(
                left: 16,
                right: 16,
                bottom: -24,
                child: Container(
                  height: 52,
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: const Color(0xFFC4C6D0).withValues(alpha: 0.35),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF07253C).withValues(alpha: 0.10),
                        blurRadius: 15,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.search_rounded,
                        size: 20,
                        color: Color(0xFF006972),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: _searchController,
                          focusNode: _focusNode,
                          onChanged: (v) => setState(() => _query = v),
                          onSubmitted: (v) => _saveRecentSearch(v),
                          textInputAction: TextInputAction.search,
                          style: _pj(14, FontWeight.w500, const Color(0xFF181C1E)),
                          decoration: InputDecoration(
                            hintText: 'Cari kegiatan, personil, lokasi...',
                            hintStyle: _pj(
                              14,
                              FontWeight.w400,
                              const Color(0xFF747780),
                            ),
                            border: InputBorder.none,
                            isDense: true,
                          ),
                        ),
                      ),
                      GestureDetector(
                        onTap: () {
                          HapticFeedback.lightImpact();
                          if (_query.isNotEmpty) {
                            _searchController.clear();
                            setState(() => _query = '');
                          } else {
                            _focusNode.requestFocus();
                          }
                        },
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: const BoxDecoration(
                            color: Color(0xFFE0F7F4),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            _query.isNotEmpty
                                ? Icons.close_rounded
                                : Icons.tune_rounded,
                            size: 16,
                            color: const Color(0xFF006972),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 36),

          // ── MAIN SCROLLABLE BODY ──
          Expanded(
            child: ListView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
              children: [
                // ── CATEGORY FILTER CHIPS ──
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  child: Row(
                    children: _categories.map((cat) {
                      final selected = cat == _selectedCategory;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: GestureDetector(
                          onTap: () {
                            HapticFeedback.selectionClick();
                            setState(() => _selectedCategory = cat);
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 180),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: selected ? AppColors.primary : Colors.white,
                              borderRadius: BorderRadius.circular(9999),
                              border: selected
                                  ? null
                                  : Border.all(
                                      color: const Color(0xFFC4C6D0)
                                          .withValues(alpha: 0.5),
                                    ),
                            ),
                            child: Text(
                              cat,
                              style: _pj(
                                12,
                                FontWeight.w600,
                                selected ? Colors.white : const Color(0xFF43474F),
                                ls: 0.2,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),

                // ── PENCARIAN TERAKHIR ──
                if (_recentSearches.isNotEmpty && !hasQuery) ...[
                  const SizedBox(height: 22),
                  Row(
                    children: [
                      Text(
                        'PENCARIAN TERAKHIR',
                        style: _pj(
                          11,
                          FontWeight.w700,
                          const Color(0xFF43474F),
                          ls: 0.55,
                        ),
                      ),
                      const Spacer(),
                      GestureDetector(
                        onTap: _clearRecentSearches,
                        child: Text(
                          'Hapus Semua',
                          style: _pj(
                            11,
                            FontWeight.w600,
                            const Color(0xFF006972),
                            ls: 0.2,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _recentSearches.map((term) {
                      return Container(
                        padding: const EdgeInsets.fromLTRB(13, 7, 9, 7),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(9999),
                          border: Border.all(
                            color: const Color(0xFFC4C6D0).withValues(alpha: 0.4),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.03),
                              blurRadius: 2,
                              offset: const Offset(0, 1),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            GestureDetector(
                              onTap: () => _applyQuery(term),
                              child: Text(
                                term,
                                style: _pj(
                                  11.5,
                                  FontWeight.w600,
                                  const Color(0xFF181C1E),
                                ),
                              ),
                            ),
                            const SizedBox(width: 6),
                            GestureDetector(
                              onTap: () => _removeRecentSearch(term),
                              child: const Icon(
                                Icons.close_rounded,
                                size: 14,
                                color: Color(0xFF747780),
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ],

                const SizedBox(height: 22),

                // ── SECTION HEADER ──
                Row(
                  children: [
                    Text(
                      hasQuery
                          ? 'HASIL PENCARIAN'
                          : 'REKOMENDASI & AKSES CEPAT',
                      style: _pj(
                        11,
                        FontWeight.w700,
                        const Color(0xFF43474F),
                        ls: 0.55,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '$totalCount item',
                      style: _pj(
                        11,
                        FontWeight.w600,
                        const Color(0xFF006972),
                        ls: 0.2,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 10),

                if (totalCount == 0)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 36,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: const Color(0xFFC4C6D0).withValues(alpha: 0.25),
                      ),
                    ),
                    child: Column(
                      children: [
                        const Icon(
                          Icons.search_off_rounded,
                          size: 36,
                          color: Color(0xFF94A3B8),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          'Tidak ada hasil ditemukan',
                          style: _pj(14, FontWeight.w700, const Color(0xFF181C1E)),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Coba kata kunci lain atau ubah kategori pencarian.',
                          textAlign: TextAlign.center,
                          style: _pj(12, FontWeight.w400, const Color(0xFF43474F)),
                        ),
                      ],
                    ),
                  )
                else ...[
                  // ── KEGIATAN CARDS ──
                  ...matchedActivities.map((item) {
                    final statusBg = item.hasCheckedIn
                        ? const Color(0xFFDCFCE7)
                        : const Color(0xFFFEF3C7);
                    final statusFg = item.hasCheckedIn
                        ? const Color(0xFF15803D)
                        : const Color(0xFF92400E);
                    final statusText = item.hasCheckedIn
                        ? 'Sudah Presensi'
                        : (item.status == 'Selesai'
                            ? 'Selesai'
                            : 'Menunggu Presensi');

                    return _SearchInteractiveCard(
                      leading: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE0F7F4),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.camera_alt_outlined,
                          size: 20,
                          color: Color(0xFF0B6E75),
                        ),
                      ),
                      topWidget: Wrap(
                        spacing: 6,
                        runSpacing: 4,
                        children: [
                          _MiniTag(
                            label: item.jobDesk.isNotEmpty
                                ? item.jobDesk
                                : 'Kegiatan',
                            bg: const Color(0xFFE0F7F4),
                            fg: const Color(0xFF0B6E75),
                          ),
                          _MiniTag(
                            label: statusText,
                            bg: statusBg,
                            fg: statusFg,
                          ),
                        ],
                      ),
                      title: item.title,
                      subtitle:
                          '${item.time.isNotEmpty ? item.time : item.date} • ${item.location}',
                      onTap: () {
                        if (hasQuery) _saveRecentSearch(_query);
                        pushSmooth(context, ActivityDetailScreen(activity: item));
                      },
                    );
                  }),

                  // ── PERSONIL CARDS ──
                  ...matchedMembers.asMap().entries.map((entry) {
                    final idx = entry.key;
                    final member = entry.value;
                    final avatarColor =
                        idx.isEven ? AppColors.primary : const Color(0xFF006972);
                    return _SearchInteractiveCard(
                      leading: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: avatarColor,
                          shape: BoxShape.circle,
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          _initials(member.name),
                          style: _pj(15, FontWeight.w700, Colors.white),
                        ),
                      ),
                      titleRowWidget: Row(
                        children: [
                          Flexible(
                            child: Text(
                              member.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: _pj(
                                15,
                                FontWeight.w700,
                                const Color(0xFF181C1E),
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          _MiniTag(
                            label: member.isOnDuty ? 'Siaga' : 'Offline',
                            bg: member.isOnDuty
                                ? const Color(0xFFE0F7F4)
                                : const Color(0xFFEBEEF1),
                            fg: member.isOnDuty
                                ? const Color(0xFF0B6E75)
                                : const Color(0xFF43474F),
                          ),
                        ],
                      ),
                      subtitle: '${member.division} • ${member.location}',
                      onTap: () {
                        if (hasQuery) _saveRecentSearch(_query);
                        pushSmooth(
                          context,
                          TeamMemberProfileScreen(member: member),
                        );
                      },
                    );
                  }),

                  // ── KONTEN CARDS ──
                  ...matchedContent.map((plan) {
                    return _SearchInteractiveCard(
                      leading: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: const Color(0xFFCCF9FF),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.article_outlined,
                          size: 20,
                          color: Color(0xFF006972),
                        ),
                      ),
                      topWidget: Text(
                        'Konten Publikasi',
                        style: _pj(
                          11,
                          FontWeight.w600,
                          const Color(0xFF006972),
                          ls: 0.2,
                        ),
                      ),
                      title: plan.title,
                      subtitle: '${plan.statusLabel} • PIC ${plan.pic}',
                      onTap: () {
                        if (hasQuery) _saveRecentSearch(_query);
                        pushSmooth(
                          context,
                          ContentPlanDetailScreen(item: plan),
                        );
                      },
                    );
                  }),

                  // ── LOKASI CARDS ──
                  ...matchedLocations.map((act) {
                    return _SearchInteractiveCard(
                      leading: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE0F7F4),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.location_on_outlined,
                          size: 20,
                          color: Color(0xFF006972),
                        ),
                      ),
                      topWidget: Text(
                        'Titik Lokasi Liputan',
                        style: _pj(
                          11,
                          FontWeight.w600,
                          const Color(0xFF006972),
                          ls: 0.2,
                        ),
                      ),
                      title: act.location,
                      subtitle: 'Radius GPS Aktif • ${act.title}',
                      onTap: () {
                        if (hasQuery) _saveRecentSearch(_query);
                        pushSmooth(context, const LiveLocationScreen());
                      },
                    );
                  }),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SearchInteractiveCard extends StatelessWidget {
  const _SearchInteractiveCard({
    required this.leading,
    required this.subtitle,
    required this.onTap,
    this.topWidget,
    this.title,
    this.titleRowWidget,
  });

  final Widget leading;
  final Widget? topWidget;
  final String? title;
  final Widget? titleRowWidget;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: () {
            HapticFeedback.lightImpact();
            onTap();
          },
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: const Color(0xFFC4C6D0).withValues(alpha: 0.28),
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF07253C).withValues(alpha: 0.04),
                  blurRadius: 4,
                  offset: const Offset(0, 1),
                ),
              ],
            ),
            child: Row(
              children: [
                leading,
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (topWidget != null) ...[
                        topWidget!,
                        const SizedBox(height: 4),
                      ],
                      if (titleRowWidget != null)
                        titleRowWidget!
                      else if (title != null)
                        Text(
                          title!,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: _pj(
                            15,
                            FontWeight.w700,
                            const Color(0xFF181C1E),
                            height: 1.3,
                          ),
                        ),
                      const SizedBox(height: 3),
                      Text(
                        subtitle,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: _pj(
                          12,
                          FontWeight.w400,
                          const Color(0xFF43474F),
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(
                  Icons.chevron_right_rounded,
                  size: 20,
                  color: Color(0xFF747780),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _MiniTag extends StatelessWidget {
  const _MiniTag({
    required this.label,
    required this.bg,
    required this.fg,
  });

  final String label;
  final Color bg;
  final Color fg;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(9999),
      ),
      child: Text(
        label,
        style: _pj(11, FontWeight.w600, fg, ls: 0.2),
      ),
    );
  }
}
