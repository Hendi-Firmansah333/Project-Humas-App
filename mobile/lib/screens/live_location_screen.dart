import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:poli_humas/models/team_member.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/live_location_map_screen.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/widgets/app_map_view.dart';
import 'package:poli_humas/widgets/live_location_detail_sheet.dart';

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

class LiveLocationScreen extends StatefulWidget {
  const LiveLocationScreen({super.key});

  @override
  State<LiveLocationScreen> createState() => _LiveLocationScreenState();
}

class _LiveLocationScreenState extends State<LiveLocationScreen> {
  static const _divisionFilters = ['Semua', 'Liputan', 'Konten Digital', 'Media Sosial'];

  final TextEditingController _searchController = TextEditingController();
  Timer? _refreshTimer;
  String _searchQuery = '';
  String _quickFilter = 'Semua'; // 'Semua', 'Siaga', 'Standby', 'GSG', 'Rektorat'
  String _divisionFilter = 'Semua';
  bool _onDutyOnly = false;
  TeamMember? _selectedMember;
  bool _isRefreshing = false;

  @override
  void initState() {
    super.initState();
    _refreshTimer = Timer.periodic(const Duration(seconds: 25), (_) {
      if (mounted) {
        context.read<AppDataProvider>().refreshTeamLocations();
      }
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _handleRefresh() async {
    HapticFeedback.lightImpact();
    setState(() => _isRefreshing = true);
    await context.read<AppDataProvider>().refreshTeamLocations();
    if (mounted) {
      setState(() => _isRefreshing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Lokasi tim berhasil diperbarui',
            style: _pj(12, FontWeight.w600, Colors.white),
          ),
          backgroundColor: const Color(0xFF003D58),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  List<TeamMember> _filterMembers(List<TeamMember> members) {
    return members.where((m) {
      // 1. Text Search query
      if (_searchQuery.isNotEmpty) {
        final query = _searchQuery.toLowerCase();
        final matchesName = m.name.toLowerCase().contains(query);
        final matchesDivision = m.division.toLowerCase().contains(query);
        final matchesLocation = m.location.toLowerCase().contains(query);
        if (!matchesName && !matchesDivision && !matchesLocation) return false;
      }

      // 2. Division modal filter
      if (_divisionFilter != 'Semua') {
        if (!m.division.toLowerCase().contains(_divisionFilter.toLowerCase())) {
          return false;
        }
      }

      // 3. Modal duty filter
      if (_onDutyOnly && !m.isOnDuty) return false;

      // 4. Quick horizontal chip filter
      switch (_quickFilter) {
        case 'Siaga':
          return m.isOnDuty;
        case 'Standby':
          return !m.isOnDuty;
        case 'GSG':
          return m.location.toLowerCase().contains('gsg');
        case 'Rektorat':
          return m.location.toLowerCase().contains('rektorat') ||
              m.location.toLowerCase().contains('direktorat');
        case 'Liputan':
          return m.division.toLowerCase().contains('liputan') ||
              m.division.toLowerCase().contains('dokumentasi');
        case 'Konten':
          return m.division.toLowerCase().contains('konten');
        case 'Semua':
        default:
          return true;
      }
    }).toList();
  }

  String _formatLastUpdated(TeamMember member) {
    final updated = member.lastUpdated;
    if (updated == null) return 'Baru saja';
    final diff = DateTime.now().difference(updated);
    if (diff.inMinutes < 1) return 'Baru saja';
    if (diff.inMinutes < 60) return '${diff.inMinutes} mnt lalu';
    return '${diff.inHours} jam lalu';
  }

  LatLng _getMapCenter(List<TeamMember> members) {
    if (_selectedMember != null) {
      return LatLng(_selectedMember!.latitude, _selectedMember!.longitude);
    }
    final onDuty = members.where((m) => m.isOnDuty).toList();
    final source = onDuty.isNotEmpty ? onDuty : members;
    if (source.isEmpty) return const LatLng(-5.3582, 105.2318);
    final lat = source.map((m) => m.latitude).reduce((a, b) => a + b) / source.length;
    final lng = source.map((m) => m.longitude).reduce((a, b) => a + b) / source.length;
    return LatLng(lat, lng);
  }

  void _showMemberDetail(TeamMember member) {
    showLiveLocationDetailSheet(
      context,
      member: member,
      lastUpdatedLabel: _formatLastUpdated(member),
    );
  }

  void _openFullscreenMap(List<TeamMember> members, {TeamMember? focusMember}) {
    HapticFeedback.lightImpact();
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => LiveLocationMapScreen(
          members: members,
          focusMember: focusMember,
        ),
      ),
    );
  }

  Future<void> _openWhatsApp(TeamMember member) async {
    HapticFeedback.lightImpact();
    final phone = member.phone?.replaceAll(RegExp(r'[^0-9]'), '') ?? '';
    if (phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Nomor WhatsApp ${member.name} belum tersedia.',
            style: _pj(12, FontWeight.w600, Colors.white),
          ),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      return;
    }
    final uri = Uri.parse('https://wa.me/$phone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _showFilterDialog() async {
    HapticFeedback.lightImpact();
    var division = _divisionFilter;
    var onDutyOnly = _onDutyOnly;

    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) {
          final isDark = AppColors.isDark;
          return Container(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : Colors.white,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.15),
                  blurRadius: 20,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 44,
                    height: 5,
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white24 : AppColors.slate300,
                      borderRadius: BorderRadius.circular(2.5),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Filter Anggota Tim',
                      style: _pj(17, FontWeight.w800, isDark ? Colors.white : AppColors.slate900),
                    ),
                    TextButton(
                      onPressed: () {
                        setDialogState(() {
                          division = 'Semua';
                          onDutyOnly = false;
                        });
                      },
                      child: Text(
                        'Reset',
                        style: _pj(12, FontWeight.w700, const Color(0xFF003D58)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Text(
                  'Divisi Humas',
                  style: _pj(12, FontWeight.w700, isDark ? Colors.white70 : AppColors.slate600),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _divisionFilters.map((filter) {
                    final selected = filter == division;
                    return GestureDetector(
                      onTap: () => setDialogState(() => division = filter),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: selected
                              ? const Color(0xFF003D58)
                              : (isDark ? Colors.white10 : const Color(0xFFF1F5F9)),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: selected
                                ? const Color(0xFF003D58)
                                : (isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
                          ),
                        ),
                        child: Text(
                          filter,
                          style: _pj(
                            12,
                            FontWeight.w700,
                            selected ? Colors.white : (isDark ? Colors.white70 : AppColors.slate700),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 18),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white.withValues(alpha: 0.05) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    activeThumbColor: const Color(0xFF003D58),
                    title: Text(
                      'Hanya yang sedang siaga / bertugas',
                      style: _pj(13, FontWeight.w700, isDark ? Colors.white : AppColors.slate800),
                    ),
                    subtitle: Text(
                      'Saring personil yang sedang aktif di lokasi',
                      style: _pj(11, FontWeight.w500, AppColors.slate400),
                    ),
                    value: onDutyOnly,
                    onChanged: (value) => setDialogState(() => onDutyOnly = value),
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () {
                      setState(() {
                        _divisionFilter = division;
                        _onDutyOnly = onDutyOnly;
                      });
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF003D58),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: Text('Terapkan Filter', style: _pj(14, FontWeight.w800, Colors.white)),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;

    return Consumer<AppDataProvider>(
      builder: (context, provider, _) {
        final allMembers = provider.teamMembers;
        final filtered = _filterMembers(allMembers);
        final activeCount = allMembers.where((m) => m.isOnDuty).length;
        final totalCount = allMembers.length;
        final standbyCount = totalCount - activeCount;

        final targetFocusMember = _selectedMember ??
            filtered.where((m) => m.isOnDuty).firstOrNull ??
            filtered.firstOrNull;

        final mapCenter = _getMapCenter(filtered);

        final markers = filtered
            .map(
              (m) => MapMarkerData(
                id: m.id,
                point: LatLng(m.latitude, m.longitude),
                label: m.name.split(' ').first,
                initials: m.initials,
                isActive: m.isOnDuty,
                isSelected: targetFocusMember?.id == m.id,
              ),
            )
            .toList();

        return Scaffold(
          backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
          appBar: AppBar(
            backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
            elevation: 0,
            leading: IconButton(
              icon: Icon(
                Icons.arrow_back_ios_new_rounded,
                size: 19,
                color: isDark ? Colors.white : AppColors.slate800,
              ),
              onPressed: () => Navigator.pop(context),
            ),
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Pantau Lokasi Tim',
                  style: _pj(
                    17,
                    FontWeight.w900,
                    isDark ? Colors.white : const Color(0xFF003D58),
                    ls: -0.3,
                  ),
                ),
                Row(
                  children: [
                    Container(
                      width: 7,
                      height: 7,
                      decoration: BoxDecoration(
                        color: provider.isOffline ? AppColors.warning : AppColors.emerald,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: (provider.isOffline ? AppColors.warning : AppColors.emerald)
                                .withValues(alpha: 0.5),
                            blurRadius: 4,
                            spreadRadius: 1,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      provider.isOffline ? 'Mode Offline' : 'Real-time GPS Aktif',
                      style: _pj(
                        11,
                        FontWeight.w600,
                        isDark ? Colors.white60 : AppColors.slate500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            actions: [
              IconButton(
                tooltip: 'Perbarui Lokasi',
                icon: _isRefreshing
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF003D58)),
                      )
                    : Icon(
                        Icons.sync_rounded,
                        size: 22,
                        color: isDark ? Colors.white70 : const Color(0xFF003D58),
                      ),
                onPressed: _isRefreshing ? null : _handleRefresh,
              ),
              IconButton(
                tooltip: 'Peta Layar Penuh',
                icon: Icon(
                  Icons.fullscreen_rounded,
                  size: 26,
                  color: isDark ? Colors.white70 : const Color(0xFF003D58),
                ),
                onPressed: () => _openFullscreenMap(allMembers, focusMember: targetFocusMember),
              ),
              const SizedBox(width: 4),
            ],
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(1),
              child: Container(
                height: 1,
                color: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
              ),
            ),
          ),
          body: Column(
            children: [
              // ── Search & Filter Row ──
              Container(
                color: isDark ? const Color(0xFF1E293B) : Colors.white,
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
                child: Column(
                  children: [
                    // Search Bar
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            height: 42,
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
                              ),
                            ),
                            child: TextField(
                              controller: _searchController,
                              onChanged: (val) => setState(() => _searchQuery = val.trim()),
                              style: _pj(13, FontWeight.w600, isDark ? Colors.white : AppColors.slate900),
                              decoration: InputDecoration(
                                hintText: 'Cari personil atau lokasi (GSG, Rektorat)...',
                                hintStyle: _pj(12, FontWeight.w500, AppColors.slate400),
                                prefixIcon: const Icon(
                                  Icons.search_rounded,
                                  size: 20,
                                  color: Color(0xFF64748B),
                                ),
                                suffixIcon: _searchQuery.isNotEmpty
                                    ? GestureDetector(
                                        onTap: () {
                                          _searchController.clear();
                                          setState(() => _searchQuery = '');
                                        },
                                        child: const Icon(Icons.close_rounded, size: 18, color: Color(0xFF64748B)),
                                      )
                                    : null,
                                border: InputBorder.none,
                                contentPadding: const EdgeInsets.symmetric(vertical: 10),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: _showFilterDialog,
                          child: Container(
                            height: 42,
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            decoration: BoxDecoration(
                              color: (_divisionFilter != 'Semua' || _onDutyOnly)
                                  ? const Color(0xFF003D58)
                                  : (isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9)),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: (_divisionFilter != 'Semua' || _onDutyOnly)
                                    ? const Color(0xFF003D58)
                                    : (isDark ? Colors.white10 : const Color(0xFFE2E8F0)),
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.tune_rounded,
                                  size: 18,
                                  color: (_divisionFilter != 'Semua' || _onDutyOnly)
                                      ? Colors.white
                                      : (isDark ? Colors.white70 : const Color(0xFF003D58)),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  'Filter',
                                  style: _pj(
                                    12,
                                    FontWeight.w700,
                                    (_divisionFilter != 'Semua' || _onDutyOnly)
                                        ? Colors.white
                                        : (isDark ? Colors.white70 : const Color(0xFF003D58)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 10),

                    // Quick Chips
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      physics: const BouncingScrollPhysics(),
                      child: Row(
                        children: [
                          _buildQuickChip(
                            label: 'Semua',
                            count: totalCount,
                            isSelected: _quickFilter == 'Semua',
                            onTap: () => setState(() => _quickFilter = 'Semua'),
                          ),
                          _buildQuickChip(
                            label: 'Siaga Bertugas',
                            count: activeCount,
                            dotColor: AppColors.emerald,
                            isSelected: _quickFilter == 'Siaga',
                            onTap: () => setState(() => _quickFilter = 'Siaga'),
                          ),
                          _buildQuickChip(
                            label: 'Standby',
                            count: standbyCount,
                            dotColor: AppColors.amber,
                            isSelected: _quickFilter == 'Standby',
                            onTap: () => setState(() => _quickFilter = 'Standby'),
                          ),
                          _buildQuickChip(
                            label: 'GSG Polinela',
                            isSelected: _quickFilter == 'GSG',
                            onTap: () => setState(() => _quickFilter = 'GSG'),
                          ),
                          _buildQuickChip(
                            label: 'Rektorat',
                            isSelected: _quickFilter == 'Rektorat',
                            onTap: () => setState(() => _quickFilter = 'Rektorat'),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // ── Map Container Preview (Figma Node #4383:5462) ──
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
                child: Container(
                  height: 250,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(22),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF003D58).withValues(alpha: 0.12),
                        blurRadius: 18,
                        offset: const Offset(0, 6),
                      ),
                    ],
                    border: Border.all(
                      color: const Color(0xFF00B4D8).withValues(alpha: 0.25),
                      width: 1.5,
                    ),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(22),
                    child: Stack(
                      children: [
                        AppMapView(
                          center: mapCenter,
                          zoom: 16.5,
                          height: 250,
                          markers: markers,
                          interactive: true,
                          onMarkerTap: (marker) {
                            final member = filtered.firstWhere((m) => m.id == marker.id);
                            setState(() => _selectedMember = member);
                          },
                        ),

                        // Top-Left Badge: Area Kampus
                        Positioned(
                          top: 12,
                          left: 12,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: const Color(0xFF003D58).withValues(alpha: 0.92),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: const Color(0xFF38BDF8).withValues(alpha: 0.4)),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.25),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.near_me_rounded,
                                  size: 12,
                                  color: Color(0xFF38BDF8),
                                ),
                                const SizedBox(width: 5),
                                Text(
                                  'AREA KAMPUS POLINELA',
                                  style: _pj(9.5, FontWeight.w800, Colors.white, ls: 0.5),
                                ),
                              ],
                            ),
                          ),
                        ),

                        // Top-Right Control Buttons
                        Positioned(
                          top: 12,
                          right: 12,
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              // Recenter button
                              GestureDetector(
                                onTap: () {
                                  HapticFeedback.lightImpact();
                                  setState(() => _selectedMember = null);
                                },
                                child: Container(
                                  width: 36,
                                  height: 36,
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.95),
                                    shape: BoxShape.circle,
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.2),
                                        blurRadius: 8,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  child: const Icon(
                                    Icons.my_location_rounded,
                                    size: 18,
                                    color: Color(0xFF003D58),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              // Fullscreen button
                              GestureDetector(
                                onTap: () => _openFullscreenMap(allMembers, focusMember: targetFocusMember),
                                child: Container(
                                  width: 36,
                                  height: 36,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF003D58),
                                    shape: BoxShape.circle,
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.2),
                                        blurRadius: 8,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  child: const Icon(
                                    Icons.open_in_full_rounded,
                                    size: 16,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Floating Card for selected or primary active member
                        if (targetFocusMember != null)
                          Positioned(
                            bottom: 10,
                            left: 10,
                            right: 10,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              decoration: BoxDecoration(
                                color: isDark
                                    ? const Color(0xFF1E293B).withValues(alpha: 0.96)
                                    : Colors.white.withValues(alpha: 0.96),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: const Color(0xFF00B4D8).withValues(alpha: 0.3),
                                  width: 1.2,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.2),
                                    blurRadius: 14,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Row(
                                children: [
                                  // Avatar
                                  Container(
                                    width: 40,
                                    height: 40,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFE0F2FE),
                                      shape: BoxShape.circle,
                                      border: Border.all(color: const Color(0xFF003D58), width: 1.5),
                                    ),
                                    alignment: Alignment.center,
                                    child: Text(
                                      targetFocusMember.initials,
                                      style: _pj(13, FontWeight.w900, const Color(0xFF003D58)),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  // Member Info
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Row(
                                          children: [
                                            Flexible(
                                              child: Text(
                                                targetFocusMember.name,
                                                style: _pj(
                                                  13,
                                                  FontWeight.w800,
                                                  isDark ? Colors.white : AppColors.slate900,
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                            const SizedBox(width: 6),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                              decoration: BoxDecoration(
                                                color: targetFocusMember.isOnDuty
                                                    ? const Color(0xFFECFDF5)
                                                    : const Color(0xFFFFFBEB),
                                                borderRadius: BorderRadius.circular(6),
                                              ),
                                              child: Text(
                                                targetFocusMember.isOnDuty ? 'Siaga' : 'Standby',
                                                style: _pj(
                                                  9,
                                                  FontWeight.w800,
                                                  targetFocusMember.isOnDuty
                                                      ? const Color(0xFF059669)
                                                      : const Color(0xFFD97706),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          '${targetFocusMember.distance} • ${targetFocusMember.location}',
                                          style: _pj(
                                            10.5,
                                            FontWeight.w600,
                                            isDark ? Colors.white70 : AppColors.slate600,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  // WhatsApp Shortcut Button
                                  GestureDetector(
                                    onTap: () => _openWhatsApp(targetFocusMember),
                                    child: Container(
                                      width: 34,
                                      height: 34,
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF25D366).withValues(alpha: 0.15),
                                        shape: BoxShape.circle,
                                        border: Border.all(
                                          color: const Color(0xFF25D366).withValues(alpha: 0.5),
                                        ),
                                      ),
                                      child: const Icon(
                                        Icons.chat_bubble_rounded,
                                        size: 16,
                                        color: Color(0xFF16A34A),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  // Detail Button
                                  ElevatedButton(
                                    onPressed: () => _showMemberDetail(targetFocusMember),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF003D58),
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                      minimumSize: Size.zero,
                                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                      elevation: 0,
                                    ),
                                    child: Text('Detail', style: _pj(10.5, FontWeight.w800, Colors.white)),
                                  ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ),

              // ── Personnel List Section Header ──
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 10, 20, 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Text(
                          'Personil di Lapangan',
                          style: _pj(
                            14.5,
                            FontWeight.w800,
                            isDark ? Colors.white : const Color(0xFF003D58),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE0F2FE),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFBAE6FD)),
                          ),
                          child: Text(
                            '$activeCount/$totalCount Siaga',
                            style: _pj(
                              10,
                              FontWeight.w800,
                              const Color(0xFF0369A1),
                            ),
                          ),
                        ),
                      ],
                    ),
                    Text(
                      'Pilih untuk fokus peta',
                      style: _pj(10.5, FontWeight.w500, AppColors.slate400),
                    ),
                  ],
                ),
              ),

              // ── Personnel List ──
              Expanded(
                child: filtered.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.location_off_rounded,
                              size: 40,
                              color: AppColors.slate300,
                            ),
                            const SizedBox(height: 10),
                            Text(
                              'Tidak ada personil yang cocok dengan filter.',
                              style: _pj(12, FontWeight.w600, AppColors.slate500),
                            ),
                            const SizedBox(height: 6),
                            TextButton(
                              onPressed: () {
                                setState(() {
                                  _searchController.clear();
                                  _searchQuery = '';
                                  _quickFilter = 'Semua';
                                  _divisionFilter = 'Semua';
                                  _onDutyOnly = false;
                                });
                              },
                              child: Text(
                                'Reset Semua Filter',
                                style: _pj(12, FontWeight.w700, const Color(0xFF003D58)),
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                        physics: const BouncingScrollPhysics(),
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          final member = filtered[index];
                          final isSelected = targetFocusMember?.id == member.id;
                          return _TeamMemberCard(
                            member: member,
                            isSelected: isSelected,
                            lastUpdatedLabel: _formatLastUpdated(member),
                            onTap: () {
                              HapticFeedback.lightImpact();
                              setState(() => _selectedMember = member);
                            },
                            onDetailTap: () => _showMemberDetail(member),
                            onWhatsAppTap: () => _openWhatsApp(member),
                            onViewMap: () => _openFullscreenMap(allMembers, focusMember: member),
                          );
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildQuickChip({
    required String label,
    int? count,
    Color? dotColor,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    final isDark = AppColors.isDark;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: isSelected
                ? const Color(0xFF003D58)
                : (isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9)),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isSelected
                  ? const Color(0xFF003D58)
                  : (isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (dotColor != null) ...[
                Container(
                  width: 6,
                  height: 6,
                  decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle),
                ),
                const SizedBox(width: 5),
              ],
              Text(
                label,
                style: _pj(
                  11.5,
                  FontWeight.w700,
                  isSelected ? Colors.white : (isDark ? Colors.white70 : const Color(0xFF475569)),
                ),
              ),
              if (count != null) ...[
                const SizedBox(width: 5),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? Colors.white.withValues(alpha: 0.2)
                        : (isDark ? Colors.white10 : const Color(0xFFE2E8F0)),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '$count',
                    style: _pj(
                      9.5,
                      FontWeight.w800,
                      isSelected ? Colors.white : const Color(0xFF64748B),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _TeamMemberCard extends StatelessWidget {
  const _TeamMemberCard({
    required this.member,
    required this.isSelected,
    required this.lastUpdatedLabel,
    required this.onTap,
    required this.onDetailTap,
    required this.onWhatsAppTap,
    required this.onViewMap,
  });

  final TeamMember member;
  final bool isSelected;
  final String lastUpdatedLabel;
  final VoidCallback onTap;
  final VoidCallback onDetailTap;
  final VoidCallback onWhatsAppTap;
  final VoidCallback onViewMap;

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(18),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: isSelected
                    ? const Color(0xFF00B4D8)
                    : (isDark ? Colors.white10 : const Color(0xFFF1F5F9)),
                width: isSelected ? 1.8 : 1,
              ),
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                        color: const Color(0xFF00B4D8).withValues(alpha: 0.2),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ]
                  : AppColors.shadowSoft,
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Avatar with online status
                Stack(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF003D58).withValues(alpha: 0.4)
                            : const Color(0xFFE0F2FE),
                        border: Border.all(
                          color: isSelected
                              ? const Color(0xFF00B4D8)
                              : const Color(0xFF003D58).withValues(alpha: 0.3),
                          width: 1.5,
                        ),
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        member.initials,
                        style: _pj(13, FontWeight.w900, const Color(0xFF003D58)),
                      ),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: member.isOnDuty ? AppColors.emerald : AppColors.amber,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: isDark ? const Color(0xFF1E293B) : Colors.white,
                            width: 2,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 12),

                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Name & Status Pill
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              member.name,
                              style: _pj(
                                13.5,
                                FontWeight.w800,
                                isDark ? Colors.white : AppColors.slate900,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: member.isOnDuty
                                  ? const Color(0xFFECFDF5)
                                  : const Color(0xFFFFFBEB),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              member.isOnDuty ? 'Siaga' : 'Standby',
                              style: _pj(
                                9,
                                FontWeight.w800,
                                member.isOnDuty
                                    ? const Color(0xFF059669)
                                    : const Color(0xFFD97706),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      // Division
                      Text(
                        member.division,
                        style: _pj(
                          10.5,
                          FontWeight.w700,
                          const Color(0xFF003D58),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 3),
                      // Location & Distance
                      Row(
                        children: [
                          const Icon(
                            Icons.location_on_rounded,
                            size: 12,
                            color: Color(0xFF00B4D8),
                          ),
                          const SizedBox(width: 3),
                          Expanded(
                            child: Text(
                              '${member.distance} • ${member.location}',
                              style: _pj(
                                10.5,
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

                // Actions: WhatsApp & Detail/Map
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // WhatsApp button
                    IconButton(
                      onPressed: onWhatsAppTap,
                      tooltip: 'Chat WhatsApp',
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                      icon: Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: const Color(0xFF25D366).withValues(alpha: 0.12),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.chat_bubble_rounded,
                          size: 15,
                          color: Color(0xFF16A34A),
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),
                    // Detail / Map button
                    GestureDetector(
                      onTap: onDetailTap,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? const Color(0xFF003D58)
                              : (isDark ? Colors.white10 : const Color(0xFFF1F5F9)),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          'Detail',
                          style: _pj(
                            11,
                            FontWeight.w700,
                            isSelected
                                ? Colors.white
                                : (isDark ? Colors.white70 : const Color(0xFF003D58)),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
