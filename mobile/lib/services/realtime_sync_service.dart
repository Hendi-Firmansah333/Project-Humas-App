import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:poli_humas/config/api_config.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/services/api_client.dart';
import 'package:poli_humas/services/api_service.dart';
import 'package:poli_humas/services/connectivity_service.dart';

/// Layanan sinkronisasi real-time Admin -> Mobile melalui SSE (`/api/events/stream`)
/// beserta fallback lightweight version polling (`/api/events/version`).
class RealtimeSyncService {
  RealtimeSyncService._();

  static final RealtimeSyncService instance = RealtimeSyncService._();

  static const _streamReconnectBase = Duration(seconds: 2);
  static const _streamReconnectMax = Duration(seconds: 15);
  static const _fallbackPollInterval = Duration(seconds: 18);
  static const _webPollInterval = Duration(seconds: 6);
  static const _tabSyncCooldown = Duration(seconds: 3);

  static const _knownScopes = <String>{
    'activities',
    'contentPlans',
    'schedules',
    'notifications',
    'teamLocations',
  };

  AppDataProvider? _provider;
  CancelToken? _sseCancelToken;
  Timer? _reconnectTimer;
  Timer? _pollTimer;
  Timer? _debounceTimer;

  bool _running = false;
  bool _isForeground = true;
  bool _sseConnected = false;
  bool _connectingSse = false;
  bool _versionCheckInFlight = false;
  int _reconnectAttempts = 0;

  DateTime? _lastTabCheckAt;
  final Map<String, int> _lastVersions = {};
  final Set<String> _pendingScopes = <String>{};

  void bindProvider(AppDataProvider provider) {
    _provider = provider;
  }

  Future<void> start() async {
    if (_running) return;
    if (!ApiConfig.enabled || !ApiClient.instance.hasToken) return;

    _running = true;
    _isForeground = true;
    _reconnectAttempts = 0;

    // 1. Cek versi perubahan terbaru langsung saat mulai
    unawaited(_checkVersionsAndSync());

    // 2. Buka SSE stream real-time (native IO: Android/iOS/Desktop)
    if (!kIsWeb) {
      unawaited(_connectSse());
    }

    // 3. Fallback polling ringan (Web atau saat SSE sedang tidak aktif / safety net)
    _startPollTimer();
  }

  void _startPollTimer() {
    _pollTimer?.cancel();
    final interval = kIsWeb ? _webPollInterval : _fallbackPollInterval;
    _pollTimer = Timer.periodic(interval, (_) {
      if (!_running || !_isForeground) return;
      if (!kIsWeb && _sseConnected) return;
      unawaited(_checkVersionsAndSync());
    });
  }

  void onAppPaused() {
    _isForeground = false;
    _disconnectSse();
    _reconnectTimer?.cancel();
  }

  void onAppResumed() {
    _isForeground = true;
    if (!_running) {
      if (ApiConfig.enabled && ApiClient.instance.hasToken) {
        unawaited(start());
      }
      return;
    }
    unawaited(_checkVersionsAndSync());
    if (!kIsWeb && !_sseConnected && !_connectingSse) {
      _reconnectAttempts = 0;
      unawaited(_connectSse());
    }
  }

  void onTabChanged() {
    if (!_running || !_isForeground) return;
    final now = DateTime.now();
    if (_lastTabCheckAt != null && now.difference(_lastTabCheckAt!) < _tabSyncCooldown) {
      return;
    }
    _lastTabCheckAt = now;

    // Jika SSE terputus atau belum tersambung, cek versi ringan saat berpindah tab
    if (kIsWeb || !_sseConnected) {
      unawaited(_checkVersionsAndSync());
    }
  }

  void _disconnectSse() {
    _sseConnected = false;
    _connectingSse = false;
    final token = _sseCancelToken;
    _sseCancelToken = null;
    if (token != null && !token.isCancelled) {
      token.cancel('stream closed');
    }
  }

