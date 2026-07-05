import 'package:flutter/material.dart';

Widget buildProfileImage({
  required String? photoPath,
  required double radius,
  required Widget fallback,
}) {
  if (photoPath != null && photoPath.isNotEmpty) {
    return CircleAvatar(
      radius: radius,
      backgroundImage: NetworkImage(photoPath),
    );
  }
  return fallback;
}