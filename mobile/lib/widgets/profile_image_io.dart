import 'dart:io';

import 'package:flutter/material.dart';

Widget buildProfileImage({
  required String? photoPath,
  required double radius,
  required Widget fallback,
}) {
  if (photoPath != null && photoPath.trim().isNotEmpty) {
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
      return CircleAvatar(
        radius: radius,
        backgroundImage: NetworkImage(photoPath),
      );
    }
    try {
      final file = File(photoPath);
      if (file.existsSync()) {
        return CircleAvatar(
          radius: radius,
          backgroundImage: FileImage(file),
        );
      }
    } catch (_) {}
  }
  return fallback;
}