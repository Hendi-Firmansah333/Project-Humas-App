import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:poli_humas/theme/app_colors.dart';

class MapMarkerData {
  const MapMarkerData({
    required this.id,
    required this.point,
    required this.label,
    this.isActive = true,
  });

  final String id;
  final LatLng point;
  final String label;
  final bool isActive;
}

class AppMapView extends StatelessWidget {
  const AppMapView({
    super.key,
    required this.center,
    this.zoom = 16,
    this.markers = const [],
    this.userLocation,
    this.height = 160,
    this.interactive = true,
    this.onMarkerTap,
  });

  final LatLng center;
  final double zoom;
  final List<MapMarkerData> markers;
  final LatLng? userLocation;
  final double height;
  final bool interactive;
  final ValueChanged<MapMarkerData>? onMarkerTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      width: double.infinity,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: FlutterMap(
          options: MapOptions(
            initialCenter: center,
            initialZoom: zoom,
            interactionOptions: InteractionOptions(
              flags: interactive ? InteractiveFlag.all : InteractiveFlag.none,
            ),
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.example.poli_humas',
            ),
            if (userLocation != null)
              MarkerLayer(
                markers: [
                  Marker(
                    point: userLocation!,
                    width: 28,
                    height: 28,
                    child: const Icon(Icons.my_location, color: Color(0xFF3B82F6), size: 28),
                  ),
                ],
              ),
            MarkerLayer(
              markers: markers
                  .map(
                    (m) => Marker(
                      point: m.point,
                      width: 40,
                      height: 40,
                      child: GestureDetector(
                        onTap: () => onMarkerTap?.call(m),
                        child: Column(
                          children: [
                            Icon(
                              Icons.location_on,
                              color: m.isActive ? AppColors.primary : AppColors.textSecondary,
                              size: 32,
                            ),
                            if (m.label.isNotEmpty)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  m.label,
                                  style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ],
        ),
      ),
    );
  }
}