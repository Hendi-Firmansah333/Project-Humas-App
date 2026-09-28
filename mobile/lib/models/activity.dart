class TimelineItem {
  const TimelineItem({
    required this.title,
    required this.time,
    required this.isActive,
    required this.isCompleted,
  });

  final String title;
  final String time;
  final bool isActive;
  final bool isCompleted;

  Map<String, dynamic> toJson() => {
        'title': title,
        'time': time,
        'isActive': isActive,
        'isCompleted': isCompleted,
      };

  factory TimelineItem.fromJson(Map<String, dynamic> json) => TimelineItem(
        title: json['title'] as String,
        time: json['time'] as String,
        isActive: json['isActive'] as bool? ?? false,
        isCompleted: json['isCompleted'] as bool? ?? false,
      );

  TimelineItem copyWith({
    String? title,
    String? time,
    bool? isActive,
    bool? isCompleted,
  }) =>
      TimelineItem(
        title: title ?? this.title,
        time: time ?? this.time,
        isActive: isActive ?? this.isActive,
        isCompleted: isCompleted ?? this.isCompleted,
      );
}

class AssignedEquipment {
  const AssignedEquipment({
    required this.id,
    required this.name,
    required this.code,
    required this.category,
    this.brand,
    required this.quantity,
    this.returnedQuantity = 0,
    this.returnCondition,
    this.status = 'SEDANG_DIGUNAKAN',
  });

  final int id;
  final String name;
  final String code;
  final String category;
  final String? brand;
  final int quantity;
  final int returnedQuantity;
  final String? returnCondition;
  final String status;

  bool get isReturned => returnedQuantity >= quantity || status == 'DIKEMBALIKAN';

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'code': code,
        'category': category,
        'brand': brand,
        'quantity': quantity,
        'returnedQuantity': returnedQuantity,
        'returnCondition': returnCondition,
        'status': status,
      };

  factory AssignedEquipment.fromJson(Map<String, dynamic> json) => AssignedEquipment(
        id: json['id'] as int? ?? 0,
        name: json['name'] as String? ?? '',
        code: json['code'] as String? ?? '',
        category: json['category'] as String? ?? '',
        brand: json['brand'] as String?,
        quantity: json['quantity'] as int? ?? 1,
        returnedQuantity: json['returnedQuantity'] as int? ?? 0,
        returnCondition: json['returnCondition'] as String?,
        status: json['status'] as String? ?? 'SEDANG_DIGUNAKAN',
      );
}

enum CheckInState { none, checkedIn, late, missed }

class ActivityItem {
  const ActivityItem({
    required this.id,
    required this.title,
    required this.description,
    required this.date,
    required this.time,
    required this.location,
    required this.picName,
    required this.picInitials,
    required this.status,
    this.checkInStatus = '',
    this.docStatus = '',
    this.latitude = -5.3582,
    this.longitude = 105.2321,
    this.geofenceRadiusMeters = 500,
    this.timeline = const [],
    this.documentationUrl,
    this.checkInState = CheckInState.none,
    this.selfiePath,
    this.scheduledAt,
    this.isHistory = false,
    this.checkInTime,
    this.adminNote,
    this.verificationStatus,
    this.jobDesk = '',
    this.assignedEquipments = const [],
  });

  final String id;
  final String title;
  final String description;
  final String date;
  final String time;
  final String location;
  final String picName;
  final String picInitials;
  final String status;
  final String checkInStatus;
  final String docStatus;
  final double latitude;
  final double longitude;
  final double geofenceRadiusMeters;
  final List<TimelineItem> timeline;
  final String? documentationUrl;
  final CheckInState checkInState;
  final String? selfiePath;
  final DateTime? scheduledAt;
  final bool isHistory;
  final String? checkInTime;
  final String? adminNote;
  final String? verificationStatus;
  final String jobDesk;
  final List<AssignedEquipment> assignedEquipments;

