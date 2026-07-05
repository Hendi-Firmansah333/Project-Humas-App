import 'dart:async';

import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:poli_humas/models/team_member.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/live_location_map_screen.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/widgets/app_map_view.dart';
import 'package:poli_humas/widgets/common_widgets.dart';
import 'package:poli_humas/widgets/live_location_detail_sheet.dart';

class LiveLocationScreen extends StatefulWidget {
  const LiveLocationScreen({super.key});

  @override
  State<LiveLocationScreen> createState() => _LiveLocationScreenState();
}

class _LiveLocationScreenState extends State<LiveLocationScreen> {
  static const _divisionFilters = ['Semua', 'Liputan', 'Konten Digital', 'Media Sosial'];

  Timer? _refreshTimer;
  String _divisionFilter = 'Semua';
  bool _onDutyOnly = false;

  @override
  void initState() {
    super.initState();
    _refreshTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      context.read<AppDataProvider>().refreshTeamLocations();
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  List<TeamMember> _filteredMembers(List<TeamMember> members) {
    return members.where((member) {
      final matchesDivision = _divisionFilter == 'Semua' ||
          member.division.toLowerCase().contains(_divisionFilter.toLowerCase());
      final matchesDuty = !_onDutyOnly || member.isOnDuty;
      return matchesDivision && matchesDuty;
    }).toList();
  }

  Future<void> _showFilterDialog() async {
    var division = _divisionFilter;
    var onDutyOnly = _onDutyOnly;

    await showDialog<void>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Filter Tim', style: TextStyle(fontWeight: FontWeight.w800)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Divisi', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _divisionFilters.map((filter) {
                  final selected = filter == division;
                  return ChoiceChip(
                    label: Text(filter),
                    selected: selected,
                    onSelected: (_) => setDialogState(() => division = filter),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Hanya yang sedang bertugas'),
                value: onDutyOnly,
                onChanged: (value) => setDialogState(() => onDutyOnly = value),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Batal')),
            TextButton(
              onPressed: () {
                setState(() {
                  _divisionFilter = division;
                  _onDutyOnly = onDutyOnly;
                });
                Navigator.pop(context);
              },
              child: const Text('Terapkan'),
            ),
          ],
        ),
      ),
    );
  }

  String _formatLastUpdated(TeamMember member) {
    final updated = member.lastUpdated;
    if (updated == null) return 'Belum ada update';
    final diff = DateTime.now().difference(updated);
    if (diff.inMinutes < 1) return 'Baru saja';
    if (diff.inMinutes < 60) return 'Update ${diff.inMinutes} mnt lalu';
    return 'Update ${diff.inHours} jam lalu';
  }

