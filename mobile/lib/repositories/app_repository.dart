import 'dart:convert';
import 'dart:math';

import 'package:poli_humas/data/seed_data.dart';
import 'package:poli_humas/models/activity.dart';
import 'package:poli_humas/models/content_plan.dart';
import 'package:poli_humas/models/notification_item.dart';
import 'package:poli_humas/models/team_member.dart';
import 'package:poli_humas/services/api_service.dart';
import 'package:poli_humas/services/local_storage.dart';

class PagedResult<T> {
  const PagedResult({required this.items, required this.hasMore, required this.total});

  final List<T> items;
  final bool hasMore;
  final int total;
}

class ProfileStats {
  const ProfileStats({
    required this.totalActivities,
    required this.completedContent,
    required this.attendanceRate,
  });

  final int totalActivities;
  final int completedContent;
  final int attendanceRate;
}

class AppDataSnapshot {
  const AppDataSnapshot({
    required this.activities,
    required this.activityHistory,
    required this.contentPlans,
    required this.notifications,
    required this.teamMembers,
  });

  final List<ActivityItem> activities;
  final List<ActivityItem> activityHistory;
  final List<ContentPlanItem> contentPlans;
  final List<AppNotification> notifications;
  final List<TeamMember> teamMembers;

  Map<String, dynamic> toJson() => {
        'activities': activities.map((e) => e.toJson()).toList(),
        'activityHistory': activityHistory.map((e) => e.toJson()).toList(),
        'contentPlans': contentPlans.map((e) => e.toJson()).toList(),
        'notifications': notifications.map((e) => e.toJson()).toList(),
        'teamMembers': teamMembers.map((e) => e.toJson()).toList(),
      };

