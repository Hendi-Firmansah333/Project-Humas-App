import 'package:flutter/material.dart';
import 'package:poli_humas/models/activity.dart';
import 'package:poli_humas/models/content_plan.dart';
import 'package:poli_humas/models/notification_item.dart';
import 'package:poli_humas/models/team_member.dart';
import 'package:poli_humas/models/duty_schedule.dart';

const currentUserName = 'Komang Ari';
const currentUserRole = 'Tim Kehumasan';
const currentUserPhone = '0812-3456-7890';
const currentUserEmail = 'komang@polinela.ac.id';

const polinelaCenterLat = -5.3582;
const polinelaCenterLng = 105.2321;

List<ActivityItem> buildSeedActivities() {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);

  return [
    ActivityItem(
      id: '1',
      title: 'Peliputan Kunjungan Industri',
      description:
          'Dokumentasi dan publikasi kunjungan industri mahasiswa ke pabrik mitra Polinela.',
      date: _formatDate(today),
      time: '09:00 - 12:00 WIB',
      location: 'Gedung Serba Guna (GSG)',
      picName: 'Budi Santoso',
      picInitials: 'BS',
      status: 'Sedang Berlangsung',
      scheduledAt: today.add(const Duration(hours: 9)),
      timeline: const [
        TimelineItem(title: 'Briefing Tim', time: '08:30 WIB', isActive: false, isCompleted: true),
        TimelineItem(title: 'Peliputan Utama', time: '09:00 WIB', isActive: true, isCompleted: false),
        TimelineItem(title: 'Wawancara Narasumber', time: '10:30 WIB', isActive: false, isCompleted: false),
        TimelineItem(title: 'Upload & Serah Terima', time: '12:00 WIB', isActive: false, isCompleted: false),
      ],
    ),
    ActivityItem(
      id: '2',
      title: 'Rapat Koordinasi Humas',
      description: 'Pembahasan strategi publikasi dan evaluasi kinerja tim.',
      date: _formatDate(today.add(const Duration(days: 2))),
      time: '13:00 - 15:00 WIB',
      location: 'Ruang Rapat Utama',
      picName: 'Anita Wijaya',
      picInitials: 'AN',
      status: 'Akan Datang',
      scheduledAt: today.add(const Duration(days: 2, hours: 13)),
      timeline: const [
        TimelineItem(title: 'Registrasi Peserta', time: '12:45 WIB', isActive: false, isCompleted: false),
        TimelineItem(title: 'Rapat Koordinasi', time: '13:00 WIB', isActive: false, isCompleted: false),
        TimelineItem(title: 'Penyusunan Notulen', time: '15:00 WIB', isActive: false, isCompleted: false),
      ],
    ),
    ActivityItem(
      id: '3',
      title: 'Liputan Wisuda',
      description: 'Dokumentasi wisuda ke-48 Politeknik Negeri Lampung.',
      date: _formatDate(today.add(const Duration(days: 5))),
      time: '08:00 - 12:00 WIB',
      location: 'Gedung Serba Guna (GSG)',
      picName: 'Dimas Rizky',
      picInitials: 'DR',
      status: 'Akan Datang',
      scheduledAt: today.add(const Duration(days: 5, hours: 8)),
      timeline: const [
        TimelineItem(title: 'Persiapan Alat', time: '07:30 WIB', isActive: false, isCompleted: false),
        TimelineItem(title: 'Liputan Utama', time: '08:00 WIB', isActive: false, isCompleted: false),
        TimelineItem(title: 'Sesi Foto Bersama', time: '11:00 WIB', isActive: false, isCompleted: false),
      ],
    ),
    ActivityItem(
      id: '4',
      title: 'Kunjungan Industri SMK 1',
      description: 'Penerimaan tamu dan campus tour untuk siswa multimedia.',
      date: _formatDate(today.subtract(const Duration(days: 3))),
      time: '09:00 - 11:30 WIB',
      location: 'Lobby Rektorat',
      picName: 'Dimas Rizky',
      picInitials: 'DR',
      status: 'Selesai',
      scheduledAt: today.subtract(const Duration(days: 3, hours: -9)),
      checkInState: CheckInState.checkedIn,
      checkInStatus: 'Check-in: Berhasil',
      docStatus: 'Dokumentasi: Sudah Unggah',
      documentationUrl: 'https://drive.google.com/file/d/example',
      checkInTime: '08:30 WIB',
      verificationStatus: 'Terverifikasi Admin',
      adminNote:
          'Foto peliputan sudah sesuai standar humas, kualitas resolusi baik. Link dokumentasi Google Drive aktif.',
      timeline: const [
        TimelineItem(title: 'Sambutan Tamu', time: '09:00 WIB', isActive: false, isCompleted: true),
        TimelineItem(title: 'Campus Tour', time: '10:00 WIB', isActive: false, isCompleted: true),
      ],
    ),
    ActivityItem(
      id: '5',
      title: 'Pameran Pendidikan',
      description: 'Peliputan stan Polinela di pameran pendidikan regional.',
      date: _formatDate(today.subtract(const Duration(days: 10))),
      time: '10:00 - 16:00 WIB',
      location: 'Gedung Serba Guna (GSG)',
      picName: 'Siti Aminah',
      picInitials: 'SA',
      status: 'Selesai',
      isHistory: true,
      scheduledAt: today.subtract(const Duration(days: 10)),
      checkInState: CheckInState.checkedIn,
      checkInStatus: 'Check-in: Berhasil',
      docStatus: 'Dokumentasi: Sudah Unggah',
      checkInTime: '09:15 WIB',
      verificationStatus: 'Terverifikasi Admin',
      adminNote: 'Kehadiran tercatat tepat waktu. Dokumentasi lengkap.',
      documentationUrl: 'https://drive.google.com/file/d/pameran',
    ),
    ActivityItem(
      id: '6',
      title: 'Workshop Media Sosial',
      description: 'Pelatihan konten kreatif untuk tim media sosial.',
      date: _formatDate(today.subtract(const Duration(days: 14))),
      time: '13:00 - 15:00 WIB',
      location: 'Studio Humas',
      picName: 'Budi Santoso',
      picInitials: 'BS',
      status: 'Dibatalkan',
      isHistory: true,
      scheduledAt: today.subtract(const Duration(days: 14)),
      checkInState: CheckInState.missed,
      checkInStatus: 'Check-in: Tidak Check-in',
      docStatus: 'Dokumentasi: Belum Unggah',
    ),
  ];
}