  bool get hasCheckedIn =>
      checkInState == CheckInState.checkedIn || checkInState == CheckInState.late;

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'date': date,
        'time': time,
        'location': location,
        'picName': picName,
        'picInitials': picInitials,
        'status': status,
        'checkInStatus': checkInStatus,
        'docStatus': docStatus,
        'latitude': latitude,
        'longitude': longitude,
        'geofenceRadiusMeters': geofenceRadiusMeters,
        'timeline': timeline.map((e) => e.toJson()).toList(),
        'documentationUrl': documentationUrl,
        'checkInState': checkInState.name,
        'selfiePath': selfiePath,
        'scheduledAt': scheduledAt?.toIso8601String(),
        'isHistory': isHistory,
        'checkInTime': checkInTime,
        'adminNote': adminNote,
        'verificationStatus': verificationStatus,
        'jobDesk': jobDesk,
        'assignedEquipments': assignedEquipments.map((e) => e.toJson()).toList(),
      };

  factory ActivityItem.fromJson(Map<String, dynamic> json) => ActivityItem(
        id: json['id'] as String,
        title: json['title'] as String,
        description: json['description'] as String? ?? '',
        date: json['date'] as String,
        time: json['time'] as String? ?? '',
        location: json['location'] as String? ?? '',
        picName: json['picName'] as String? ?? '',
        picInitials: json['picInitials'] as String? ?? '',
        status: json['status'] as String,
        checkInStatus: json['checkInStatus'] as String? ?? '',
        docStatus: json['docStatus'] as String? ?? '',
        latitude: (json['latitude'] as num?)?.toDouble() ?? -5.3582,
        longitude: (json['longitude'] as num?)?.toDouble() ?? 105.2321,
        geofenceRadiusMeters: (json['geofenceRadiusMeters'] as num?)?.toDouble() ?? 500,
        timeline: (json['timeline'] as List<dynamic>?)
                ?.map((e) => TimelineItem.fromJson(e as Map<String, dynamic>))
                .toList() ??
            const [],
        documentationUrl: json['documentationUrl'] as String?,
        checkInState: CheckInState.values.firstWhere(
          (s) => s.name == json['checkInState'],
          orElse: () => CheckInState.none,
        ),
        selfiePath: json['selfiePath'] as String?,
        scheduledAt: json['scheduledAt'] != null
            ? DateTime.tryParse(json['scheduledAt'] as String)
            : null,
        isHistory: json['isHistory'] as bool? ?? false,
        checkInTime: json['checkInTime'] as String?,
        adminNote: json['adminNote'] as String?,
        verificationStatus: json['verificationStatus'] as String?,
        jobDesk: json['jobDesk'] as String? ?? '',
        assignedEquipments: (json['assignedEquipments'] as List<dynamic>?)
                ?.map((e) => AssignedEquipment.fromJson(e as Map<String, dynamic>))
                .toList() ??
            const [],
      );

  ActivityItem copyWith({
    String? title,
    String? description,
    String? status,
    String? checkInStatus,
    String? docStatus,
    List<TimelineItem>? timeline,
    String? documentationUrl,
    CheckInState? checkInState,
    String? selfiePath,
    String? checkInTime,
    String? adminNote,
    String? verificationStatus,
    List<AssignedEquipment>? assignedEquipments,
    bool clearSelfie = false,
    bool clearDocumentation = false,
  }) =>
      ActivityItem(
        id: id,
        title: title ?? this.title,
        description: description ?? this.description,
        date: date,
        time: time,
        location: location,
        picName: picName,
        picInitials: picInitials,
        status: status ?? this.status,
        checkInStatus: checkInStatus ?? this.checkInStatus,
        docStatus: docStatus ?? this.docStatus,
        latitude: latitude,
        longitude: longitude,
        geofenceRadiusMeters: geofenceRadiusMeters,
        timeline: timeline ?? this.timeline,
        documentationUrl: clearDocumentation ? null : (documentationUrl ?? this.documentationUrl),
        checkInState: checkInState ?? this.checkInState,
        selfiePath: clearSelfie ? null : (selfiePath ?? this.selfiePath),
        scheduledAt: scheduledAt,
        isHistory: isHistory,
        checkInTime: checkInTime ?? this.checkInTime,
        adminNote: adminNote ?? this.adminNote,
        verificationStatus: verificationStatus ?? this.verificationStatus,
        jobDesk: jobDesk,
        assignedEquipments: assignedEquipments ?? this.assignedEquipments,
      );
}