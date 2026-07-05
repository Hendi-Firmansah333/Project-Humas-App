import 'package:flutter/material.dart';

class AppNavigationService {
  AppNavigationService._();

  static final AppNavigationService instance = AppNavigationService._();

  VoidCallback? goHome;
}