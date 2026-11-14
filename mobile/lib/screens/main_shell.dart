import 'dart:async';

import 'package:flutter/material.dart';
import 'package:poli_humas/config/api_config.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/services/app_navigation_service.dart';
import 'package:poli_humas/services/auth_service.dart';
import 'package:poli_humas/services/live_location_sync_service.dart';
import 'package:poli_humas/services/realtime_sync_service.dart';
import 'package:poli_humas/screens/activities/activities_list_screen.dart';
import 'package:poli_humas/screens/content/content_plan_screen.dart';
import 'package:poli_humas/screens/home_screen.dart';
import 'package:poli_humas/screens/notifications_screen.dart';
import 'package:poli_humas/screens/profile_screen.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/widgets/common_widgets.dart';
import 'package:provider/provider.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key, this.initialIndex = 0});

  final int initialIndex;

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> with WidgetsBindingObserver {
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    WidgetsBinding.instance.addObserver(this);
    AppNavigationService.instance.goHome = () => switchTab(0);
    final appData = context.read<AppDataProvider>();
    RealtimeSyncService.instance.bindProvider(appData);
    RealtimeSyncService.instance.start();
    if (appData.lastFullSyncAt == null &&
        ApiConfig.enabled &&
        AuthService.instance.isLoggedInWithApi) {
      unawaited(appData.refreshAll(simulateNetwork: false));
    }
    WidgetsBinding.instance.addPostFrameCallback((_) => _initLocationConsent());
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.detached) {
      RealtimeSyncService.instance.onAppPaused();
    } else if (state == AppLifecycleState.resumed) {
      RealtimeSyncService.instance.onAppResumed();
      if (ApiConfig.enabled && AuthService.instance.isLoggedInWithApi) {
        LiveLocationSyncService.instance.start();
      }
    }
  }

  Future<void> _initLocationConsent() async {
    if (!mounted) return;
    if (!ApiConfig.enabled || !AuthService.instance.isLoggedInWithApi) return;
    final agreed = await LiveLocationSyncService.instance.ensureConsent(context);
    if (agreed) {
      await LiveLocationSyncService.instance.start();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    AppNavigationService.instance.goHome = null;
    super.dispose();
  }

  void switchTab(int index) {
    if (_currentIndex != index) {
      setState(() => _currentIndex = index);
      RealtimeSyncService.instance.onTabChanged();
    }
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      HomeScreen(onNavigate: switchTab),
      const ActivitiesListScreen(),
      const ContentPlanScreen(),
      const NotificationsScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      body: IndexedStack(index: _currentIndex, children: pages),
      bottomNavigationBar: Consumer<AppDataProvider>(
        builder: (context, provider, _) => AppBottomNav(
          currentIndex: _currentIndex,
          onTap: switchTab,
          unreadCount: provider.unreadNotificationCount,
        ),
      ),
    );
  }
}