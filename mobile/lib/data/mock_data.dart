// Backward-compatible exports. Prefer models/ and seed_data.dart directly.
export 'package:poli_humas/data/seed_data.dart';
export 'package:poli_humas/models/activity.dart';
export 'package:poli_humas/models/content_plan.dart';
export 'package:poli_humas/models/notification_item.dart';
export 'package:poli_humas/models/team_member.dart';

import 'package:poli_humas/data/seed_data.dart';
import 'package:poli_humas/models/notification_item.dart';

final activities = buildSeedActivities().where((a) => !a.isHistory && a.status != 'Selesai' && a.status != 'Dibatalkan').toList();
final activityHistory = buildSeedActivities().where((a) => a.isHistory || a.status == 'Selesai' || a.status == 'Dibatalkan').toList();
final contentPlans = buildSeedContentPlans();
final notifications = buildSeedNotifications();
final teamMembers = buildSeedTeamMembers();

typedef NotificationItem = AppNotification;