  factory AppDataSnapshot.fromJson(Map<String, dynamic> json) => AppDataSnapshot(
        activities: (json['activities'] as List<dynamic>)
            .map((e) => ActivityItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        activityHistory: (json['activityHistory'] as List<dynamic>)
            .map((e) => ActivityItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        contentPlans: (json['contentPlans'] as List<dynamic>)
            .map((e) => ContentPlanItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        notifications: (json['notifications'] as List<dynamic>)
            .map((e) => AppNotification.fromJson(e as Map<String, dynamic>))
            .toList(),
        teamMembers: (json['teamMembers'] as List<dynamic>)
            .map((e) => TeamMember.fromJson(e as Map<String, dynamic>))
            .toList(),
      );

  AppDataSnapshot copyWith({
    List<ActivityItem>? activities,
    List<ActivityItem>? activityHistory,
    List<ContentPlanItem>? contentPlans,
    List<AppNotification>? notifications,
    List<TeamMember>? teamMembers,
  }) =>
      AppDataSnapshot(
        activities: activities ?? this.activities,
        activityHistory: activityHistory ?? this.activityHistory,
        contentPlans: contentPlans ?? this.contentPlans,
        notifications: notifications ?? this.notifications,
        teamMembers: teamMembers ?? this.teamMembers,
      );
}

class AppRepository {
  AppRepository._();

  static final AppRepository instance = AppRepository._();

  static const _cacheKey = 'app_data_cache';
  static const pageSize = 5;
  static const simulatedNetworkDelay = Duration(milliseconds: 400);

  AppDataSnapshot? _data;

  AppDataSnapshot get data {
    _data ??= _buildInitial();
    return _data!;
  }

  AppDataSnapshot _buildInitial() {
    final all = buildSeedActivities();
    return AppDataSnapshot(
      activities: all
          .where((a) => !a.isHistory && a.status != 'Selesai' && a.status != 'Dibatalkan')
          .toList(),
      activityHistory: all
          .where((a) => a.isHistory || a.status == 'Selesai' || a.status == 'Dibatalkan')
          .toList(),
      contentPlans: buildSeedContentPlans(),
      notifications: buildSeedNotifications(),
      teamMembers: buildSeedTeamMembers(),
    );
  }

  bool get _useApi => ApiService.instance.isAvailable;

  Future<void> init() async {
    final raw = await LocalStorage.getString(_cacheKey);
    if (raw != null) {
      try {
        _data = AppDataSnapshot.fromJson(jsonDecode(raw) as Map<String, dynamic>);
      } catch (_) {
        _data = _buildInitial();
      }
    } else {
      _data = _buildInitial();
    }

    if (_useApi) {
      try {
        _data = await ApiService.instance.fetchSnapshot();
      } catch (_) {
        _data = _buildInitial();
      }
    }

    await _persist();
  }

  Future<void> _persist() async {
    if (_data == null) return;
    await LocalStorage.setString(_cacheKey, jsonEncode(_data!.toJson()));
  }

  Future<void> _simulateNetwork() async {
    await Future<void>.delayed(simulatedNetworkDelay);
  }

  Future<AppDataSnapshot> refresh({bool simulateNetwork = true}) async {
    if (_useApi) {
      _data = await ApiService.instance.fetchSnapshot();
      await _persist();
      return data;
    }
    if (simulateNetwork) await _simulateNetwork();
    _jitterTeamLocations();
    await _persist();
    return data;
  }

  void _jitterTeamLocations() {
    final random = Random();
    final updated = data.teamMembers.map((member) {
      if (!member.isOnDuty) return member;
      return member.copyWith(
        latitude: member.latitude + (random.nextDouble() - 0.5) * 0.0003,
        longitude: member.longitude + (random.nextDouble() - 0.5) * 0.0003,
        lastUpdated: DateTime.now(),
        distance: '${300 + random.nextInt(900)}m dari saya',
      );
    }).toList();
    _data = data.copyWith(teamMembers: updated);
  }

  Future<PagedResult<ActivityItem>> fetchActivities({
    int page = 1,
    String search = '',
    String statusFilter = 'Semua',
  }) async {
    if (_useApi) {
      return ApiService.instance.fetchActivities(
        page: page,
        search: search,
        statusFilter: statusFilter,
      );
    }
    await _simulateNetwork();
    final filtered = _filterActivities(data.activities, search, statusFilter);
    return _page(filtered, page);
  }

  Future<PagedResult<ActivityItem>> fetchActivityHistory({
    int page = 1,
    String search = '',
    String statusFilter = 'Semua',
  }) async {
    if (_useApi) {
      return ApiService.instance.fetchActivities(
        page: page,
        search: search,
        statusFilter: statusFilter,
        history: true,
      );
    }
    await _simulateNetwork();
    final filtered = data.activityHistory.where((item) {
      final q = search.toLowerCase();
      final matchesSearch = q.isEmpty || item.title.toLowerCase().contains(q);
      final matchesFilter = statusFilter == 'Semua' || item.status == statusFilter;
      return matchesSearch && matchesFilter;
    }).toList();
    return _page(filtered, page);
  }

  Future<PagedResult<ContentPlanItem>> fetchContentPlans({
    int page = 1,
    String statusFilter = 'Semua',
    String search = '',
  }) async {
    if (_useApi) {
      return ApiService.instance.fetchContentPlans(
        page: page,
        search: search,
        statusFilter: statusFilter,
      );
    }
    await _simulateNetwork();
    final filtered = data.contentPlans.where((item) {
      final q = search.toLowerCase();
      final matchesSearch =
          q.isEmpty || item.title.toLowerCase().contains(q) || item.description.toLowerCase().contains(q);
      final matchesFilter = statusFilter == 'Semua' || item.statusLabel == statusFilter;
      return matchesSearch && matchesFilter;
    }).toList();
    return _page(filtered, page);
  }

  Future<PagedResult<AppNotification>> fetchNotifications({
    int page = 1,
    String filter = 'Semua',
    String search = '',
  }) async {
    if (_useApi) {
      return ApiService.instance.fetchNotifications(
        page: page,
        filter: filter,
        search: search,
      );
    }
    await _simulateNetwork();
    final filtered = data.notifications.where((n) {
      final q = search.toLowerCase();
      final matchesSearch =
          q.isEmpty || n.title.toLowerCase().contains(q) || n.body.toLowerCase().contains(q);
      if (filter == 'Belum Dibaca') return matchesSearch && n.isUnread;
      if (filter == 'Sudah Dibaca') return matchesSearch && !n.isUnread;
      return matchesSearch;
    }).toList();
    return _page(filtered, page);
  }

  List<ActivityItem> _filterActivities(List<ActivityItem> source, String search, String statusFilter) {
    final q = search.toLowerCase();
    return source.where((item) {
      final matchesSearch = q.isEmpty ||
          item.title.toLowerCase().contains(q) ||
          item.description.toLowerCase().contains(q);
      final matchesFilter = statusFilter == 'Semua' || item.status == statusFilter;
      return matchesSearch && matchesFilter;
    }).toList();
  }

  PagedResult<T> _page<T>(List<T> items, int page) {
    final end = min(page * pageSize, items.length);
    final start = min((page - 1) * pageSize, end);
    return PagedResult(
      items: items.sublist(start, end),
      hasMore: end < items.length,
      total: items.length,
    );
  }

  ActivityItem? activityById(String id) {
    for (final item in [...data.activities, ...data.activityHistory]) {
      if (item.id == id) return item;
    }
    return null;
  }

  ContentPlanItem? contentPlanById(String id) {
    for (final item in data.contentPlans) {
      if (item.id == id) return item;
    }
    return null;
  }

  AppNotification? notificationById(String id) {
    for (final item in data.notifications) {
      if (item.id == id) return item;
    }
    return null;
  }

  ActivityItem? get todaySchedule {
    final today = DateTime.now();
    final candidates = data.activities.where((a) {
      if (a.scheduledAt == null) return a.status == 'Sedang Berlangsung';
      return _isSameDay(a.scheduledAt!, today);
    }).toList();
    if (candidates.isEmpty) return null;
    candidates.sort((a, b) => (a.scheduledAt ?? today).compareTo(b.scheduledAt ?? today));
    return candidates.first;
  }

  List<ActivityItem> get upcomingActivities {
    final now = DateTime.now();
    return data.activities
        .where((a) => a.status == 'Akan Datang' && (a.scheduledAt == null || a.scheduledAt!.isAfter(now)))
        .take(5)
        .toList();
  }

  CheckInState get todayCheckInState {
    final schedule = todaySchedule;
    if (schedule == null) return CheckInState.none;
    return schedule.checkInState;
  }

  String get todayCheckInLabel {
    switch (todayCheckInState) {
      case CheckInState.checkedIn:
        return 'Sudah Check-in';
      case CheckInState.late:
        return 'Check-in Terlambat';
      case CheckInState.missed:
        return 'Belum Check-in';
      case CheckInState.none:
        return 'Belum Check-in';
    }
  }

  ProfileStats computeProfileStats() {
    final allActivities = [...data.activities, ...data.activityHistory];
    final checkedIn = allActivities.where((a) => a.hasCheckedIn).length;
    final total = allActivities.length;
    final completedContent =
        data.contentPlans.where((c) => c.status == ContentPlanStatus.selesai).length;
    final attendance = total == 0 ? 0 : ((checkedIn / total) * 100).round();
    return ProfileStats(
      totalActivities: total,
      completedContent: completedContent,
      attendanceRate: attendance,
    );
  }

  int get unreadNotificationCount => data.notifications.where((n) => n.isUnread).length;

  Future<ActivityItem> submitCheckIn({
    required String activityId,
    required String selfiePath,
    required bool isLate,
  }) async {
    if (_useApi) {
      final updated = await ApiService.instance.submitCheckIn(
        activityId: activityId,
        selfiePath: selfiePath,
        isLate: isLate,
      );
      _replaceActivity(updated);
      await _persist();
      return updated;
    }
    await _simulateNetwork();
    final activity = activityById(activityId);
    if (activity == null) throw Exception('Kegiatan tidak ditemukan.');

    final now = DateTime.now();
    final checkInTime =
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')} WIB';
    final state = isLate ? CheckInState.late : CheckInState.checkedIn;
    final updated = activity.copyWith(
      checkInState: state,
      checkInStatus: isLate ? 'Check-in: Terlambat' : 'Check-in: Berhasil',
      selfiePath: selfiePath,
      checkInTime: checkInTime,
    );
    _replaceActivity(updated);
    await _persist();
    return updated;
  }

  Future<ActivityItem> submitDocumentation({
    required String activityId,
    required String driveUrl,
  }) async {
    if (_useApi) {
      final updated = await ApiService.instance.submitDocumentation(
        activityId: activityId,
        driveUrl: driveUrl,
      );
      _replaceActivity(updated);
      await _persist();
      return updated;
    }
    await _simulateNetwork();
    final activity = activityById(activityId);
    if (activity == null) throw Exception('Kegiatan tidak ditemukan.');

    final updated = activity.copyWith(
      documentationUrl: driveUrl,
      docStatus: 'Dokumentasi: Sudah Unggah',
    );
    _replaceActivity(updated);
    await _persist();
    return updated;
  }

  Future<ContentPlanItem> submitContentProof({
    required String contentPlanId,
    required String videoLink,
    String? posterPath,
    String? videoFileName,
  }) async {
    if (_useApi) {
      final updated = await ApiService.instance.submitContentProof(
        contentPlanId: contentPlanId,
        videoLink: videoLink,
        posterPath: posterPath,
        videoFileName: videoFileName,
      );
      _replaceContentPlan(updated);
      await _persist();
      return updated;
    }
    await _simulateNetwork();
    final plan = contentPlanById(contentPlanId);
    if (plan == null) throw Exception('Content plan tidak ditemukan.');

    final updated = plan.copyWith(
      videoLink: videoLink,
      posterPath: posterPath,
      videoFileName: videoFileName,
      status: ContentPlanStatus.selesai,
      progress: 100,
    );
    _replaceContentPlan(updated);
    await _persist();
    return updated;
  }

  Future<void> markNotificationRead(String id) async {
    if (_useApi) {
      await ApiService.instance.markNotificationRead(id);
      await refresh(simulateNetwork: false);
      return;
    }
    final updatedNotifications = data.notifications
        .map((n) => n.id == id ? n.copyWith(isUnread: false) : n)
        .toList();
    _data = data.copyWith(notifications: updatedNotifications);
    await _persist();
  }

  Future<void> markAllNotificationsRead() async {
    if (_useApi) {
      await ApiService.instance.markAllNotificationsRead();
      await refresh(simulateNetwork: false);
      return;
    }
    final updatedNotifications =
        data.notifications.map((n) => n.copyWith(isUnread: false)).toList();
    _data = data.copyWith(notifications: updatedNotifications);
    await _persist();
  }

  Future<void> deleteNotification(String id) async {
    if (_useApi) {
      await ApiService.instance.deleteNotification(id);
      await refresh(simulateNetwork: false);
      return;
    }
    final updatedNotifications = data.notifications.where((n) => n.id != id).toList();
    _data = data.copyWith(notifications: updatedNotifications);
    await _persist();
  }

  void _replaceActivity(ActivityItem updated) {
    _data = data.copyWith(
      activities: data.activities.map((a) => a.id == updated.id ? updated : a).toList(),
      activityHistory:
          data.activityHistory.map((a) => a.id == updated.id ? updated : a).toList(),
    );
  }

  void _replaceContentPlan(ContentPlanItem updated) {
    _data = data.copyWith(
      contentPlans: data.contentPlans.map((c) => c.id == updated.id ? updated : c).toList(),
    );
  }

  bool _isSameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;
}