import 'package:flutter/material.dart';
import 'package:poli_humas/models/notification_item.dart';

/// Stub siap integrasi Firebase Cloud Messaging.
/// Panggil [initialize] saat menambahkan package firebase_messaging.
class FcmService {
  FcmService._();

  static final FcmService instance = FcmService._();

  Future<void> initialize() async {
    // TODO(api): firebase_messaging — request permission, get token, onMessage listener.
  }

  AppNotification? notificationFromRemoteMessage(Map<String, dynamic> payload) {
    return AppNotification(
      id: payload['id'] as String? ?? DateTime.now().millisecondsSinceEpoch.toString(),
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
}