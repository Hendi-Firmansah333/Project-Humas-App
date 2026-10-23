import 'dart:io';

import 'package:flutter/material.dart';

Widget buildLocalImagePreview({required String path, BoxFit fit = BoxFit.cover}) {
  return Image.file(File(path), fit: fit);
}