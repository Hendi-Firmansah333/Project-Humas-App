import 'dart:convert';
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:poli_humas/models/content_plan.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/services/cloudinary_service.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/utils/validators.dart';

TextStyle _pj(
  double size,
  FontWeight w,
  Color color, {
  double? height,
  double? ls,
}) =>
    GoogleFonts.plusJakartaSans(
      fontSize: size,
      fontWeight: w,
      color: color,
      height: height,
      letterSpacing: ls,
    );

class ContentPlanDetailScreen extends StatefulWidget {
  const ContentPlanDetailScreen({super.key, required this.item});

  final ContentPlanItem item;

  @override
  State<ContentPlanDetailScreen> createState() =>
      _ContentPlanDetailScreenState();
}

class _ContentPlanDetailScreenState extends State<ContentPlanDetailScreen> {
  final _linkController = TextEditingController();
  late int _selectedTab;
  String? _posterPath;
  String? _videoFileName;
  String? _linkError;
  String? _posterError;
  bool _isSubmitting = false;

  bool get _canSubmit => widget.item.canSubmit;

  @override
  void initState() {
    super.initState();
    final hasVideoLink =
        widget.item.videoLink != null && widget.item.videoLink!.trim().isNotEmpty;
    final hasPoster =
        widget.item.posterPath != null && widget.item.posterPath!.trim().isNotEmpty;
    if (hasVideoLink) {
      _linkController.text = widget.item.videoLink!;
    }
    _posterPath = widget.item.posterPath;
    _videoFileName = widget.item.videoFileName;
    _selectedTab = (hasVideoLink && !hasPoster) ? 1 : 0;
  }

  @override
  void dispose() {
    _linkController.dispose();
    super.dispose();
  }

  Future<void> _pickPoster() async {
    if (!_canSubmit || _isSubmitting) return;
    HapticFeedback.selectionClick();
    final result = await FilePicker.platform.pickFiles(
      type: FileType.image,
      allowMultiple: false,
    );
    if (result == null || result.files.isEmpty) return;
    final file = result.files.single;
    setState(() {
      _posterPath = file.path;
      _posterError = null;
    });
  }

  Future<String?> _posterPayload() async {
    if (_posterPath == null) return null;
    final value = _posterPath!.trim();
    if (value.isEmpty) return null;
    if (value.startsWith('http://') ||
        value.startsWith('https://') ||
        value.startsWith('data:')) {
      return value;
    }
    if (kIsWeb) return value;
    final uploaded = await CloudinaryService.uploadImage(value);
    if (uploaded != null && uploaded.isNotEmpty) {
      _posterPath = uploaded;
    }
    return uploaded;
  }

  String _normalizeUrl(String raw) {
    final trimmed = raw.trim();
    if (trimmed.isEmpty) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return 'https://$trimmed';
  }

