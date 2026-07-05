enum ContentPlanStatus {
  belumDikerjakan,
  sedangDikerjakan,
  menungguReview,
  perluRevisi,
  selesai,
  ditolak,
}

extension ContentPlanStatusLabel on ContentPlanStatus {
  String get label {
    switch (this) {
      case ContentPlanStatus.belumDikerjakan:
        return 'Belum Dikerjakan';
      case ContentPlanStatus.sedangDikerjakan:
        return 'Sedang Dikerjakan';
      case ContentPlanStatus.menungguReview:
        return 'Menunggu Review';
      case ContentPlanStatus.perluRevisi:
        return 'Perlu Revisi';
      case ContentPlanStatus.selesai:
        return 'Selesai';
      case ContentPlanStatus.ditolak:
        return 'Ditolak';
    }
  }

  static ContentPlanStatus fromApi(String? value) {
    switch (value) {
      case 'belumDikerjakan':
        return ContentPlanStatus.belumDikerjakan;
      case 'menungguReview':
        return ContentPlanStatus.menungguReview;
      case 'perluRevisi':
        return ContentPlanStatus.perluRevisi;
      case 'selesai':
        return ContentPlanStatus.selesai;
      case 'ditolak':
        return ContentPlanStatus.ditolak;
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
    this.videoLink,
    this.posterPath,
    this.videoFileName,
    this.revisionNote,
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
  final String? videoLink;
  final String? posterPath;
  final String? videoFileName;
  final String? revisionNote;
  final bool canSubmit;
  final bool submissionLocked;

  String get statusLabel => status.label;

  bool get hasSubmittedProof =>
      videoLink != null && videoLink!.isNotEmpty && submissionLocked;

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
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
        'canSubmit': canSubmit,
        'submissionLocked': submissionLocked,
      };

  factory ContentPlanItem.fromJson(Map<String, dynamic> json) => ContentPlanItem(
        id: json['id'] as String,
        title: json['title'] as String,
        description: json['description'] as String,
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
        canSubmit: json['canSubmit'] as bool? ?? true,
        submissionLocked: json['submissionLocked'] as bool? ?? false,
      );

  ContentPlanItem copyWith({
    ContentPlanStatus? status,
    int? progress,
    String? videoLink,
    String? posterPath,
    String? videoFileName,
    String? revisionNote,
    bool? canSubmit,
    bool? submissionLocked,
    bool clearPoster = false,
    bool clearVideo = false,
  }) =>
      ContentPlanItem(
        id: id,
        title: title,
        description: description,
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
        canSubmit: canSubmit ?? this.canSubmit,
        submissionLocked: submissionLocked ?? this.submissionLocked,
      );
}