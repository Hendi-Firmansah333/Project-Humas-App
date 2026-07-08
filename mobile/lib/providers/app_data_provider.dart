import 'package:flutter/foundation.dart';
import 'package:poli_humas/models/activity.dart';
import 'package:poli_humas/models/content_plan.dart';
import 'package:poli_humas/models/notification_item.dart';
import 'package:poli_humas/models/team_member.dart';
import 'package:poli_humas/models/duty_schedule.dart';
import 'package:poli_humas/repositories/app_repository.dart';
import 'package:poli_humas/services/connectivity_service.dart';

class ListLoadState<T> {
  const ListLoadState({
    this.items = const [],
    this.page = 1,
    this.hasMore = true,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.isRefreshing = false,
    this.error,
    this.searchQuery = '',
    this.filter = 'Semua',
  });

  final List<T> items;
  final int page;
  final bool hasMore;
  final bool isLoading;
  final bool isLoadingMore;
  final bool isRefreshing;
  final String? error;
  final String searchQuery;
  final String filter;

  ListLoadState<T> copyWith({
    List<T>? items,
    int? page,
    bool? hasMore,
    bool? isLoading,
    bool? isLoadingMore,
    bool? isRefreshing,
    String? error,
    bool clearError = false,
    String? searchQuery,
    String? filter,
  }) =>
      ListLoadState(
        items: items ?? this.items,
        page: page ?? this.page,
        hasMore: hasMore ?? this.hasMore,
        isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        isRefreshing: isRefreshing ?? this.isRefreshing,
        error: clearError ? null : (error ?? this.error),
        searchQuery: searchQuery ?? this.searchQuery,
        filter: filter ?? this.filter,
      );
}

class AppDataProvider extends ChangeNotifier {
  AppDataProvider({
    AppRepository? repository,
    ConnectivityService? connectivity,
  })  : _repo = repository ?? AppRepository.instance,
        _connectivity = connectivity ?? ConnectivityService.instance;

  final AppRepository _repo;
  final ConnectivityService _connectivity;

  bool _initialized = false;
  bool _isRefreshingAll = false;
  String? _globalError;

  ListLoadState<ActivityItem> activitiesState = const ListLoadState();
  ListLoadState<ActivityItem> historyState = const ListLoadState(filter: 'Semua');
  ListLoadState<ContentPlanItem> contentPlansState =
      const ListLoadState(filter: 'Semua');
  ListLoadState<AppNotification> notificationsState = const ListLoadState();

  bool get isInitialized => _initialized;
  bool get isRefreshingAll => _isRefreshingAll;
  bool get isOffline => !_connectivity.isOnline;
  String? get globalError => _globalError;

  ActivityItem? get todaySchedule => _repo.todaySchedule;
  List<ActivityItem> get upcomingActivities => _repo.upcomingActivities;
  String get todayCheckInLabel => _repo.todayCheckInLabel;
  CheckInState get todayCheckInState => _repo.todayCheckInState;
  ProfileStats get profileStats => _repo.computeProfileStats();
  int get unreadNotificationCount => _repo.unreadNotificationCount;
  List<TeamMember> get teamMembers => _repo.data.teamMembers;
  List<DutyScheduleItem> get dutySchedules => _repo.data.dutySchedules;

  Future<void> init() async {
    if (_initialized) return;
    await _repo.init();
    _connectivity.addListener(_onConnectivityChanged);
    await refreshAll();
    _initialized = true;
    notifyListeners();
  }

  void _onConnectivityChanged() {
    notifyListeners();
    if (_connectivity.isOnline) {
      refreshAll(simulateNetwork: false);
    }
  }

  ActivityItem? activityById(String id) => _repo.activityById(id);
  ContentPlanItem? contentPlanById(String id) => _repo.contentPlanById(id);
  AppNotification? notificationById(String id) => _repo.notificationById(id);

