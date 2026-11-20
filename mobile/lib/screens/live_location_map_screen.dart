import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:poli_humas/models/team_member.dart';
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

class LiveLocationMapScreen extends StatefulWidget {
  const LiveLocationMapScreen({
    super.key,
    required this.members,
    this.focusMember,
  });

  final List<TeamMember> members;
  final TeamMember? focusMember;

  @override
  State<LiveLocationMapScreen> createState() => _LiveLocationMapScreenState();
}

class _LiveLocationMapScreenState extends State<LiveLocationMapScreen> {
  TeamMember? _selectedMember;

  @override
  void initState() {
    super.initState();
    _selectedMember = widget.focusMember;
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

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;
    final activeMember = _selectedMember ?? widget.focusMember;

    final center = activeMember != null
        ? LatLng(activeMember.latitude, activeMember.longitude)
        : widget.members.isNotEmpty
            ? LatLng(widget.members.first.latitude, widget.members.first.longitude)
            : const LatLng(-5.3582, 105.2318);

    final markers = widget.members
        .map(
          (m) => MapMarkerData(
            id: m.id,
            point: LatLng(m.latitude, m.longitude),
            label: m.name.split(' ').first,
            initials: m.initials,
            isActive: m.isOnDuty,
            isSelected: activeMember?.id == m.id,
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
            color: isDark ? Colors.white : const Color(0xFF003D58),
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          children: [
            Text(
              activeMember != null ? 'Lokasi ${activeMember.name}' : 'Peta Tim Lapangan',
              style: _pj(
                16,
                FontWeight.w900,
                isDark ? Colors.white : const Color(0xFF003D58),
              ),
            ),
            Row(
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
                const SizedBox(width: 4),
                Text(
                  '${widget.members.where((m) => m.isOnDuty).length} Personil Siaga',
                  style: _pj(11, FontWeight.w600, const Color(0xFF64748B)),
                ),
              ],
            ),
          ],
        ),
        centerTitle: true,
        actions: [
          IconButton(
            tooltip: 'Reset Fokus',
            icon: Icon(
              Icons.my_location_rounded,
              color: isDark ? Colors.white70 : const Color(0xFF003D58),
            ),
            onPressed: () {
              HapticFeedback.lightImpact();
              setState(() => _selectedMember = null);
            },
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
      body: LayoutBuilder(
        builder: (context, constraints) {
          return Stack(
            children: [
              AppMapView(
                center: center,
                zoom: activeMember != null ? 17.5 : 16.5,
                height: constraints.maxHeight,
                markers: markers,
                interactive: true,
                showControls: true,
                onMarkerTap: (marker) {
                  final selected = widget.members.firstWhere((m) => m.id == marker.id);
                  setState(() => _selectedMember = selected);
                },
              ),

              // Top pill: Area Info
              Positioned(
                top: 14,
                left: 14,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
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
                        Icons.shield_outlined,
                        size: 13,
                        color: Color(0xFF38BDF8),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'ZONA HUMAS POLINELA',
                        style: _pj(10, FontWeight.w800, Colors.white, ls: 0.5),
                      ),
                    ],
                  ),
                ),
              ),

              // Bottom Detail Card if member selected
              if (activeMember != null)
                Positioned(
                  bottom: 24,
                  left: 16,
                  right: 16,
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: const Color(0xFF00B4D8).withValues(alpha: 0.3),
                        width: 1.5,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.25),
                          blurRadius: 18,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 46,
                              height: 46,
                              decoration: BoxDecoration(
                                color: const Color(0xFFE0F2FE),
                                shape: BoxShape.circle,
                                border: Border.all(color: const Color(0xFF003D58), width: 1.5),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                activeMember.initials,
                                style: _pj(14, FontWeight.w900, const Color(0xFF003D58)),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Flexible(
                                        child: Text(
                                          activeMember.name,
                                          style: _pj(
                                            14,
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
                                          color: activeMember.isOnDuty
                                              ? const Color(0xFFECFDF5)
                                              : const Color(0xFFFFFBEB),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          activeMember.isOnDuty ? 'Siaga' : 'Standby',
                                          style: _pj(
                                            9,
                                            FontWeight.w800,
                                            activeMember.isOnDuty
                                                ? const Color(0xFF059669)
                                                : const Color(0xFFD97706),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    activeMember.division,
                                    style: _pj(11, FontWeight.w700, const Color(0xFF003D58)),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${activeMember.distance} • ${activeMember.location}',
                                    style: _pj(11, FontWeight.w500, AppColors.slate500),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () => _openWhatsApp(activeMember),
                                icon: const Icon(Icons.chat_bubble_rounded, size: 16, color: Color(0xFF16A34A)),
                                label: Text(
                                  'WhatsApp',
                                  style: _pj(12, FontWeight.w700, const Color(0xFF16A34A)),
                                ),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 10),
                                  side: const BorderSide(color: Color(0xFF25D366)),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () {
                                  showLiveLocationDetailSheet(
                                    context,
                                    member: activeMember,
                                    lastUpdatedLabel: 'Update terkini',
                                  );
                                },
                                icon: const Icon(Icons.person_rounded, size: 16),
                                label: Text('Profil Lengkap', style: _pj(12, FontWeight.w700, Colors.white)),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF003D58),
                                  foregroundColor: Colors.white,
                                  elevation: 0,
                                  padding: const EdgeInsets.symmetric(vertical: 10),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}
