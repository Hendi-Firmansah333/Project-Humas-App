import 'package:flutter/material.dart';
import 'package:poli_humas/theme/app_colors.dart';

import 'profile_image_stub.dart'
    if (dart.library.io) 'profile_image_io.dart'
    if (dart.library.html) 'profile_image_web.dart';

class ProfileAvatar extends StatelessWidget {
  const ProfileAvatar({
    super.key,
    this.photoPath,
    this.radius = 48,
    this.showEditBadge = false,
    this.onTap,
  });

  final String? photoPath;
  final double radius;
  final bool showEditBadge;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    Widget avatar = buildProfileImage(
      photoPath: photoPath,
      radius: radius,
      fallback: CircleAvatar(
        radius: radius,
        backgroundColor: AppColors.primaryLight,
        child: Icon(Icons.person, size: radius, color: AppColors.primaryDark),
      ),
    );

    if (!showEditBadge) {
      return GestureDetector(onTap: onTap, child: avatar);
    }

    return GestureDetector(
      onTap: onTap,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
            child: avatar,
          ),
          Positioned(
            right: 0,
            bottom: 0,
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.camera_alt, color: Colors.white, size: 16),
            ),
          ),
        ],
      ),
    );
  }
}