List<ContentPlanItem> buildSeedContentPlans() => [
      const ContentPlanItem(
        id: 'c1',
        title: 'Liputan Wisuda Polinela 2026',
        description:
            'Video highlight kegiatan wisuda. Fokus pada momen haru dan wawancara lulusan terbaik.',
        tags: ['Video', 'Reels'],
        status: ContentPlanStatus.sedangDikerjakan,
        deadline: 'Hari ini, 15:00',
        pic: 'Budi Santoso',
        deadlineLabel: 'Hari ini, 15:00',
        progress: 45,
      ),
      const ContentPlanItem(
        id: 'c2',
        title: 'Alur Penerimaan Mahasiswa Baru',
        description: 'Desain carousel 5 slide menjelaskan tahapan PMB jalur mandiri.',
        tags: ['Carousel', 'Infografis'],
        status: ContentPlanStatus.belumDikerjakan,
        deadline: 'Besok, 10:00',
        pic: 'Siti Aminah',
        deadlineLabel: 'Besok, 10:00',
        progress: 0,
      ),
      const ContentPlanItem(
        id: 'c3',
        title: 'Behind The Scenes Kunjungan Industri',
        description: 'Konten BTS untuk Instagram dan TikTok tim liputan.',
        tags: ['Reels', 'TikTok'],
        status: ContentPlanStatus.selesai,
        deadline: 'Selesai',
        pic: 'Dimas Rizky',
        deadlineLabel: 'Selesai',
        progress: 100,
        videoLink: 'https://youtube.com/watch?v=example',
      ),
      const ContentPlanItem(
        id: 'c4',
        title: 'Infografis Prestasi Polinela',
        description: 'Ringkasan capaian institusi triwulan terakhir.',
        tags: ['Infografis'],
        status: ContentPlanStatus.sedangDikerjakan,
        deadline: '3 hari lagi',
        pic: 'Anita Wijaya',
        deadlineLabel: '3 hari lagi',
        progress: 60,
      ),
    ];

