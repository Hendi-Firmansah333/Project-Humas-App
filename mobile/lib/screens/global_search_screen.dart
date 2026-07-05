import 'package:flutter/material.dart';
import 'package:poli_humas/models/activity.dart';
import 'package:poli_humas/models/content_plan.dart';
import 'package:poli_humas/models/notification_item.dart';
import 'package:poli_humas/models/team_member.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/activities/activity_detail_screen.dart';
import 'package:poli_humas/screens/content/content_plan_detail_screen.dart';
import 'package:poli_humas/screens/notification_detail_screen.dart';
import 'package:poli_humas/screens/team_member_profile_screen.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/utils/app_navigator.dart';
import 'package:poli_humas/widgets/common_widgets.dart';
import 'package:provider/provider.dart';

class GlobalSearchScreen extends StatefulWidget {
  const GlobalSearchScreen({super.key});

  @override
  State<GlobalSearchScreen> createState() => _GlobalSearchScreenState();
}

class _GlobalSearchScreenState extends State<GlobalSearchScreen> {
  final _searchController = TextEditingController();
  final _focusNode = FocusNode();
  String _query = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _focusNode.requestFocus());
  }

  @override
  void dispose() {
    _searchController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  bool _matches(String text, String query) {
    if (query.isEmpty) return false;
    return text.toLowerCase().contains(query);
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppDataProvider>();
    final query = _query.trim().toLowerCase();
    final hasQuery = query.isNotEmpty;

    final activities = hasQuery
        ? provider.activitiesState.items.where((item) {
            return _matches(item.title, query) ||
                _matches(item.description, query) ||
                _matches(item.location, query);
          }).toList()
        : <ActivityItem>[];

    final contentPlans = hasQuery
        ? provider.contentPlansState.items.where((item) {
            return _matches(item.title, query) || _matches(item.description, query);
          }).toList()
        : <ContentPlanItem>[];

    final notifications = hasQuery
        ? provider.notificationsState.items.where((item) {
            return _matches(item.title, query) || _matches(item.body, query);
          }).toList()
        : <AppNotification>[];

    final teamMembers = hasQuery
        ? provider.teamMembers.where((member) {
            return _matches(member.name, query) ||
                _matches(member.division, query) ||
                _matches(member.location, query);
          }).toList()
        : <TeamMember>[];

    final totalResults =
        activities.length + contentPlans.length + notifications.length + teamMembers.length;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const AppHeader(
        showSearch: false,
        leading: BackButton(color: AppColors.primary),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
            child: TextField(
              controller: _searchController,
              focusNode: _focusNode,
              onChanged: (value) => setState(() => _query = value),
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Cari kegiatan, konten, tim, pengumuman...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _query.isNotEmpty
                    ? IconButton(
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _query = '');
                        },
                        icon: const Icon(Icons.close),
                      )
                    : null,
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          Expanded(
            child: !hasQuery
                ? const Center(
                    child: Padding(
                      padding: EdgeInsets.all(32),
                      child: Text(
                        'Ketik kata kunci untuk mencari di seluruh aplikasi.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: AppColors.textSecondary),
                      ),
                    ),
                  )
                : totalResults == 0
                    ? const Center(
                        child: Padding(
                          padding: EdgeInsets.all(32),
                          child: Text(
                            'Tidak ada hasil ditemukan.',
                            style: TextStyle(color: AppColors.textSecondary),
                          ),
                        ),
                      )
                    : ListView(
                        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                        children: [
                          if (activities.isNotEmpty) ...[
                            _SectionHeader(title: 'Kegiatan', count: activities.length),
                            ...activities.map(
                              (item) => _SearchResultTile(
                                icon: Icons.event_note,
                                title: item.title,
                                subtitle: '${item.date} • ${item.location}',
                                onTap: () => pushSmooth(
                                  context,
                                  ActivityDetailScreen(activity: item),
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                          ],
                          if (contentPlans.isNotEmpty) ...[
                            _SectionHeader(title: 'Content Plan', count: contentPlans.length),
                            ...contentPlans.map(
                              (item) => _SearchResultTile(
                                icon: Icons.calendar_month,
                                title: item.title,
                                subtitle: item.statusLabel,
                                onTap: () => pushSmooth(
                                  context,
                                  ContentPlanDetailScreen(item: item),
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                          ],
                          if (teamMembers.isNotEmpty) ...[
                            _SectionHeader(title: 'Tim Humas', count: teamMembers.length),
                            ...teamMembers.map(
                              (member) => _SearchResultTile(
                                icon: Icons.groups_outlined,
                                title: member.name,
                                subtitle: '${member.division} • ${member.location}',
                                onTap: () => pushSmooth(
                                  context,
                                  TeamMemberProfileScreen(member: member),
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                          ],
                          if (notifications.isNotEmpty) ...[
                            _SectionHeader(title: 'Pengumuman', count: notifications.length),
                            ...notifications.map(
                              (item) => _SearchResultTile(
                                icon: Icons.campaign_outlined,
                                title: item.title,
                                subtitle: item.body,
                                onTap: () => pushSmooth(
                                  context,
                                  NotificationDetailScreen(notification: item),
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.count});

  final String title;
  final int count;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        '$title ($count)',
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w800,
          color: AppColors.textSecondary,
          letterSpacing: 0.4,
        ),
      ),
    );
  }
}

class _SearchResultTile extends StatelessWidget {
  const _SearchResultTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: const BoxDecoration(
                    color: AppColors.tealLight,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: AppColors.primary, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: AppColors.textSecondary, size: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}