  Future<void> refreshAll({bool simulateNetwork = true}) async {
    _isRefreshingAll = true;
    _globalError = null;
    notifyListeners();
    try {
      if (_connectivity.isOnline) {
        await _repo.refresh(simulateNetwork: simulateNetwork);
      }
      await Future.wait([
        loadActivities(refresh: true, simulateNetwork: simulateNetwork),
        loadActivityHistory(refresh: true),
        loadContentPlans(refresh: true),
        loadNotifications(refresh: true),
      ]);
    } catch (e) {
      _globalError = e.toString();
    } finally {
      _isRefreshingAll = false;
      notifyListeners();
    }
  }

  Future<void> loadActivities({
    bool refresh = false,
    bool loadMore = false,
    String? search,
    String? filter,
    bool simulateNetwork = true,
  }) async {
    if (loadMore && (!activitiesState.hasMore || activitiesState.isLoadingMore)) return;
    if (!loadMore && activitiesState.isLoading && !refresh) return;

    final nextSearch = search ?? activitiesState.searchQuery;
    final nextFilter = filter ?? activitiesState.filter;
    final nextPage = loadMore ? activitiesState.page + 1 : 1;

    activitiesState = activitiesState.copyWith(
      isLoading: !loadMore && !refresh,
      isLoadingMore: loadMore,
      isRefreshing: refresh,
      searchQuery: nextSearch,
      filter: nextFilter,
      clearError: true,
    );
    notifyListeners();

    try {
      if (!_connectivity.isOnline && activitiesState.items.isEmpty) {
        throw Exception('Tidak ada koneksi internet dan data cache kosong.');
      }
      final result = await _repo.fetchActivities(
        page: nextPage,
        search: nextSearch,
        statusFilter: nextFilter,
      );
      final merged = loadMore ? [...activitiesState.items, ...result.items] : result.items;
      activitiesState = activitiesState.copyWith(
        items: merged,
        page: nextPage,
        hasMore: result.hasMore,
        isLoading: false,
        isLoadingMore: false,
        isRefreshing: false,
      );
    } catch (e) {
      activitiesState = activitiesState.copyWith(
        isLoading: false,
        isLoadingMore: false,
        isRefreshing: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
    }
    notifyListeners();
  }

  Future<void> loadActivityHistory({
    bool refresh = false,
    bool loadMore = false,
    String? search,
    String? filter,
  }) async {
    if (loadMore && (!historyState.hasMore || historyState.isLoadingMore)) return;

    final nextSearch = search ?? historyState.searchQuery;
    final nextFilter = filter ?? historyState.filter;
    final nextPage = loadMore ? historyState.page + 1 : 1;

    historyState = historyState.copyWith(
      isLoading: !loadMore && !refresh,
      isLoadingMore: loadMore,
      isRefreshing: refresh,
      searchQuery: nextSearch,
      filter: nextFilter,
      clearError: true,
    );
    notifyListeners();

    try {
      final result = await _repo.fetchActivityHistory(
        page: nextPage,
        search: nextSearch,
        statusFilter: nextFilter,
      );
      final merged = loadMore ? [...historyState.items, ...result.items] : result.items;
      historyState = historyState.copyWith(
        items: merged,
        page: nextPage,
        hasMore: result.hasMore,
        isLoading: false,
        isLoadingMore: false,
        isRefreshing: false,
      );
    } catch (e) {
      historyState = historyState.copyWith(
        isLoading: false,
        isLoadingMore: false,
        isRefreshing: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
    }
    notifyListeners();
  }

  Future<void> loadContentPlans({
    bool refresh = false,
    bool loadMore = false,
    String? search,
    String? filter,
  }) async {
    if (loadMore && (!contentPlansState.hasMore || contentPlansState.isLoadingMore)) return;

    final nextSearch = search ?? contentPlansState.searchQuery;
    final nextFilter = filter ?? contentPlansState.filter;
    final nextPage = loadMore ? contentPlansState.page + 1 : 1;

    contentPlansState = contentPlansState.copyWith(
      isLoading: !loadMore && !refresh,
      isLoadingMore: loadMore,
      isRefreshing: refresh,
      searchQuery: nextSearch,
      filter: nextFilter,
      clearError: true,
    );
    notifyListeners();

    try {
      final result = await _repo.fetchContentPlans(
        page: nextPage,
        statusFilter: nextFilter,
        search: nextSearch,
      );
      final merged = loadMore ? [...contentPlansState.items, ...result.items] : result.items;
      contentPlansState = contentPlansState.copyWith(
        items: merged,
        page: nextPage,
        hasMore: result.hasMore,
        isLoading: false,
        isLoadingMore: false,
        isRefreshing: false,
      );
    } catch (e) {
      contentPlansState = contentPlansState.copyWith(
        isLoading: false,
        isLoadingMore: false,
        isRefreshing: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
    }
    notifyListeners();
  }

  Future<void> loadNotifications({
    bool refresh = false,
    bool loadMore = false,
    String? search,
    String? filter,
  }) async {
    if (loadMore && (!notificationsState.hasMore || notificationsState.isLoadingMore)) return;

    final nextSearch = search ?? notificationsState.searchQuery;
    final nextFilter = filter ?? notificationsState.filter;
    final nextPage = loadMore ? notificationsState.page + 1 : 1;

    notificationsState = notificationsState.copyWith(
      isLoading: !loadMore && !refresh,
      isLoadingMore: loadMore,
      isRefreshing: refresh,
      searchQuery: nextSearch,
      filter: nextFilter,
      clearError: true,
    );
    notifyListeners();

    try {
      final result = await _repo.fetchNotifications(
        page: nextPage,
        filter: nextFilter,
        search: nextSearch,
      );
      final merged = loadMore ? [...notificationsState.items, ...result.items] : result.items;
      notificationsState = notificationsState.copyWith(
        items: merged,
        page: nextPage,
        hasMore: result.hasMore,
        isLoading: false,
        isLoadingMore: false,
        isRefreshing: false,
      );
    } catch (e) {
      notificationsState = notificationsState.copyWith(
        isLoading: false,
        isLoadingMore: false,
        isRefreshing: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
    }
    notifyListeners();
  }

  Future<ActivityItem> submitCheckIn({
    required String activityId,
    required String selfiePath,
    required bool isLate,
  }) async {
    final updated = await _repo.submitCheckIn(
      activityId: activityId,
      selfiePath: selfiePath,
      isLate: isLate,
    );
    await refreshAll(simulateNetwork: false);
    return updated;
  }

  Future<ActivityItem> submitDocumentation({
    required String activityId,
    required String driveUrl,
  }) async {
    final updated = await _repo.submitDocumentation(activityId: activityId, driveUrl: driveUrl);
    await refreshAll(simulateNetwork: false);
    return updated;
  }

  Future<ContentPlanItem> submitContentProof({
    required String contentPlanId,
    required String videoLink,
    String? posterPath,
    String? videoFileName,
  }) async {
    final updated = await _repo.submitContentProof(
      contentPlanId: contentPlanId,
      videoLink: videoLink,
      posterPath: posterPath,
      videoFileName: videoFileName,
    );
    await refreshAll(simulateNetwork: false);
    return updated;
  }

  Future<void> markNotificationRead(String id) async {
    await _repo.markNotificationRead(id);
    await loadNotifications(refresh: true);
    notifyListeners();
  }

  Future<void> markAllNotificationsRead() async {
    await _repo.markAllNotificationsRead();
    await loadNotifications(refresh: true);
    notifyListeners();
  }

  Future<void> deleteNotification(String id) async {
    await _repo.deleteNotification(id);
    await loadNotifications(refresh: true);
    notifyListeners();
  }

  Future<void> refreshTeamLocations({bool simulateNetwork = false}) async {
    if (_connectivity.isOnline) {
      await _repo.refresh(simulateNetwork: simulateNetwork);
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _connectivity.removeListener(_onConnectivityChanged);
    super.dispose();
  }
}