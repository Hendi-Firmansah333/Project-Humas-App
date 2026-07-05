import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'package:poli_humas/models/team_member.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/widgets/app_map_view.dart';

class LiveLocationMapScreen extends StatelessWidget {
  const LiveLocationMapScreen({
    super.key,
    required this.members,
    this.focusMember,
  });

  final List<TeamMember> members;
  final TeamMember? focusMember;

  @override
  Widget build(BuildContext context) {
    final center = focusMember != null
        ? LatLng(focusMember!.latitude, focusMember!.longitude)
        : members.isNotEmpty
            ? LatLng(members.first.latitude, members.first.longitude)
            : const LatLng(-5.3595, 105.2318);

    final markers = members
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
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          focusMember != null ? 'Lokasi ${focusMember!.name}' : 'Peta Tim',
          style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800),
        ),
        centerTitle: true,
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          return AppMapView(
            center: center,
            zoom: focusMember != null ? 17 : 16,
            height: constraints.maxHeight,
            markers: markers,
            interactive: true,
          );
        },
      ),
    );
  }
}