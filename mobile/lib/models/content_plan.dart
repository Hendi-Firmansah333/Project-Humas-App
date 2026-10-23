enum ContentPlanStatus {
  belumDikerjakan,
  sedangDikerjakan,
  menungguVerifikasiAdmin,
  menungguPersetujuanKepalaHumas,
  disetujui,
  perluRevisi,
  selesai,
  ditolak,
}

extension ContentPlanStatusLabel on ContentPlanStatus {
  String get label {
    switch (this) {
      case ContentPlanStatus.belumDikerjakan:
        return 'Ditugaskan';
      case ContentPlanStatus.sedangDikerjakan:
        return 'Sedang Dikerjakan';
      case ContentPlanStatus.menungguVerifikasiAdmin:
        return 'Menunggu Verifikasi Admin';
      case ContentPlanStatus.menungguPersetujuanKepalaHumas:
        return 'Menunggu Persetujuan';
      case ContentPlanStatus.disetujui:
        return 'Disetujui';
      case ContentPlanStatus.perluRevisi:
        return 'Perlu Revisi';
      case ContentPlanStatus.selesai:
        return 'Sudah Tayang';
      case ContentPlanStatus.ditolak:
        return 'Dibatalkan';
    }
  }

  static ContentPlanStatus fromApi(String? value) {
    switch (value) {
      case 'belumDikerjakan':
      case 'ditugaskan':
        return ContentPlanStatus.belumDikerjakan;
      case 'menungguVerifikasiAdmin':
      case 'menungguReview':
        return ContentPlanStatus.menungguVerifikasiAdmin;
      case 'menungguPersetujuanKepalaHumas':
        return ContentPlanStatus.menungguPersetujuanKepalaHumas;
      case 'disetujui':
        return ContentPlanStatus.disetujui;
      case 'perluRevisi':
        return ContentPlanStatus.perluRevisi;
      case 'selesai':
      case 'published':
        return ContentPlanStatus.selesai;
      case 'ditolak':
      case 'dibatalkan':
        return ContentPlanStatus.ditolak;
      case 'sedangDikerjakan':
      default:
        return ContentPlanStatus.sedangDikerjakan;
    }
  }
}

class ContentPlanItem {
  const ContentPlanItem({
    required this.id,
    required this.title,
    required this.description,
    required this.tags,
    required this.status,
    required this.deadline,
    required this.pic,
    required this.deadlineLabel,
    this.progress = 0,
    this.caption,
    this.videoLink,
    this.posterPath,
    this.videoFileName,
    this.revisionNote,
    this.adminNotes,
    this.canSubmit = true,
    this.submissionLocked = false,
  });

  final String id;
  final String title;
  final String description;
  final List<String> tags;
  final ContentPlanStatus status;
  final String deadline;
  final String pic;
  final String deadlineLabel;
  final int progress;
  final String? caption;
  final String? videoLink;
  final String? posterPath;
  final String? videoFileName;
  final String? revisionNote;
  final String? adminNotes;
  final bool canSubmit;
  final bool submissionLocked;

  String get statusLabel => status.label;

  bool matchesFilter(String filter) {
    if (filter == 'Semua') return true;
    if (filter == 'Belum Dikerjakan') {
      return status == ContentPlanStatus.belumDikerjakan;
    }
    if (filter == 'Sedang Dikerjakan') {
      return status == ContentPlanStatus.sedangDikerjakan ||
          status == ContentPlanStatus.menungguVerifikasiAdmin ||
          status == ContentPlanStatus.menungguPersetujuanKepalaHumas ||
          status == ContentPlanStatus.perluRevisi;
    }
    if (filter == 'Selesai') {
      return status == ContentPlanStatus.disetujui ||
          status == ContentPlanStatus.selesai;
    }
    return statusLabel.toLowerCase() == filter.toLowerCase();
  }

  bool get hasSubmittedProof =>
      videoLink != null && videoLink!.isNotEmpty && submissionLocked;

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'caption': caption,
        'tags': tags,
        'status': status.name,
        'deadline': deadline,
        'pic': pic,
        'deadlineLabel': deadlineLabel,
        'progress': progress,
        'videoLink': videoLink,
        'posterPath': posterPath,
        'videoFileName': videoFileName,
        'revisionNote': revisionNote,
        'adminNotes': adminNotes,
        'canSubmit': canSubmit,
        'submissionLocked': submissionLocked,
      };

  factory ContentPlanItem.fromJson(Map<String, dynamic> json) => ContentPlanItem(
        id: json['id'] as String,
        title: json['title'] as String,
        description: json['description'] as String,
        caption: (json['caption'] as String?) ?? (json['description'] as String?),
        tags: (json['tags'] as List<dynamic>).cast<String>(),
        status: ContentPlanStatusLabel.fromApi(json['status'] as String?),
        deadline: json['deadline'] as String,
        pic: json['pic'] as String,
        deadlineLabel: json['deadlineLabel'] as String,
        progress: json['progress'] as int? ?? 0,
        videoLink: json['videoLink'] as String?,
        posterPath: json['posterPath'] as String?,
        videoFileName: json['videoFileName'] as String?,
        revisionNote: json['revisionNote'] as String?,
        adminNotes: json['adminNotes'] as String?,
        canSubmit: json['canSubmit'] as bool? ?? true,
        submissionLocked: json['submissionLocked'] as bool? ?? false,
      );

  ContentPlanItem copyWith({
    ContentPlanStatus? status,
    int? progress,
    String? caption,
    String? videoLink,
    String? posterPath,
    String? videoFileName,
    String? revisionNote,
    String? adminNotes,
    bool? canSubmit,
    bool? submissionLocked,
    bool clearPoster = false,
    bool clearVideo = false,
  }) =>
      ContentPlanItem(
        id: id,
        title: title,
        description: description,
        caption: caption ?? this.caption,
        tags: tags,
        status: status ?? this.status,
        deadline: deadline,
        pic: pic,
        deadlineLabel: deadlineLabel,
        progress: progress ?? this.progress,
        videoLink: clearVideo ? null : (videoLink ?? this.videoLink),
        posterPath: clearPoster ? null : (posterPath ?? this.posterPath),
        videoFileName: clearVideo ? null : (videoFileName ?? this.videoFileName),
        revisionNote: revisionNote ?? this.revisionNote,
        adminNotes: adminNotes ?? this.adminNotes,
        canSubmit: canSubmit ?? this.canSubmit,
        submissionLocked: submissionLocked ?? this.submissionLocked,
      );
}