List<AppNotification> buildSeedNotifications() => [
      AppNotification(
        id: 'n1',
        title: 'Kegiatan Baru',
        body: 'Ada kegiatan liputan kunjungan industri baru. Silakan cek detailnya.',
        time: '5 menit yang lalu',
        icon: Icons.event,
        color: const Color(0xFF3B82F6),
        type: NotificationType.kegiatanBaru,
        relatedEntityId: '1',
        relatedEntityType: 'activity',
        createdAt: DateTime.now().subtract(const Duration(minutes: 5)),
      ),
      AppNotification(
        id: 'n2',
        title: 'Reminder Deadline',
        body: 'Tenggat upload Reels Wisuda tinggal 3 jam lagi!',
        time: '1 jam yang lalu',
        icon: Icons.phone_in_talk,
        color: const Color(0xFFEF4444),
        type: NotificationType.deadlineReminder,
        relatedEntityId: 'c1',
        relatedEntityType: 'content_plan',
        createdAt: DateTime.now().subtract(const Duration(hours: 1)),
      ),
      AppNotification(
        id: 'n3',
        title: 'Content Plan Baru',
        body: 'Plan konten infografis prestasi telah ditambahkan oleh Koordinator.',
        time: '2 jam yang lalu',
        icon: Icons.description,
        color: const Color(0xFF8B5CF6),
        type: NotificationType.contentPlanBaru,
        relatedEntityId: 'c4',
        relatedEntityType: 'content_plan',
        createdAt: DateTime.now().subtract(const Duration(hours: 2)),
      ),
      AppNotification(
        id: 'n4',
        title: 'Status Verifikasi',
        body: "Konten 'Behind The Scenes' telah diverifikasi dan siap diunggah.",
        time: 'Kemarin, 14:30',
        icon: Icons.check_circle,
        color: const Color(0xFF22C55E),
        type: NotificationType.verifikasi,
        isUnread: false,
        group: 'Kemarin',
        relatedEntityId: 'c3',
        relatedEntityType: 'content_plan',
        createdAt: DateTime.now().subtract(const Duration(days: 1, hours: 9)),
      ),
      AppNotification(
        id: 'n5',
        title: 'Perubahan Jadwal',
        body: 'Jadwal Rapat Humas diundur ke pukul 14:00.',
        time: 'Kemarin, 09:15',
        icon: Icons.schedule,
        color: const Color(0xFFF59E0B),
        type: NotificationType.jadwalBerubah,
        isUnread: false,
        group: 'Kemarin',
        relatedEntityId: '2',
        relatedEntityType: 'activity',
        createdAt: DateTime.now().subtract(const Duration(days: 1, hours: 14)),
      ),
      AppNotification(
        id: 'n6',
        title: 'Reminder Check-in',
        body: 'Jangan lupa check-in kehadiran di lokasi kegiatan hari ini.',
        time: '2 hari yang lalu',
        icon: Icons.location_on,
        color: const Color(0xFF0D9488),
        type: NotificationType.checkInReminder,
        isUnread: false,
        group: 'Kemarin',
        relatedEntityId: '1',
        relatedEntityType: 'activity',
        createdAt: DateTime.now().subtract(const Duration(days: 2)),
      ),
    ];

List<TeamMember> buildSeedTeamMembers() => [
      TeamMember(
        id: 't1',
        name: 'Ahmad Faisal',
        division: 'Divisi Dokumentasi & Liputan',
        distance: '450m dari saya',
        location: 'Gedung Serba Guna (GSG) Politeknik Negeri Lampung',
        initials: 'AF',
        isOnDuty: true,
        latitude: -5.3578,
        longitude: 105.2318,
        lastUpdated: DateTime.now().subtract(const Duration(minutes: 15)),
        phone: '+6281234567890',
        completedTasks: 128,
        activityHistory: const [
          MemberActivityRecord(
            title: 'Liputan Wisuda Periode II',
            dateLocation: '24 Nov 2023 • GSG Polinela',
            status: 'Selesai',
          ),
          MemberActivityRecord(
            title: 'Dokumentasi Kunjungan Industri',
            dateLocation: '20 Nov 2023 • Lab Pertanian Terpadu',
            status: 'Selesai',
          ),
        ],
      ),
      TeamMember(
        id: 't2',
        name: 'Siti Aminah',
        division: 'Divisi Konten Digital',
        distance: '1.2km dari saya',
        location: 'Gedung Utama Direktorat Lt. 2',
        initials: 'SA',
        isOnDuty: true,
        latitude: -5.3595,
        longitude: 105.2340,
        lastUpdated: DateTime.now().subtract(const Duration(minutes: 2)),
        phone: '+6281987654321',
        completedTasks: 96,
        activityHistory: const [
          MemberActivityRecord(
            title: 'Desain Infografis PMB',
            dateLocation: '18 Nov 2023 • Studio Humas',
            status: 'Selesai',
          ),
        ],
      ),
      TeamMember(
        id: 't3',
        name: 'Dimas Rizky',
        division: 'Divisi Media Sosial',
        distance: '2.5km dari saya',
        location: 'Studio Humas',
        initials: 'DR',
        isOnDuty: false,
        latitude: -5.3610,
        longitude: 105.2280,
        lastUpdated: DateTime.now().subtract(const Duration(minutes: 15)),
        phone: '+6285678901234',
        completedTasks: 74,
        activityHistory: const [],
      ),
    ];

String _formatDate(DateTime date) {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ];
  return '${date.day} ${months[date.month - 1]} ${date.year}';
}

List<DutyScheduleItem> buildSeedDutySchedules() {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);

  return [
    DutyScheduleItem(
      id: '1',
      date: today.toIso8601String(),
      startTime: '08:00',
      endTime: '16:00',
      shiftName: 'Pagi',
      notes: 'Piket rutin dan melayani tamu Humas Polinela.',
      location: 'Kantor Humas',
      status: 'SEDANG_BERLANGSUNG',
    ),
    DutyScheduleItem(
      id: '2',
      date: today.add(const Duration(days: 2)).toIso8601String(),
      startTime: '13:00',
      endTime: '21:00',
      shiftName: 'Sore',
      notes: 'Piket sore dan monitoring sosial media Polinela.',
      location: 'Kantor Humas',
      status: 'AKAN_DATANG',
    ),
  ];
}