  Future<void> _openExternalUrl(String rawUrl) async {
    final normalized = _normalizeUrl(rawUrl);
    if (normalized.isEmpty) return;
    final messenger = ScaffoldMessenger.of(context);
    final uri = Uri.tryParse(normalized);
    if (uri == null) {
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Link bahan mentahan tidak valid.'),
          backgroundColor: AppColors.danger,
        ),
      );
      return;
    }
    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched && mounted) {
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Tidak dapat membuka link bahan mentahan.'),
          backgroundColor: AppColors.danger,
        ),
      );
    }
  }

  Future<void> _submitReview() async {
    if (!_canSubmit || _isSubmitting) return;

    final hasPoster = _posterPath != null && _posterPath!.trim().isNotEmpty;
    final normalizedLink = _normalizeUrl(_linkController.text);

    if (_selectedTab == 1 || !hasPoster) {
      if (_selectedTab == 0 && !hasPoster && normalizedLink.isEmpty) {
        setState(() {
          _posterError = 'Unggah gambar poster/thumbnail terlebih dahulu.';
        });
        return;
      }
      final validation = validateDriveOrVideoUrl(normalizedLink);
      if (!validation.isValid) {
        setState(() {
          _linkError = validation.message;
          if (_selectedTab == 0) _selectedTab = 1;
        });
        return;
      }
    }

    setState(() {
      _linkError = null;
      _posterError = null;
      _isSubmitting = true;
    });

    final provider = context.read<AppDataProvider>();
    final messenger = ScaffoldMessenger.of(context);
    final nav = Navigator.of(context);
    final resolvedCaption = (widget.item.caption?.trim().isNotEmpty ?? false)
        ? widget.item.caption!.trim()
        : (widget.item.description.trim().isNotEmpty
            ? widget.item.description.trim()
            : widget.item.title);

    try {
      final poster = await _posterPayload();
      final finalLink = normalizedLink.isNotEmpty
          ? normalizedLink
          : (poster ?? 'https://drive.google.com/file/poster');

      await provider.submitContentProof(
        contentPlanId: widget.item.id,
        videoLink: finalLink,
        caption: resolvedCaption,
        posterPath: poster,
        videoFileName: _videoFileName,
        sendToReview: true,
      );
      if (!mounted) return;
      messenger.showSnackBar(
        const SnackBar(
          content: Text(
            'Hasil konten berhasil dikirim! Menunggu persetujuan Kepala Humas.',
          ),
          backgroundColor: AppColors.success,
        ),
      );
      nav.pop();
    } catch (e) {
      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: AppColors.danger,
        ),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Widget? _buildPosterPreview() {
    final path = _posterPath;
    if (path == null || path.isEmpty) return null;

    if (path.startsWith('data:image/')) {
      try {
        final base64Data = path.split(',').last;
        final bytes = base64Decode(base64Data);
        return Image.memory(
          bytes,
          height: 180,
          width: double.infinity,
          fit: BoxFit.cover,
        );
      } catch (_) {
        return null;
      }
    }

    if (path.startsWith('http://') || path.startsWith('https://')) {
      return Image.network(
        path,
        height: 180,
        width: double.infinity,
        fit: BoxFit.cover,
      );
    }

    if (!kIsWeb && File(path).existsSync()) {
      return Image.file(
        File(path),
        height: 180,
        width: double.infinity,
        fit: BoxFit.cover,
      );
    }

    return null;
  }

  (Color, Color, String) _resolveStatusStyle(ContentPlanStatus status) {
    switch (status) {
      case ContentPlanStatus.sedangDikerjakan:
        return (
          const Color(0xFFD9F5EC),
          const Color(0xFF0A6B53),
          '● Sedang Dikerjakan',
        );
      case ContentPlanStatus.selesai:
      case ContentPlanStatus.disetujui:
        return (
          const Color(0xFFD9F5EC),
          const Color(0xFF0A6B53),
          '● Selesai',
        );
      case ContentPlanStatus.menungguVerifikasiAdmin:
      case ContentPlanStatus.menungguPersetujuanKepalaHumas:
        return (
          const Color(0xFFE0E7FF),
          const Color(0xFF3730A3),
          '● Menunggu Review',
        );
      case ContentPlanStatus.perluRevisi:
        return (
          const Color(0xFFFFF7ED),
          const Color(0xFFC2410C),
          '● Perlu Revisi',
        );
      case ContentPlanStatus.ditolak:
        return (
          const Color(0xFFFEE2E2),
          const Color(0xFF991B1B),
          '● Ditolak',
        );
      case ContentPlanStatus.belumDikerjakan:
        return (
          const Color(0xFFEEF2F7),
          const Color(0xFF3F5167),
          '● Belum Dikerjakan',
        );
    }
  }

  String _resolveInitials(String name) {
    final words = name.trim().split(RegExp(r'\s+'));
    if (words.isEmpty || words.first.isEmpty) return '?';
    if (words.length == 1) return words.first.substring(0, 1).toUpperCase();
    return '${words[0][0]}${words[1][0]}'.toUpperCase();
  }

  Widget _buildLockBanner(bool isDark) {
    final item = widget.item;
    String message;
    Color color;
    IconData icon;

    switch (item.status) {
      case ContentPlanStatus.selesai:
        message = 'Konten sudah selesai dan dipublikasikan.';
        color = AppColors.success;
        icon = Icons.verified_outlined;
        break;
      case ContentPlanStatus.disetujui:
        message =
            'Konten sudah disetujui Kepala Humas. Menunggu jadwal tayang.';
        color = AppColors.success;
        icon = Icons.check_circle_outline;
        break;
      case ContentPlanStatus.menungguPersetujuanKepalaHumas:
        message =
            'Hasil konten telah dikirim. Menunggu persetujuan Kepala Humas.';
        color = const Color(0xFF7C3AED);
        icon = Icons.hourglass_top_outlined;
        break;
      case ContentPlanStatus.menungguVerifikasiAdmin:
        message =
            'Hasil konten telah dikirim. Menunggu persetujuan Kepala Humas.';
        color = AppColors.warning;
        icon = Icons.hourglass_top_outlined;
        break;
      case ContentPlanStatus.ditolak:
        message = 'Konten dibatalkan.';
        color = AppColors.danger;
        icon = Icons.block_outlined;
        break;
      case ContentPlanStatus.perluRevisi:
        message =
            'Terdapat catatan revisi. Silakan perbaiki dan kirim ulang bukti.';
        color = AppColors.warning;
        icon = Icons.edit_note_outlined;
        break;
      default:
        return const SizedBox.shrink();
    }

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: isDark ? 0.16 : 0.1),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: _pj(13, FontWeight.w600, color),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark;
    final item = widget.item;
    final posterPreview = _buildPosterPreview();
    final (statusBg, statusText, statusLabel) = _resolveStatusStyle(item.status);

    const platformDisplayMap = {
      'instagram': 'Instagram',
      'tiktok': 'TikTok',
      'youtube': 'YouTube',
      'website': 'Website',
      'facebook': 'Facebook',
      'twitter': 'X (Twitter)',
      'x': 'X (Twitter)',
      'linkedin': 'LinkedIn',
    };
    final platformTags = <String>[];
    final typeTags = <String>[];
    for (final rawTag in item.tags) {
      for (final part in rawTag.split(RegExp(r'[,/|]+'))) {
        final cleaned = part.trim();
        if (cleaned.isEmpty) continue;
        final canonicalPlatform = platformDisplayMap[cleaned.toLowerCase()];
        if (canonicalPlatform != null) {
          if (!platformTags.contains(canonicalPlatform)) {
            platformTags.add(canonicalPlatform);
          }
        } else if (!typeTags.contains(cleaned)) {
          typeTags.add(cleaned);
        }
      }
    }
    final visibleTypeTags =
        (typeTags.isNotEmpty ? typeTags : item.tags).take(2).toList();
    final visiblePlatforms =
        platformTags.isNotEmpty ? platformTags : const ['Instagram'];

    final deadlineText = item.deadlineLabel.trim().isNotEmpty
        ? item.deadlineLabel.trim()
        : item.deadline.trim();
    final picName = item.pic.trim().isNotEmpty ? item.pic.trim() : '-';
    final picInitials = _resolveInitials(picName);

    final bgColor =
        isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final cardColor = isDark ? const Color(0xFF1E293B) : Colors.white;
    final titleColor = isDark ? Colors.white : const Color(0xFF0F1F33);
    final mutedColor = isDark ? Colors.white70 : const Color(0xFF5A6B7F);
    final bodyColor = isDark ? Colors.white70 : const Color(0xFF4A5B70);

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Column(
          children: [
            // ── CUSTOM TOP HEADER (Figma 5387:2125) ──
            Padding(
              padding: const EdgeInsets.fromLTRB(25, 12, 25, 14),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: cardColor,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF0F1F33).withValues(
                            alpha: isDark ? 0.25 : 0.08,
                          ),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Material(
                      color: Colors.transparent,
                      shape: const CircleBorder(),
                      child: InkWell(
                        customBorder: const CircleBorder(),
                        onTap: () => Navigator.pop(context),
                        child: Icon(
                          Icons.arrow_back_rounded,
                          size: 20,
                          color: titleColor,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Detail Content Plan',
                          style: _pj(18, FontWeight.w800, titleColor),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Informasi konten & bukti penyelesaian',
                          style: _pj(12, FontWeight.w500, mutedColor),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // ── SCROLLABLE BODY ──
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(25, 0, 25, 28),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── CARD 1: CONTENT INFO CARD (Figma 5387:1699) ──
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: cardColor,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF0F1F33).withValues(
                              alpha: isDark ? 0.28 : 0.06,
                            ),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Row 1: Type Tags & Status Badge
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Wrap(
                                  spacing: 6,
                                  runSpacing: 6,
                                  children: [
                                    for (int i = 0;
                                        i < visibleTypeTags.length;
                                        i++)
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 10,
                                          vertical: 5,
                                        ),
                                        decoration: BoxDecoration(
                                          color: i == 0
                                              ? (isDark
                                                  ? const Color(0xFF133835)
                                                  : const Color(0xFFD9F5EC))
                                              : (isDark
                                                  ? Colors.white10
                                                  : const Color(0xFFEEF2F7)),
                                          borderRadius:
                                              BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          visibleTypeTags[i],
                                          style: _pj(
                                            12,
                                            FontWeight.w700,
                                            i == 0
                                                ? (isDark
                                                    ? const Color(0xFF2EE6C8)
                                                    : const Color(0xFF0A6B53))
                                                : (isDark
                                                    ? Colors.white70
                                                    : const Color(0xFF3F5167)),
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 5,
                                ),
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? statusText.withValues(alpha: 0.2)
                                      : statusBg,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  statusLabel,
                                  style: _pj(
                                    12,
                                    FontWeight.w700,
                                    isDark ? Colors.white : statusText,
                                  ),
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 12),

                          // Row 2: Title
                          Text(
                            item.title,
                            style: _pj(
                              22,
                              FontWeight.w800,
                              titleColor,
                              height: 1.25,
                            ),
                          ),

                          const SizedBox(height: 8),

                          // Row 3: Description
                          Text(
                            item.description.trim().isNotEmpty
                                ? item.description.trim()
                                : 'Tidak ada deskripsi atau brief tambahan.',
                            style: _pj(
                              13,
                              FontWeight.w500,
                              bodyColor,
                              height: 1.5,
                            ),
                          ),

                          const SizedBox(height: 12),

                          // Row 4: Platform Chips
                          Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: visiblePlatforms
                                .map(
                                  (platform) => Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 5,
                                    ),
                                    decoration: BoxDecoration(
                                      color: isDark
                                          ? const Color(0xFF1E3A5F)
                                          : const Color(0xFFE6F1FB),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      platform,
                                      style: _pj(
                                        12,
                                        FontWeight.w700,
                                        isDark
                                            ? const Color(0xFF93C5FD)
                                            : const Color(0xFF1B4F7A),
                                      ),
                                    ),
                                  ),
                                )
                                .toList(),
                          ),

                          const SizedBox(height: 12),

                          // Row 5: Tenggat Box
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 13,
                              vertical: 11,
                            ),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? const Color(0xFF3B1518)
                                  : const Color(0xFFFDE8E8),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isDark
                                    ? const Color(0xFF7F1D1D)
                                    : const Color(0xFFF8C9C9),
                                width: 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                Text(
                                  'Tenggat',
                                  style: _pj(
                                    13,
                                    FontWeight.w500,
                                    isDark
                                        ? const Color(0xFFFECACA)
                                        : const Color(0xFF5A6B7F),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    deadlineText,
                                    style: _pj(
                                      13,
                                      FontWeight.w700,
                                      isDark
                                          ? const Color(0xFFFCA5A5)
                                          : const Color(0xFFB42318),
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 14),

                          // Row 6: PIC Row
                          Row(
                            children: [
                              Container(
                                width: 36,
                                height: 36,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF1FA6C9),
                                  shape: BoxShape.circle,
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  picInitials,
                                  style: _pj(
                                    12,
                                    FontWeight.w800,
                                    const Color(0xFF06222E),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                'PIC:',
                                style: _pj(13, FontWeight.w500, mutedColor),
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  picName,
                                  style: _pj(13, FontWeight.w700, titleColor),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),

                          // Link Bahan Mentahan
                          if (item.rawMaterialUrl != null &&
                              item.rawMaterialUrl!.trim().isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isDark
                                    ? const Color(0xFF3A2A0A)
                                    : const Color(0xFFFFFBEB),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isDark
                                      ? const Color(0xFFB45309)
                                      : const Color(0xFFFDE68A),
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.folder_open_outlined,
                                    size: 18,
                                    color: isDark
                                        ? const Color(0xFFFBBF24)
                                        : const Color(0xFFB45309),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Link Bahan Mentahan',
                                          style: _pj(
                                            12,
                                            FontWeight.w700,
                                            isDark
                                                ? const Color(0xFFFDE68A)
                                                : const Color(0xFF92400E),
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          item.rawMaterialUrl!.trim(),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: _pj(
                                            12,
                                            FontWeight.w400,
                                            isDark
                                                ? const Color(0xFFFCD34D)
                                                : const Color(0xFFB45309),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  TextButton(
                                    onPressed: () =>
                                        _openExternalUrl(item.rawMaterialUrl!),
                                    style: TextButton.styleFrom(
                                      backgroundColor: const Color(0xFFD97706),
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 12,
                                        vertical: 6,
                                      ),
                                      minimumSize: Size.zero,
                                      tapTargetSize:
                                          MaterialTapTargetSize.shrinkWrap,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                    ),
                                    child: Text(
                                      'Buka',
                                      style: _pj(12, FontWeight.w700, Colors.white),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],

                          // Catatan Verifikasi Admin
                          if (item.adminNotes != null &&
                              item.adminNotes!.trim().isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isDark
                                    ? const Color(0xFF0F2942)
                                    : const Color(0xFFF0F9FF),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isDark
                                      ? const Color(0xFF0369A1)
                                      : const Color(0xFFBAE6FD),
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(
                                        Icons.check_circle_outline,
                                        size: 16,
                                        color: Color(0xFF0284C7),
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        'Catatan Verifikasi Admin Humas',
                                        style: _pj(
                                          12.5,
                                          FontWeight.w700,
                                          isDark
                                              ? const Color(0xFF7DD3FC)
                                              : const Color(0xFF0369A1),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    item.adminNotes!.trim(),
                                    style: _pj(
                                      13,
                                      FontWeight.w400,
                                      isDark
                                          ? Colors.white70
                                          : const Color(0xFF0369A1),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],

                          // Catatan Revisi
                          if (item.revisionNote != null &&
                              item.revisionNote!.trim().isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isDark
                                    ? const Color(0xFF3A1F0D)
                                    : const Color(0xFFFFF7ED),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isDark
                                      ? const Color(0xFFEA580C)
                                      : const Color(0xFFFDBA74),
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(
                                        Icons.replay_outlined,
                                        size: 16,
                                        color: Color(0xFFEA580C),
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        'Catatan Revisi / Perbaikan',
                                        style: _pj(
                                          12.5,
                                          FontWeight.w700,
                                          isDark
                                              ? const Color(0xFFFDBA74)
                                              : const Color(0xFF9A3412),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    item.revisionNote!.trim(),
                                    style: _pj(
                                      13,
                                      FontWeight.w400,
                                      isDark
                                          ? Colors.white70
                                          : const Color(0xFF9A3412),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),

                    _buildLockBanner(isDark),

                    const SizedBox(height: 16),

                    // ── CARD 2: BUKTI PENYELESAIAN CARD (Figma 5387:1727 / 5387:1813) ──
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: cardColor,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF0F1F33).withValues(
                              alpha: isDark ? 0.28 : 0.06,
                            ),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Header Row
                          Row(
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? const Color(0xFF133835)
                                      : const Color(0xFFD9F5EC),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                alignment: Alignment.center,
                                child: Icon(
                                  Icons.file_upload_outlined,
                                  size: 20,
                                  color: isDark
                                      ? const Color(0xFF2EE6C8)
                                      : const Color(0xFF0A6B53),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Bukti Penyelesaian',
                                      style: _pj(
                                        15,
                                        FontWeight.w800,
                                        titleColor,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      'Pilih salah satu: gambar atau link video.',
                                      style: _pj(12, FontWeight.w500, mutedColor),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 12),

                          // 2-Tab Segmented Switcher (Figma 5387:1737)
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? const Color(0xFF0F172A)
                                  : const Color(0xFFE8EEF5),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: _SegmentTabButton(
                                    label: 'Unggah Gambar',
                                    icon: Icons.image_outlined,
                                    selected: _selectedTab == 0,
                                    isDark: isDark,
                                    onTap: () {
                                      HapticFeedback.selectionClick();
                                      setState(() => _selectedTab = 0);
                                    },
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: _SegmentTabButton(
                                    label: 'Link Video',
                                    icon: Icons.link_rounded,
                                    selected: _selectedTab == 1,
                                    isDark: isDark,
                                    onTap: () {
                                      HapticFeedback.selectionClick();
                                      setState(() => _selectedTab = 1);
                                    },
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 14),

                          // ── TAB 0: UNGGAH GAMBAR (Figma 5387:1859) ──
                          if (_selectedTab == 0) ...[
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Poster / Thumbnail',
                                  style: _pj(13, FontWeight.w700, titleColor),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 5,
                                  ),
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? const Color(0xFF133835)
                                        : const Color(0xFFD9F5EC),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    'Wajib',
                                    style: _pj(
                                      12,
                                      FontWeight.w700,
                                      isDark
                                          ? const Color(0xFF2EE6C8)
                                          : const Color(0xFF0A6B53),
                                    ),
                                  ),
                                ),
                              ],
                            ),

                            const SizedBox(height: 12),

                            GestureDetector(
                              onTap: _canSubmit && !_isSubmitting
                                  ? _pickPoster
                                  : null,
                              child: CustomPaint(
                                painter: _DashedRRectBorderPainter(
                                  color: _posterError != null
                                      ? AppColors.danger
                                      : (isDark
                                          ? Colors.white24
                                          : const Color(0xFF9DB2C8)),
                                  radius: 16,
                                ),
                                child: Container(
                                  width: double.infinity,
                                  height: posterPreview != null ? 180 : 135,
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? const Color(0xFF0F172A)
                                        : const Color(0xFFF5F9FD),
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: posterPreview != null
                                      ? ClipRRect(
                                          borderRadius:
                                              BorderRadius.circular(16),
                                          child: Stack(
                                            fit: StackFit.expand,
                                            children: [
                                              posterPreview,
                                              if (_canSubmit)
                                                Positioned(
                                                  right: 10,
                                                  bottom: 10,
                                                  child: Container(
                                                    padding: const EdgeInsets
                                                        .symmetric(
                                                      horizontal: 10,
                                                      vertical: 6,
                                                    ),
                                                    decoration: BoxDecoration(
                                                      color: Colors.black
                                                          .withValues(
                                                        alpha: 0.65,
                                                      ),
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                        10,
                                                      ),
                                                    ),
                                                    child: Row(
                                                      mainAxisSize:
                                                          MainAxisSize.min,
                                                      children: [
                                                        const Icon(
                                                          Icons.edit_outlined,
                                                          size: 14,
                                                          color: Colors.white,
                                                        ),
                                                        const SizedBox(
                                                          width: 4,
                                                        ),
                                                        Text(
                                                          'Ganti Gambar',
                                                          style: _pj(
                                                            11,
                                                            FontWeight.w700,
                                                            Colors.white,
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ),
                                            ],
                                          ),
                                        )
                                      : Padding(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 16,
                                          ),
                                          child: Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.center,
                                            children: [
                                              Container(
                                                width: 48,
                                                height: 48,
                                                decoration: BoxDecoration(
                                                  color: isDark
                                                      ? const Color(0xFF133835)
                                                      : const Color(0xFFD9F5EC),
                                                  shape: BoxShape.circle,
                                                ),
                                                alignment: Alignment.center,
                                                child: Icon(
                                                  Icons.image_outlined,
                                                  size: 20,
                                                  color: isDark
                                                      ? const Color(0xFF2EE6C8)
                                                      : const Color(0xFF0A6B53),
                                                ),
                                              ),
                                              const SizedBox(width: 12),
                                              Flexible(
                                                child: Column(
                                                  mainAxisSize:
                                                      MainAxisSize.min,
                                                  crossAxisAlignment:
                                                      CrossAxisAlignment.start,
                                                  children: [
                                                    Text(
                                                      'Ketuk untuk mengunggah',
                                                      style: _pj(
                                                        14,
                                                        FontWeight.w700,
                                                        titleColor,
                                                      ),
                                                    ),
                                                    const SizedBox(height: 2),
                                                    Text(
                                                      'JPG atau PNG, maksimal 5 MB',
                                                      style: _pj(
                                                        12,
                                                        FontWeight.w500,
                                                        mutedColor,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                ),
                              ),
                            ),

                            if (_posterError != null) ...[
                              const SizedBox(height: 8),
                              Text(
                                _posterError!,
                                style: _pj(
                                  12,
                                  FontWeight.w600,
                                  AppColors.danger,
                                ),
                              ),
                            ],

                            const SizedBox(height: 12),

                            _InfoCalloutBox(
                              text:
                                  'Untuk konten video, pilih tab Link Video dan tempel tautan YouTube atau Drive.',
                              isDark: isDark,
                            ),
                          ]
                          // ── TAB 1: LINK VIDEO (Figma 5387:1860) ──
                          else ...[
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Link Video (YouTube/Drive)',
                                  style: _pj(13, FontWeight.w700, titleColor),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 5,
                                  ),
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? const Color(0xFF133835)
                                        : const Color(0xFFD9F5EC),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    'Wajib',
                                    style: _pj(
                                      12,
                                      FontWeight.w700,
                                      isDark
                                          ? const Color(0xFF2EE6C8)
                                          : const Color(0xFF0A6B53),
                                    ),
                                  ),
                                ),
                              ],
                            ),

                            const SizedBox(height: 12),

                            TextField(
                              controller: _linkController,
                              enabled: _canSubmit && !_isSubmitting,
                              readOnly: !_canSubmit,
                              style: _pj(13, FontWeight.w500, titleColor),
                              onChanged: (_) {
                                if (_linkError != null) {
                                  setState(() => _linkError = null);
                                }
                              },
                              decoration: InputDecoration(
                                hintText:
                                    'youtube.com/... atau drive.google.com/...',
                                hintStyle: _pj(
                                  13,
                                  FontWeight.w500,
                                  const Color(0xFF757575),
                                ),
                                prefixIcon: const Icon(
                                  Icons.link_rounded,
                                  size: 18,
                                  color: Color(0xFF5A6B7F),
                                ),
                                filled: true,
                                fillColor: _canSubmit
                                    ? (isDark
                                        ? const Color(0xFF0F172A)
                                        : const Color(0xFFF5F9FD))
                                    : (isDark
                                        ? Colors.white10
                                        : const Color(0xFFF3F4F6)),
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 16,
                                ),
                                errorText: _linkError,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(14),
                                  borderSide: BorderSide(
                                    color: isDark
                                        ? Colors.white12
                                        : const Color(0xFFC9D5E2),
                                    width: 1,
                                  ),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(14),
                                  borderSide: BorderSide(
                                    color: isDark
                                        ? Colors.white12
                                        : const Color(0xFFC9D5E2),
                                    width: 1,
                                  ),
                                ),
                                disabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(14),
                                  borderSide: BorderSide(
                                    color: isDark
                                        ? Colors.white10
                                        : const Color(0xFFE2E8F0),
                                    width: 1,
                                  ),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(14),
                                  borderSide: const BorderSide(
                                    color: Color(0xFF0B3A4F),
                                    width: 1.5,
                                  ),
                                ),
                              ),
                            ),

                            const SizedBox(height: 12),

                            _InfoCalloutBox(
                              text:
                                  'Video tidak diunggah langsung agar penyimpanan server tetap ringan.',
                              isDark: isDark,
                            ),
                          ],
                        ],
                      ),
                    ),

                    if (_canSubmit) ...[
                      const SizedBox(height: 18),

                      // ── SUBMIT BUTTON: KIRIM BUKTI (Figma 5387:1771) ──
                      SizedBox(
                        width: double.infinity,
                        height: 60,
                        child: ElevatedButton(
                          onPressed: _isSubmitting ? null : _submitReview,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            disabledBackgroundColor:
                                AppColors.primary.withValues(alpha: 0.6),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(18),
                            ),
                          ),
                          child: _isSubmitting
                              ? const SizedBox(
                                  width: 22,
                                  height: 22,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2.5,
                                    color: Colors.white,
                                  ),
                                )
                              : Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(
                                      Icons.send_outlined,
                                      size: 18,
                                      color: Colors.white,
                                    ),
                                    const SizedBox(width: 10),
                                    Text(
                                      'Kirim Bukti',
                                      style: _pj(
                                        15,
                                        FontWeight.w800,
                                        Colors.white,
                                      ),
                                    ),
                                  ],
                                ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SegmentTabButton extends StatelessWidget {
  const _SegmentTabButton({
    required this.label,
    required this.icon,
    required this.selected,
    required this.isDark,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final bool isDark;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final fgColor = selected
        ? Colors.white
        : (isDark ? Colors.white70 : const Color(0xFF3F5167));

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        constraints: const BoxConstraints(minHeight: 44),
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 11),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFF0B3A4F) : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 18, color: fgColor),
            const SizedBox(width: 8),
            Flexible(
              child: Text(
                label,
                style: _pj(13, FontWeight.w700, fgColor),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoCalloutBox extends StatelessWidget {
  const _InfoCalloutBox({
    required this.text,
    required this.isDark,
  });

  final String text;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final textColor =
        isDark ? const Color(0xFF93C5FD) : const Color(0xFF1B4F7A);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark
            ? const Color(0xFF1E3A5F).withValues(alpha: 0.45)
            : const Color(0xFFE6F1FB),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 1),
            child: Icon(
              Icons.info_outline_rounded,
              size: 16,
              color: textColor,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: _pj(12, FontWeight.w500, textColor, height: 1.5),
            ),
          ),
        ],
      ),
    );
  }
}

class _DashedRRectBorderPainter extends CustomPainter {
  const _DashedRRectBorderPainter({
    required this.color,
    required this.radius,
  });

  final Color color;
  final double radius;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4;

    final rrect = RRect.fromRectAndRadius(
      Offset.zero & size,
      Radius.circular(radius),
    );
    final path = Path()..addRRect(rrect);

    const dashLength = 6.0;
    const dashSpace = 4.0;
    for (final metric in path.computeMetrics()) {
      double distance = 0;
      while (distance < metric.length) {
        final next = (distance + dashLength).clamp(0.0, metric.length);
        canvas.drawPath(metric.extractPath(distance, next), paint);
        distance += dashLength + dashSpace;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _DashedRRectBorderPainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.radius != radius;
}
