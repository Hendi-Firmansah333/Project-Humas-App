class DutyScheduleItem {
  const DutyScheduleItem({
    required this.id,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.shiftName,
    required this.notes,
    required this.location,
    required this.status,
  });

  final String id;
  final String date;
  final String startTime;
  final String endTime;
  final String shiftName;
  final String notes;
  final String location;
  final String status;

  String get timeLabel => '$startTime - $endTime WIB';

  String get formattedDate {
    if (date.isEmpty) return '';
    try {
      // Parse YYYY-MM-DD or ISO String
      final dt = DateTime.parse(date);
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const days = [
        'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'
      ];
      final dayName = days[dt.weekday - 1];
      final monthName = months[dt.month - 1];
      return '$dayName, ${dt.day} $monthName ${dt.year}';
    } catch (_) {
      return date;
    }
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'date': date,
        'startTime': startTime,
        'endTime': endTime,
        'shiftName': shiftName,
        'notes': notes,
        'location': location,
        'status': status,
      };

  factory DutyScheduleItem.fromJson(Map<String, dynamic> json) {
    return DutyScheduleItem(
      id: (json['id'] ?? '').toString(),
      date: json['date'] as String? ?? '',
      startTime: json['startTime'] as String? ?? '08:00',
      endTime: json['endTime'] as String? ?? '16:00',
      shiftName: json['shiftName'] as String? ?? 'Pagi',
      notes: json['notes'] as String? ?? '',
      location: json['location'] as String? ?? 'Kantor Humas',
      status: json['status'] as String? ?? 'AKAN_DATANG',
    );
  }
}
