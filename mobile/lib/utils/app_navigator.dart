import 'package:flutter/material.dart';
import 'package:poli_humas/animations/app_page_route.dart';

void pushSmooth(BuildContext context, Widget page) {
  Navigator.push(context, SmoothSlideRoute(page: page));
}

void pushReplacementSmooth(BuildContext context, Widget page) {
  Navigator.pushReplacement(context, SmoothSlideRoute(page: page));
}