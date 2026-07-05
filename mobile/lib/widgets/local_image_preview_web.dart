import 'package:flutter/material.dart';

Widget buildLocalImagePreview({required String path, BoxFit fit = BoxFit.cover}) {
  return Image.network(path, fit: fit);
}