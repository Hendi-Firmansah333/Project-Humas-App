class MemberActivityRecord {
  const MemberActivityRecord({
    required this.title,
    required this.dateLocation,
    required this.status,
  });

  final String title;
  final String dateLocation;
  final String status;

  Map<String, dynamic> toJson() => {
        'title': title,
        'dateLocation': dateLocation,
        'status': status,
      };

  factory MemberActivityRecord.fromJson(Map<String, dynamic> json) => MemberActivityRecord(
        title: json['title'] as String,
        dateLocation: json['dateLocation'] as String,
        status: json['status'] as String,
      );
}

class TeamMember {
  const TeamMember({
    required this.id,
    required this.name,
    required this.division,
    required this.distance,
    required this.location,
    required this.initials,
    required this.isOnDuty,
    required this.latitude,
    required this.longitude,
    this.lastUpdated,
    this.phone,
    this.completedTasks = 0,
    this.activityHistory = const [],
  });

  final String id;
  final String name;
  final String division;
  final String distance;
  final String location;
  final String initials;
  final bool isOnDuty;
  final double latitude;
  final double longitude;
  final DateTime? lastUpdated;
  final String? phone;
  final int completedTasks;
  final List<MemberActivityRecord> activityHistory;

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'division': division,
        'distance': distance,
        'location': location,
        'initials': initials,
        'isOnDuty': isOnDuty,
        'latitude': latitude,
        'longitude': longitude,
        'lastUpdated': lastUpdated?.toIso8601String(),
        'phone': phone,
        'completedTasks': completedTasks,
        'activityHistory': activityHistory.map((e) => e.toJson()).toList(),
      };

  factory TeamMember.fromJson(Map<String, dynamic> json) => TeamMember(
        id: json['id'] as String,
        name: json['name'] as String,
        division: json['division'] as String,
        distance: json['distance'] as String,
        location: json['location'] as String,
        initials: json['initials'] as String,
        isOnDuty: json['isOnDuty'] as bool? ?? false,
        latitude: (json['latitude'] as num).toDouble(),
        longitude: (json['longitude'] as num).toDouble(),
        lastUpdated: json['lastUpdated'] != null
            ? DateTime.tryParse(json['lastUpdated'] as String)
            : null,
        phone: json['phone'] as String?,
        completedTasks: json['completedTasks'] as int? ?? 0,
        activityHistory: (json['activityHistory'] as List<dynamic>?)
                ?.map((e) => MemberActivityRecord.fromJson(e as Map<String, dynamic>))
                .toList() ??
            const [],
      );

  TeamMember copyWith({
    double? latitude,
    double? longitude,
    String? distance,
    DateTime? lastUpdated,
    bool? isOnDuty,
  }) =>
      TeamMember(
        id: id,
        name: name,
        division: division,
        distance: distance ?? this.distance,
        location: location,
        initials: initials,
        isOnDuty: isOnDuty ?? this.isOnDuty,
        latitude: latitude ?? this.latitude,
        longitude: longitude ?? this.longitude,
        lastUpdated: lastUpdated ?? this.lastUpdated,
      );
}