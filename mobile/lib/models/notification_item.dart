import 'package:flutter/material.dart';

enum NotificationType {
  kegiatanBaru,
  deadlineReminder,
  contentPlanBaru,
  verifikasi,
  jadwalBerubah,
  checkInReminder,
  umum,
}

class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.time,
    required this.icon,
    required this.color,
    required this.type,
    this.isUnread = true,
    this.group = 'Hari Ini',
    this.relatedEntityId,
    this.relatedEntityType,
    this.fcmPayload = const {},
    this.createdAt,
  });

  final String id;
  final String title;
  final String body;
  final String time;
  final IconData icon;
  final Color color;
  final NotificationType type;
  final bool isUnread;
  final String group;
  final String? relatedEntityId;
  final String? relatedEntityType;
  final Map<String, dynamic> fcmPayload;
  final DateTime? createdAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'body': body,
        'time': time,
        'iconCodePoint': icon.codePoint,
        'iconFontFamily': icon.fontFamily,
        'colorValue': color.toARGB32(),
        'type': type.name,
        'isUnread': isUnread,
        'group': group,
        'relatedEntityId': relatedEntityId,
        'relatedEntityType': relatedEntityType,
        'fcmPayload': fcmPayload,
        'createdAt': createdAt?.toIso8601String(),
      };

  static IconData _resolveIcon(NotificationType type) {
    switch (type) {
      case NotificationType.kegiatanBaru:
        return Icons.event_available;
      case NotificationType.contentPlanBaru:
        return Icons.camera_alt_outlined;
      case NotificationType.deadlineReminder:
        return Icons.timer_outlined;
      case NotificationType.verifikasi:
        return Icons.verified_outlined;
      case NotificationType.jadwalBerubah:
        return Icons.edit_calendar_outlined;
      case NotificationType.checkInReminder:
        return Icons.location_on_outlined;
      case NotificationType.umum:
      default:
        return Icons.notifications_none;
    }
  }

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    final notifType = NotificationType.values.firstWhere(
      (t) => t.name == json['type'],
      orElse: () => NotificationType.umum,
    );
    return AppNotification(
      id: json['id'] as String,
      title: json['title'] as String,
      body: json['body'] as String,
      time: json['time'] as String,
      icon: _resolveIcon(notifType),
      color: Color(json['colorValue'] as int? ?? 0xFF0D9488),
      type: notifType,
      isUnread: json['isUnread'] as bool? ?? true,
      group: json['group'] as String? ?? 'Hari Ini',
      relatedEntityId: json['relatedEntityId'] as String?,
      relatedEntityType: json['relatedEntityType'] as String?,
      fcmPayload: Map<String, dynamic>.from(json['fcmPayload'] as Map? ?? {}),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
    );
  }

  AppNotification copyWith({bool? isUnread}) => AppNotification(
        id: id,
        title: title,
        body: body,
        time: time,
        icon: icon,
        color: color,
        type: type,
        isUnread: isUnread ?? this.isUnread,
        group: group,
        relatedEntityId: relatedEntityId,
        relatedEntityType: relatedEntityType,
        fcmPayload: fcmPayload,
        createdAt: createdAt,
      );
}