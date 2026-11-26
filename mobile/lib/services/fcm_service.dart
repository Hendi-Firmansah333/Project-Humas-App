import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:poli_humas/config/api_config.dart';
import 'package:poli_humas/models/notification_item.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/services/api_client.dart';
import 'package:poli_humas/services/api_service.dart';
import 'package:poli_humas/services/app_navigation_service.dart';
import 'package:poli_humas/services/app_settings_service.dart';

const String kPrimaNotificationChannelId = 'prima_notifications';
const String kPrimaNotificationChannelName = 'Notifikasi PRIMA Humas';
const String kPrimaNotificationChannelDesc =
    'Notifikasi penugasan kegiatan, konten, dan jadwal piket Tim Humas Polinela.';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint('FCM background init skipped: $e');
  }
}

/// Layanan Firebase Cloud Messaging + Local Notifications agar notifikasi
/// muncul di luar aplikasi (background, lock screen, dan saat app ditutup).
class FcmService {
  FcmService._();

  static final FcmService instance = FcmService._();

  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  bool _initialized = false;
  bool _firebaseReady = false;
  String? _currentToken;
  AppDataProvider? _provider;
  StreamSubscription<RemoteMessage>? _onMessageSub;
  StreamSubscription<RemoteMessage>? _onOpenedAppSub;
  StreamSubscription<String>? _onTokenRefreshSub;

  bool get isReady => _firebaseReady;

  void bindProvider(AppDataProvider provider) {
    _provider = provider;
  }

  Future<void> initialize() async {
    if (_initialized || kIsWeb) return;
    _initialized = true;

    try {
      await Firebase.initializeApp();
      _firebaseReady = true;
    } catch (e) {
      debugPrint(
        'Firebase belum dikonfigurasi (tambahkan google-services.json): $e',
      );
      _firebaseReady = false;
      return;
    }

    try {
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
      await _initLocalNotifications();
      await _requestPermissions();

      await FirebaseMessaging.instance
          .setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );

      _onMessageSub = FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
      _onOpenedAppSub =
          FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
      _onTokenRefreshSub =
          FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
        _currentToken = newToken;
        unawaited(syncTokenWithBackend());
      });

      final initialMessage =
          await FirebaseMessaging.instance.getInitialMessage();
      if (initialMessage != null) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _handleNotificationTap(initialMessage);
        });
      }

      if (ApiConfig.enabled && ApiClient.instance.hasToken) {
        unawaited(syncTokenWithBackend());
      }
    } catch (e) {
      debugPrint('FCM initialize error: $e');
    }
  }

  Future<void> _initLocalNotifications() async {
    const androidInit = AndroidInitializationSettings('@mipmap/launcher_icon');
    const iosInit = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    await _localNotifications.initialize(
      const InitializationSettings(android: androidInit, iOS: iosInit),
      onDidReceiveNotificationResponse: (_) {
        _openNotificationsTab();
      },
    );

    const channel = AndroidNotificationChannel(
      kPrimaNotificationChannelId,
      kPrimaNotificationChannelName,
      description: kPrimaNotificationChannelDesc,
      importance: Importance.max,
      playSound: true,
      enableVibration: true,
    );

    final androidPlugin = _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();
    await androidPlugin?.createNotificationChannel(channel);
    await androidPlugin?.requestNotificationsPermission();
  }

  Future<void> _requestPermissions() async {
    await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );
  }

  Future<void> syncTokenWithBackend() async {
    if (!_firebaseReady || kIsWeb) return;
    if (!ApiConfig.enabled || !ApiClient.instance.hasToken) return;
    if (!AppSettingsService.instance.notificationsEnabled) {
      await unregisterTokenFromBackend();
      return;
    }

    try {
      final token = _currentToken ?? await FirebaseMessaging.instance.getToken();
      if (token == null || token.isEmpty) return;
      _currentToken = token;
      final platform =
          defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android';
      await ApiService.instance.registerDeviceToken(token, platform: platform);
    } catch (e) {
      debugPrint('FCM token sync error: $e');
    }
  }

  Future<void> unregisterTokenFromBackend() async {
    if (!_firebaseReady || kIsWeb) return;
    if (!ApiConfig.enabled || !ApiClient.instance.hasToken) return;
    try {
      final token = _currentToken ?? await FirebaseMessaging.instance.getToken();
      await ApiService.instance.unregisterDeviceToken(token: token);
    } catch (e) {
      debugPrint('FCM token unregister error: $e');
    }
  }

  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    unawaited(
      _provider?.syncScopesSilent(const {
        'notifications',
        'activities',
        'contentPlans',
        'schedules',
      }),
    );

    if (!AppSettingsService.instance.notificationsEnabled) return;

    final title = message.notification?.title ??
        message.data['title'] as String? ??
        'Notifikasi PRIMA';
    final body =
        message.notification?.body ?? message.data['body'] as String? ?? '';

    await showLocalNotification(title: title, body: body);
  }

  Future<void> showLocalNotification({
    required String title,
    required String body,
    int? id,
  }) async {
    if (kIsWeb || !_firebaseReady) return;
    if (!AppSettingsService.instance.notificationsEnabled) return;
    try {
      await _localNotifications.show(
        id ?? DateTime.now().millisecondsSinceEpoch.remainder(100000),
        title,
        body,
        const NotificationDetails(
          android: AndroidNotificationDetails(
            kPrimaNotificationChannelId,
            kPrimaNotificationChannelName,
            channelDescription: kPrimaNotificationChannelDesc,
            importance: Importance.max,
            priority: Priority.high,
            icon: '@mipmap/launcher_icon',
            playSound: true,
            enableVibration: true,
          ),
          iOS: DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
          ),
        ),
      );
    } catch (e) {
      debugPrint('Local notification show error: $e');
    }
  }

  void _handleNotificationTap(RemoteMessage message) {
    unawaited(
      _provider?.syncScopesSilent(const {
        'notifications',
        'activities',
        'contentPlans',
        'schedules',
      }),
    );
    _openNotificationsTab();
  }

  void _openNotificationsTab() {
    AppNavigationService.instance.goNotifications?.call();
  }

  AppNotification? notificationFromRemoteMessage(Map<String, dynamic> payload) {
    return AppNotification(
      id: payload['id'] as String? ??
          DateTime.now().millisecondsSinceEpoch.toString(),
      title: payload['title'] as String? ?? 'Notifikasi',
      body: payload['body'] as String? ?? '',
      time: 'Baru saja',
      icon: Icons.notifications,
      color: const Color(0xFF3B82F6),
      type: NotificationType.umum,
      fcmPayload: payload,
      relatedEntityId: payload['entity_id'] as String?,
      relatedEntityType: payload['entity_type'] as String?,
      createdAt: DateTime.now(),
    );
  }

  void dispose() {
    _onMessageSub?.cancel();
    _onOpenedAppSub?.cancel();
    _onTokenRefreshSub?.cancel();
  }
}
