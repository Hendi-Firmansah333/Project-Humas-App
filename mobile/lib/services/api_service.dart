import 'package:flutter/material.dart';
import 'package:poli_humas/config/api_config.dart';
import 'package:poli_humas/models/activity.dart';
import 'package:poli_humas/models/content_plan.dart';
import 'package:poli_humas/models/notification_item.dart';
import 'package:poli_humas/models/team_member.dart';
import 'package:poli_humas/models/duty_schedule.dart';
import 'package:poli_humas/repositories/app_repository.dart';
import 'package:poli_humas/services/api_client.dart';
import 'package:poli_humas/services/user_profile_service.dart';

class ApiService {
  ApiService._();

  static final ApiService instance = ApiService._();

  bool get isAvailable => ApiConfig.enabled && ApiClient.instance.hasToken;

  Future<Map<String, dynamic>> login(String username, String password) async {
    return ApiClient.instance.post('/auth/login', body: {
      'username': username,
      'password': password,
    });
  }

  Future<AppDataSnapshot> fetchSnapshot() async {
    const mobileQuery = {'page': 1, 'pageSize': 50, 'mobile': '1'};
    final userId = UserProfileService.instance.profile.id;

    final results = await Future.wait<Map<String, dynamic>>([
      ApiClient.instance.get('/activities', query: mobileQuery),
      ApiClient.instance.get('/activities/history', query: mobileQuery),
      ApiClient.instance.get('/content-plans', query: mobileQuery),
      ApiClient.instance.get('/notifications', query: mobileQuery),
      ApiClient.instance.get('/team-locations', query: {'mobile': '1'}),
      if (userId != null)
        ApiClient.instance
            .get('/schedules', query: {'userId': userId.toString()})
            .catchError((Object e) {
              debugPrint('Failed to fetch schedules: $e');
              return <String, dynamic>{};
            })
      else
        Future.value(<String, dynamic>{}),
    ]);

    final activities = results[0];
    final history = results[1];
    final contentPlans = results[2];
    final notifications = results[3];
    final team = results[4];
    final schedules = results[5];
    final schedulesList = schedules['items'] is List ? schedules['items'] as List<dynamic> : <dynamic>[];

    return AppDataSnapshot(
      activities: (activities['items'] as List<dynamic>? ?? [])
          .map((e) => _activityFromApi(e as Map<String, dynamic>))
          .toList(),
      activityHistory: (history['items'] as List<dynamic>? ?? [])
          .map((e) => _activityFromApi(e as Map<String, dynamic>))
          .toList(),
      contentPlans: (contentPlans['items'] as List<dynamic>? ?? [])
          .map((e) => ContentPlanItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      notifications: (notifications['items'] as List<dynamic>? ?? [])
          .map((e) => _notificationFromApi(e as Map<String, dynamic>))
          .toList(),
      teamMembers: (team['items'] as List<dynamic>? ?? [])
          .map((e) => TeamMember.fromJson(e as Map<String, dynamic>))
          .toList(),
      dutySchedules: schedulesList
          .map((e) => DutyScheduleItem.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<Map<String, dynamic>> fetchRealtimeVersions() {
    return ApiClient.instance.get('/events/version');
  }

  Future<({List<ActivityItem> active, List<ActivityItem> history})> fetchActivitiesSnapshotPair() async {
    const mobileQuery = {'page': 1, 'pageSize': 50, 'mobile': '1'};
    final results = await Future.wait<Map<String, dynamic>>([
      ApiClient.instance.get('/activities', query: mobileQuery),
      ApiClient.instance.get('/activities/history', query: mobileQuery),
    ]);
    return (
      active: (results[0]['items'] as List<dynamic>? ?? [])
          .map((e) => _activityFromApi(e as Map<String, dynamic>))
          .toList(),
      history: (results[1]['items'] as List<dynamic>? ?? [])
          .map((e) => _activityFromApi(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<List<ContentPlanItem>> fetchContentPlansSnapshotList() async {
    const mobileQuery = {'page': 1, 'pageSize': 50, 'mobile': '1'};
    final data = await ApiClient.instance.get('/content-plans', query: mobileQuery);
    return (data['items'] as List<dynamic>? ?? [])
        .map((e) => ContentPlanItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<AppNotification>> fetchNotificationsSnapshotList() async {
    const mobileQuery = {'page': 1, 'pageSize': 50, 'mobile': '1'};
    final data = await ApiClient.instance.get('/notifications', query: mobileQuery);
    return (data['items'] as List<dynamic>? ?? [])
        .map((e) => _notificationFromApi(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<TeamMember>> fetchTeamLocationsSnapshotList() async {
    final team = await ApiClient.instance.get('/team-locations', query: {'mobile': '1'});
    return (team['items'] as List<dynamic>? ?? [])
        .map((e) => TeamMember.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<DutyScheduleItem>> fetchSchedulesSnapshotList() async {
    final userId = UserProfileService.instance.profile.id;
    if (userId == null) return const [];
    final schedules = await ApiClient.instance.get('/schedules', query: {'userId': userId.toString()});
    final list = schedules['items'] is List ? schedules['items'] as List<dynamic> : <dynamic>[];
    return list.map((e) => DutyScheduleItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Map<String, dynamic>> fetchProfile() async {
    return ApiClient.instance.get('/auth/me');
  }

  Future<PagedResult<ActivityItem>> fetchActivities({
    int page = 1,
    String search = '',
    String statusFilter = 'Semua',
    bool history = false,
  }) async {
    final path = history ? '/activities/history' : '/activities';
    final query = <String, dynamic>{
      'page': page,
      'pageSize': AppRepository.pageSize,
      'mobile': '1',
    };
    if (search.isNotEmpty) query['search'] = search;

    final data = await ApiClient.instance.get(path, query: query);
    var items = (data['items'] as List<dynamic>? ?? [])
        .map((e) => _activityFromApi(e as Map<String, dynamic>))
        .toList();

    if (statusFilter != 'Semua') {
      items = items.where((item) => item.status == statusFilter).toList();
    }

    return PagedResult(
      items: items,
      hasMore: data['hasMore'] as bool? ?? false,
      total: data['total'] as int? ?? items.length,
    );
  }

  Future<PagedResult<ContentPlanItem>> fetchContentPlans({
    int page = 1,
    String search = '',
    String statusFilter = 'Semua',
  }) async {
    final query = <String, dynamic>{
      'page': page,
      'pageSize': AppRepository.pageSize,
      'mobile': '1',
    };
    if (search.isNotEmpty) query['search'] = search;

    final data = await ApiClient.instance.get('/content-plans', query: query);
    var items = (data['items'] as List<dynamic>? ?? [])
        .map((e) => ContentPlanItem.fromJson(e as Map<String, dynamic>))
        .toList();

    if (statusFilter != 'Semua') {
      items = items.where((item) => item.matchesFilter(statusFilter)).toList();
    }

    return PagedResult(
      items: items,
      hasMore: data['hasMore'] as bool? ?? false,
      total: data['total'] as int? ?? items.length,
    );
  }

  Future<PagedResult<AppNotification>> fetchNotifications({
    int page = 1,
    String filter = 'Semua',
    String search = '',
  }) async {
    final data = await ApiClient.instance.get('/notifications', query: {
      'page': page,
      'pageSize': AppRepository.pageSize,
      'filter': filter,
      'search': search,
      'mobile': '1',
    });
    final items = (data['items'] as List<dynamic>? ?? [])
        .map((e) => _notificationFromApi(e as Map<String, dynamic>))
        .toList();
    return PagedResult(
      items: items,
      hasMore: data['hasMore'] as bool? ?? false,
      total: data['total'] as int? ?? items.length,
    );
  }

  Future<ActivityItem> submitCheckIn({
    required String activityId,
    required String selfiePath,
    required bool isLate,
    double? latitude,
    double? longitude,
  }) async {
    final data = await ApiClient.instance.post('/activities/$activityId/check-in', body: {
      'selfiePath': selfiePath,
      'isLate': isLate,
      'latitude': ?latitude,
      'longitude': ?longitude,
    });
    return _activityFromApi(data['item'] as Map<String, dynamic>);
  }

  Future<ActivityItem> submitDocumentation({
    required String activityId,
    required String driveUrl,
  }) async {
    final data = await ApiClient.instance.post('/activities/$activityId/documentation', body: {
      'driveUrl': driveUrl,
    });
    return _activityFromApi(data['item'] as Map<String, dynamic>);
  }

  Future<ContentPlanItem> submitContentProof({
    required String contentPlanId,
    required String videoLink,
    String? caption,
    String? posterPath,
    String? videoFileName,
    bool sendToReview = true,
  }) async {
    final data = await ApiClient.instance.post('/content-plans/$contentPlanId/submit-proof', body: {
      'videoLink': videoLink,
      'caption': caption,
      'posterPath': posterPath,
      'videoFileName': videoFileName,
      'sendToReview': sendToReview,
    });
    return ContentPlanItem.fromJson(data['item'] as Map<String, dynamic>);
  }

  Future<void> markNotificationRead(String id) async {
    await ApiClient.instance.patch('/notifications/$id/read');
  }

  Future<void> markAllNotificationsRead() async {
    await ApiClient.instance.patch('/notifications/read-all');
  }

  Future<void> deleteNotification(String id) async {
    await ApiClient.instance.delete('/notifications/$id');
  }

  Future<void> syncLocation({
    required double latitude,
    required double longitude,
    required String address,
    bool isOnline = true,
    String? distance,
  }) async {
    await ApiClient.instance.post('/live-location/sync', body: {
      'latitude': latitude,
      'longitude': longitude,
      'address': address,
      'isOnline': isOnline,
      'distance': ?distance,
    });
  }

  ActivityItem _activityFromApi(Map<String, dynamic> json) {
    final timeline = (json['timeline'] as List<dynamic>? ?? [])
        .map((e) => TimelineItem.fromJson(e as Map<String, dynamic>))
        .toList();
    return ActivityItem.fromJson({...json, 'timeline': timeline.map((t) => t.toJson()).toList()});
  }

  AppNotification _notificationFromApi(Map<String, dynamic> json) {
    return AppNotification.fromJson({
      ...json,
      'iconCodePoint': json['iconCodePoint'] ?? Icons.notifications.codePoint,
      'colorValue': json['colorValue'] ?? 0xFF3B82F6,
    });
  }
}