  Future<void> _connectSse() async {
    if (!_running || !_isForeground || kIsWeb) return;
    if (_connectingSse || _sseConnected) return;
    if (!ApiConfig.enabled || !ApiClient.instance.hasToken) return;
    if (!ConnectivityService.instance.isOnline) {
      _scheduleReconnect();
      return;
    }

    _connectingSse = true;
    final cancelToken = CancelToken();
    _sseCancelToken = cancelToken;

    try {
      final response = await ApiClient.instance.dio.get<ResponseBody>(
        '/events/stream',
        cancelToken: cancelToken,
        options: Options(
          responseType: ResponseType.stream,
          receiveTimeout: Duration.zero,
          sendTimeout: const Duration(seconds: 10),
          headers: {'Accept': 'text/event-stream'},
        ),
      );

      final body = response.data;
      if (body == null) {
        throw StateError('Empty SSE stream body');
      }

      _sseConnected = true;
      _connectingSse = false;
      _reconnectAttempts = 0;

      final lines = const Utf8Decoder()
          .bind(body.stream.cast<List<int>>())
          .transform(const LineSplitter());

      await for (final line in lines) {
        if (!_running || !_isForeground || cancelToken.isCancelled) break;
        if (!line.startsWith('data:')) continue;
        final payloadText = line.substring(5).trim();
        if (payloadText.isEmpty) continue;
        _handleSsePayload(payloadText);
      }
    } on DioException catch (e) {
      if (e.type != DioExceptionType.cancel) {
        debugPrint('RealtimeSync SSE disconnected: ${e.message}');
      }
    } catch (e) {
      debugPrint('RealtimeSync SSE error: $e');
    } finally {
      final wasSameToken = _sseCancelToken == cancelToken;
      if (wasSameToken) {
        _sseCancelToken = null;
      }
      _sseConnected = false;
      _connectingSse = false;
      if (_running && _isForeground && !cancelToken.isCancelled) {
        _scheduleReconnect();
      }
    }
  }

  void _scheduleReconnect() {
    _reconnectTimer?.cancel();
    if (!_running || !_isForeground) return;
    final factor = 1 << _reconnectAttempts.clamp(0, 3);
    final delaySecs = (_streamReconnectBase.inSeconds * factor).clamp(
      _streamReconnectBase.inSeconds,
      _streamReconnectMax.inSeconds,
    );
    _reconnectAttempts++;
    _reconnectTimer = Timer(Duration(seconds: delaySecs), () {
      if (_running && _isForeground) {
        unawaited(_connectSse());
      }
    });
  }

  void _handleSsePayload(String rawJson) {
    try {
      final decoded = jsonDecode(rawJson);
      if (decoded is! Map<String, dynamic>) return;

      final scope = decoded['scope'] as String?;
      if (scope == 'ping') return;

      if (scope == 'connected') {
        final versions = decoded['versions'];
        if (versions is Map<String, dynamic>) {
          _applyVersionsMap(versions);
        }
        return;
      }

      if (scope != null && _knownScopes.contains(scope)) {
        final ts = (decoded['ts'] as num?)?.toInt();
        if (ts != null) {
          final prev = _lastVersions[scope] ?? 0;
          if (ts <= prev) return;
          _lastVersions[scope] = ts;
        }
        _queueScopeSync(scope);
      }
    } catch (_) {}
  }

  void _applyVersionsMap(Map<String, dynamic> versions) {
    final provider = _provider;
    final recentlySynced = provider?.lastFullSyncAt != null &&
        DateTime.now().difference(provider!.lastFullSyncAt!) < const Duration(seconds: 3);

    final changedScopes = <String>{};
    for (final scope in _knownScopes) {
      final serverTs = (versions[scope] as num?)?.toInt();
      if (serverTs == null) continue;
      final prevTs = _lastVersions[scope];
      if (prevTs == null) {
        _lastVersions[scope] = serverTs;
        if (!recentlySynced) {
          changedScopes.add(scope);
        }
      } else if (serverTs > prevTs) {
        _lastVersions[scope] = serverTs;
        changedScopes.add(scope);
      }
    }

    if (changedScopes.isNotEmpty) {
      _queueScopesSync(changedScopes);
    }
  }

  Future<void> _checkVersionsAndSync() async {
    if (!_running || _versionCheckInFlight) return;
    if (!ApiConfig.enabled || !ApiClient.instance.hasToken) return;
    if (!ConnectivityService.instance.isOnline) return;

    _versionCheckInFlight = true;
    try {
      final versions = await ApiService.instance.fetchRealtimeVersions();
      _applyVersionsMap(versions);
    } catch (e) {
      debugPrint('RealtimeSync version check error: $e');
    } finally {
      _versionCheckInFlight = false;
    }
  }

  void _queueScopeSync(String scope) {
    _pendingScopes.add(scope);
    _schedulePendingFlush();
  }

  void _queueScopesSync(Set<String> scopes) {
    _pendingScopes.addAll(scopes);
    _schedulePendingFlush();
  }

  void _schedulePendingFlush() {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 150), () {
      if (_pendingScopes.isEmpty) return;
      final scopes = Set<String>.from(_pendingScopes);
      _pendingScopes.clear();
      unawaited(_provider?.syncScopesSilent(scopes));
    });
  }

  void stop() {
    _running = false;
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    _pollTimer?.cancel();
    _pollTimer = null;
    _debounceTimer?.cancel();
    _debounceTimer = null;
    _pendingScopes.clear();
    _lastVersions.clear();
    _disconnectSse();
  }
}

