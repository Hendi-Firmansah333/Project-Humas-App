import 'package:flutter/material.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/services/app_navigation_service.dart';
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

class _MainShellState extends State<MainShell> {
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    AppNavigationService.instance.goHome = () => switchTab(0);
  }

  @override
  void dispose() {
    AppNavigationService.instance.goHome = null;
    super.dispose();
  }

  void switchTab(int index) => setState(() => _currentIndex = index);

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