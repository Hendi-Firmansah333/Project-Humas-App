import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

class MapMarkerData {
  const MapMarkerData({
    required this.id,
    required this.point,
    required this.label,
    this.initials,
    this.isActive = true,
    this.isSelected = false,
  });

  final String id;
  final LatLng point;
  final String label;
  final String? initials;
  final bool isActive;
  final bool isSelected;

  String get displayInitials {
    if (initials != null && initials!.trim().isNotEmpty) {
      return initials!.trim().toUpperCase();
    }
    final clean = label.trim();
    if (clean.isEmpty) return 'HM';
    final parts = clean.split(RegExp(r'\s+'));
    if (parts.length >= 2 && parts[0].isNotEmpty && parts[1].isNotEmpty) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return clean.substring(0, clean.length.clamp(1, 2)).toUpperCase();
  }
}

class AppMapView extends StatefulWidget {
  const AppMapView({
    super.key,
    required this.center,
    this.zoom = 16,
    this.markers = const [],
    this.userLocation,
    this.height = 160,
    this.interactive = true,
    this.showControls = true,
    this.onMarkerTap,
  });

  final LatLng center;
  final double zoom;
  final List<MapMarkerData> markers;
  final LatLng? userLocation;
  final double height;
  final bool interactive;
  final bool showControls;
  final ValueChanged<MapMarkerData>? onMarkerTap;

  @override
  State<AppMapView> createState() => _AppMapViewState();
}

class _AppMapViewState extends State<AppMapView> {
  late final MapController _mapController;

  @override
  void initState() {
    super.initState();
    _mapController = MapController();
  }

  @override
  void didUpdateWidget(covariant AppMapView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.center != widget.center) {
      _mapController.move(widget.center, widget.zoom);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: widget.height,
      width: double.infinity,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: Stack(
          children: [
            FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: widget.center,
                initialZoom: widget.zoom,
                interactionOptions: InteractionOptions(
                  flags: widget.interactive ? InteractiveFlag.all : InteractiveFlag.none,
                ),
              ),
              children: [
                // Google Maps Tiles
                TileLayer(
                  urlTemplate: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=AIzaSyAspkC4V1-LjBsDLsWj06GrdkrPhXX2v8g',
                  userAgentPackageName: 'com.example.poli_humas',
                  maxZoom: 20,
                ),

                // User Location Marker (Google Maps style blue pulsing location dot)
                if (widget.userLocation != null)
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: widget.userLocation!,
                        width: 32,
                        height: 32,
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            Container(
                              width: 28,
                              height: 28,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: const Color(0xFF3B82F6).withValues(alpha: 0.25),
                              ),
                            ),
                            Container(
                              width: 14,
                              height: 14,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: const Color(0xFF2563EB),
                                border: Border.all(color: Colors.white, width: 2.5),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.2),
                                    blurRadius: 4,
                                    offset: const Offset(0, 1),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                // Team Members markers (Teal circular badges matching Web design)
                MarkerLayer(
                  markers: widget.markers
                      .map(
                        (m) => Marker(
                          point: m.point,
                          width: 46,
                          height: 46,
                          child: GestureDetector(
                            behavior: HitTestBehavior.opaque,
                            onTap: () => widget.onMarkerTap?.call(m),
                            child: Center(
                              child: Stack(
                                clipBehavior: Clip.none,
                                alignment: Alignment.center,
                                children: [
                                  // Soft pulsing glow for online active member
                                  if (m.isActive)
                                    Container(
                                      width: 44,
                                      height: 44,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: const Color(0xFF14B8A6).withValues(alpha: 0.25),
                                      ),
                                    ),

                                  // Main Avatar Badge Circle (Matching Web: teal gradient, white border, bold initials)
                                  Container(
                                    width: 36,
                                    height: 36,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      gradient: m.isActive
                                          ? const LinearGradient(
                                              colors: [Color(0xFF0F766E), Color(0xFF14B8A6)],
                                              begin: Alignment.topLeft,
                                              end: Alignment.bottomRight,
                                            )
                                          : const LinearGradient(
                                              colors: [Color(0xFF64748B), Color(0xFF475569)],
                                              begin: Alignment.topLeft,
                                              end: Alignment.bottomRight,
                                            ),
                                      border: Border.all(
                                        color: m.isSelected ? const Color(0xFF2DD4BF) : Colors.white,
                                        width: m.isSelected ? 3.0 : 2.0,
                                      ),
                                      boxShadow: [
                                        BoxShadow(
                                          color: (m.isActive ? const Color(0xFF0F766E) : Colors.black)
                                              .withValues(alpha: 0.4),
                                          blurRadius: 8,
                                          offset: const Offset(0, 3),
                                        ),
                                      ],
                                    ),
                                    alignment: Alignment.center,
                                    child: Text(
                                      m.displayInitials,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w800,
                                        fontSize: 12,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ),

                                  // Tiny Online / Offline Status Badge (Bottom Right)
                                  Positioned(
                                    right: 0,
                                    bottom: 0,
                                    child: Container(
                                      width: 11,
                                      height: 11,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: m.isActive
                                            ? const Color(0xFF10B981)
                                            : const Color(0xFF94A3B8),
                                        border: Border.all(color: Colors.white, width: 2),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      )
                      .toList(),
                ),
              ],
            ),

            // Floating Controls (+ / - / Re-center) on interactive maps
            if (widget.interactive && widget.showControls && widget.height > 200)
              Positioned(
                right: 12,
                top: 12,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.12),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _MapControlButton(
                        icon: Icons.add,
                        tooltip: 'Perbesar',
                        onTap: () {
                          final currentZoom = _mapController.camera.zoom;
                          _mapController.move(_mapController.camera.center, currentZoom + 1);
                        },
                      ),
                      const Divider(height: 1, thickness: 0.5, indent: 4, endIndent: 4),
                      _MapControlButton(
                        icon: Icons.remove,
                        tooltip: 'Perkecil',
                        onTap: () {
                          final currentZoom = _mapController.camera.zoom;
                          _mapController.move(_mapController.camera.center, currentZoom - 1);
                        },
                      ),
                      const Divider(height: 1, thickness: 0.5, indent: 4, endIndent: 4),
                      _MapControlButton(
                        icon: Icons.my_location,
                        tooltip: 'Pusatkan Peta',
                        onTap: () {
                          _mapController.move(widget.center, widget.zoom);
                        },
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _MapControlButton extends StatelessWidget {
  const _MapControlButton({
    required this.icon,
    required this.onTap,
    this.tooltip,
  });

  final IconData icon;
  final VoidCallback onTap;
  final String? tooltip;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip ?? '',
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: SizedBox(
          width: 36,
          height: 36,
          child: Icon(icon, size: 18, color: const Color(0xFF334155)),
        ),
      ),
    );
  }
}