  LatLng _mapCenter(List<TeamMember> members) {
    final onDuty = members.where((m) => m.isOnDuty).toList();
    final source = onDuty.isNotEmpty ? onDuty : members;
    if (source.isEmpty) return const LatLng(-5.3595, 105.2318);
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

  @override
  Widget build(BuildContext context) {
    return Consumer<AppDataProvider>(
      builder: (context, provider, _) {
        final allMembers = provider.teamMembers;
        final filtered = _filteredMembers(allMembers);
        final activeMember = filtered.where((m) => m.isOnDuty).firstOrNull ?? filtered.firstOrNull;
        final mapCenter = _mapCenter(filtered);
        final markers = filtered
            .map(
              (m) => MapMarkerData(
                id: m.id,
                point: LatLng(m.latitude, m.longitude),
                label: m.initials,
                isActive: m.isOnDuty,
              ),
            )
            .toList();

        return Scaffold(
          backgroundColor: AppColors.primary,
          appBar: AppHeader(
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
              onPressed: () => Navigator.pop(context),
            ),
          ),
          body: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                child: Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Live Location Tim',
                              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: BoxDecoration(
                                    color: provider.isOffline ? AppColors.warning : AppColors.success,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  provider.isOffline ? 'Offline' : 'Monitoring Aktif',
                                  style: TextStyle(
                                    color: provider.isOffline ? AppColors.warning : AppColors.success,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    GestureDetector(
                      onTap: () => _openFullscreenMap(filtered),
                      child: Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(Icons.my_location, color: AppColors.primary),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Expanded(
                flex: 3,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      return Stack(
                        children: [
                          RepaintBoundary(
                            child: AppMapView(
                            center: mapCenter,
                            zoom: 16,
                            height: constraints.maxHeight,
                            markers: markers,
                            interactive: true,
                            onMarkerTap: (marker) {
                              final member = filtered.firstWhere((m) => m.id == marker.id);
                              _showMemberDetail(member);
                            },
                          ),
                          ),
                          if (activeMember != null)
                            Positioned(
                              top: 12,
                              left: 12,
                              right: 12,
                              child: GestureDetector(
                                onTap: () => _showMemberDetail(activeMember),
                                child: Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.1),
                                      blurRadius: 12,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: Row(
                                  children: [
                                    PicAvatar(initials: activeMember.initials, size: 48),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            activeMember.name,
                                            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                                          ),
                                          Text(
                                            activeMember.division,
                                            style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                                          ),
                                          const SizedBox(height: 6),
                                          Row(
                                            children: [
                                              const Text(
                                                'Status',
                                                style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                                              ),
                                              const SizedBox(width: 8),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: (activeMember.isOnDuty ? AppColors.success : AppColors.warning)
                                                      .withValues(alpha: 0.12),
                                                  borderRadius: BorderRadius.circular(12),
                                                ),
                                                child: Text(
                                                  activeMember.isOnDuty ? 'Sedang Bertugas' : 'Tidak Bertugas',
                                                  style: TextStyle(
                                                    color: activeMember.isOnDuty ? AppColors.success : AppColors.warning,
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.w700,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            _formatLastUpdated(activeMember),
                                            style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
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
                      );
                    },
                  ),
                ),
              ),
              Expanded(
                flex: 2,
                child: Container(
                  margin: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Text(
                            'Anggota Tim (${filtered.length})',
                            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                          ),
                          const Spacer(),
                          GestureDetector(
                            onTap: _showFilterDialog,
                            child: const Row(
                              children: [
                                Icon(Icons.tune, size: 18, color: AppColors.textSecondary),
                                SizedBox(width: 4),
                                Text(
                                  'Filter',
                                  style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      if (_divisionFilter != 'Semua' || _onDutyOnly) ...[
                        const SizedBox(height: 8),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Wrap(
                            spacing: 6,
                            children: [
                              if (_divisionFilter != 'Semua')
                                Chip(
                                  label: Text(_divisionFilter, style: const TextStyle(fontSize: 11)),
                                  visualDensity: VisualDensity.compact,
                                ),
                              if (_onDutyOnly)
                                const Chip(
                                  label: Text('Sedang Bertugas', style: TextStyle(fontSize: 11)),
                                  visualDensity: VisualDensity.compact,
                                ),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 12),
                      Expanded(
                        child: filtered.isEmpty
                            ? const Center(
                                child: Text(
                                  'Tidak ada anggota tim pada filter ini.',
                                  style: TextStyle(color: AppColors.textSecondary),
                                ),
                              )
                            : ListView.builder(
                                padding: const EdgeInsets.only(bottom: 16),
                                itemCount: filtered.length,
                                itemBuilder: (context, index) {
                                  final member = filtered[index];
                                  return _TeamMemberTile(
                                    member: member,
                                    lastUpdatedLabel: _formatLastUpdated(member),
                                    onTap: () => _showMemberDetail(member),
                                    onViewMap: () => _openFullscreenMap(filtered, focusMember: member),
                                  );
                                },
                              ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _TeamMemberTile extends StatelessWidget {
  const _TeamMemberTile({
    required this.member,
    required this.lastUpdatedLabel,
    required this.onTap,
    required this.onViewMap,
  });

  final TeamMember member;
  final String lastUpdatedLabel;
  final VoidCallback onTap;
  final VoidCallback onViewMap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(
        children: [
          Stack(
            children: [
              PicAvatar(initials: member.initials, size: 40),
              if (member.isOnDuty)
                Positioned(
                  right: 0,
                  bottom: 0,
                  child: Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: AppColors.success,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(member.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                Text(
                  '${member.distance} • ${member.location}',
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                ),
                Text(
                  lastUpdatedLabel,
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
                ),
              ],
            ),
          ),
          if (member.isOnDuty)
            GestureDetector(
              onTap: onViewMap,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Lihat Maps',
                  style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                ),
              ),
            )
          else
            const Icon(Icons.chevron_right, color: AppColors.textSecondary),
        ],
          ),
        ),
      ),
    );
  }
}