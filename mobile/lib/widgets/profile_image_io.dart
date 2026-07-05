import 'dart:io';

import 'package:flutter/material.dart';

Widget buildProfileImage({
  required String? photoPath,
  required double radius,
  required Widget fallback,
}) {
  if (photoPath != null && File(photoPath).existsSync()) {
    return CircleAvatar(
      radius: radius,
      backgroundImage: FileImage(File(photoPath)),
    );
  }
  return fallback;
}