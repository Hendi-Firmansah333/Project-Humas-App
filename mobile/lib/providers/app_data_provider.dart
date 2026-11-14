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
  Future<void>? _refreshInFlight;
  DateTime? _lastFullSyncAt;
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
  DateTime? get lastFullSyncAt => _lastFullSyncAt;

  ActivityItem? get todaySchedule => _repo.todaySchedule;
  List<ActivityItem> get activeSchedules => _repo.activeSchedules;
  List<ActivityItem> get upcomingActivities => _repo.upcomingActivities;
  String get todayCheckInLabel => _repo.todayCheckInLabel;
  CheckInState get todayCheckInState => _repo.todayCheckInState;
  ProfileStats get profileStats => _repo.computeProfileStats();
  int get unreadNotificationCount => _repo.unreadNotificationCount;
  List<TeamMember> get teamMembers => _repo.data.teamMembers;
  List<DutyScheduleItem> get dutySchedules => _repo.data.dutySchedules;

  Future<void> initCacheOnly() async {
    if (_initialized) return;
    await _repo.initCacheOnly();
    _connectivity.addListener(_onConnectivityChanged);
    _syncListStatesFromSnapshot();
    _initialized = true;
    notifyListeners();
  }

  Future<void> init() async {
    await initCacheOnly();
    await refreshAll(simulateNetwork: false);
  }

  void _onConnectivityChanged() {
    notifyListeners();
    if (_connectivity.isOnline) {
      refreshAll(simulateNetwork: false);
    }
  }

  void _syncListStatesFromSnapshot({Set<String>? scopes}) {
    final snap = _repo.data;
    final syncAll = scopes == null || scopes.contains('all');

    if (syncAll || scopes.contains('activities')) {
      final actFilter = activitiesState.filter;
      final actSearch = activitiesState.searchQuery.toLowerCase();
      final filteredActs = snap.activities.where((item) {
        final matchSearch = actSearch.isEmpty ||
            item.title.toLowerCase().contains(actSearch) ||
            item.description.toLowerCase().contains(actSearch);
        final matchFilter = actFilter == 'Semua' || item.status == actFilter;
        return matchSearch && matchFilter;
      }).toList();

      activitiesState = activitiesState.copyWith(
        items: filteredActs,
        page: 1,
        hasMore: _repo.isUsingApi && snap.activities.length >= 50,
        isLoading: false,
        isRefreshing: false,
        clearError: true,
      );

      final histFilter = historyState.filter;
      final histSearch = historyState.searchQuery.toLowerCase();
      final filteredHist = snap.activityHistory.where((item) {
        final matchSearch = histSearch.isEmpty || item.title.toLowerCase().contains(histSearch);
        final matchFilter = histFilter == 'Semua' || item.status == histFilter;
        return matchSearch && matchFilter;
      }).toList();

      historyState = historyState.copyWith(
        items: filteredHist,
        page: 1,
        hasMore: _repo.isUsingApi && snap.activityHistory.length >= 50,
        isLoading: false,
        isRefreshing: false,
        clearError: true,
      );
    }

    if (syncAll || scopes.contains('contentPlans')) {
      final cpFilter = contentPlansState.filter;
      final cpSearch = contentPlansState.searchQuery.toLowerCase();
      final filteredCp = snap.contentPlans.where((item) {
        final matchSearch = cpSearch.isEmpty ||
            item.title.toLowerCase().contains(cpSearch) ||
            item.description.toLowerCase().contains(cpSearch);
        final matchFilter = item.matchesFilter(cpFilter);
        return matchSearch && matchFilter;
      }).toList();

      contentPlansState = contentPlansState.copyWith(
        items: filteredCp,
        page: 1,
        hasMore: _repo.isUsingApi && snap.contentPlans.length >= 50,
        isLoading: false,
        isRefreshing: false,
        clearError: true,
      );
    }

    if (syncAll || scopes.contains('notifications')) {
      final nFilter = notificationsState.filter;
      final nSearch = notificationsState.searchQuery.toLowerCase();
      final filteredNotifs = snap.notifications.where((n) {
        final matchSearch = nSearch.isEmpty ||
            n.title.toLowerCase().contains(nSearch) ||
            n.body.toLowerCase().contains(nSearch);
        if (nFilter == 'Belum Dibaca') return matchSearch && n.isUnread;
        if (nFilter == 'Sudah Dibaca') return matchSearch && !n.isUnread;
        return matchSearch;
      }).toList();

      notificationsState = notificationsState.copyWith(
        items: filteredNotifs,
        page: 1,
        hasMore: _repo.isUsingApi && snap.notifications.length >= 50,
        isLoading: false,
        isRefreshing: false,
        clearError: true,
      );
    }
  }

  ActivityItem? activityById(String id) => _repo.activityById(id);
  ContentPlanItem? contentPlanById(String id) => _repo.contentPlanById(id);
  AppNotification? notificationById(String id) => _repo.notificationById(id);

  Future<void> refreshAll({bool simulateNetwork = false}) {
    if (_refreshInFlight != null) return _refreshInFlight!;

    final future = _doRefreshAll(simulateNetwork: simulateNetwork).whenComplete(() {
      _refreshInFlight = null;
    });
    _refreshInFlight = future;
    return future;
  }

  Future<void> _doRefreshAll({bool simulateNetwork = false}) async {
    _isRefreshingAll = true;
    _globalError = null;
    notifyListeners();
    try {
      if (_connectivity.isOnline) {
        await _repo.refresh(simulateNetwork: simulateNetwork);
        if (_repo.isUsingApi) {
          _lastFullSyncAt = DateTime.now();
        }
      }
      _syncListStatesFromSnapshot();
    } catch (e) {
      _globalError = e.toString();
    } finally {
      _isRefreshingAll = false;
      notifyListeners();
    }
  }

  Future<void> syncScopesSilent(Set<String> scopes) async {
    if (!_repo.isUsingApi || !_connectivity.isOnline || scopes.isEmpty) return;
    try {
      await _repo.refreshScopes(scopes);
      if (scopes.contains('all')) {
        _lastFullSyncAt = DateTime.now();
      }
      _syncListStatesFromSnapshot(scopes: scopes);
      notifyListeners();
    } catch (e) {
      debugPrint('Silent realtime sync error ($scopes): $e');
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
    double? latitude,
    double? longitude,
  }) async {
    final updated = await _repo.submitCheckIn(
      activityId: activityId,
      selfiePath: selfiePath,
      isLate: isLate,
      latitude: latitude,
      longitude: longitude,
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
    String? caption,
    String? posterPath,
    String? videoFileName,
    bool sendToReview = true,
  }) async {
    final updated = await _repo.submitContentProof(
      contentPlanId: contentPlanId,
      videoLink: videoLink,
      caption: caption,
      posterPath: posterPath,
      videoFileName: videoFileName,
      sendToReview: sendToReview,
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