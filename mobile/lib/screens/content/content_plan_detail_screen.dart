import 'dart:convert';
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:poli_humas/models/content_plan.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/services/cloudinary_service.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/utils/validators.dart';
import 'package:poli_humas/widgets/common_widgets.dart';

class ContentPlanDetailScreen extends StatefulWidget {
  const ContentPlanDetailScreen({super.key, required this.item});

  final ContentPlanItem item;

  @override
  State<ContentPlanDetailScreen> createState() => _ContentPlanDetailScreenState();
}

class _ContentPlanDetailScreenState extends State<ContentPlanDetailScreen> {
  final _linkController = TextEditingController();
  final _captionController = TextEditingController();
  String? _posterPath;
  String? _videoFileName;
  String? _linkError;
  String? _captionError;
  bool _isSubmitting = false;

  bool get _canSubmit => widget.item.canSubmit;

  @override
  void initState() {
    super.initState();
    if (widget.item.videoLink != null) {
      _linkController.text = widget.item.videoLink!;
    }
    _captionController.text = widget.item.caption ?? widget.item.description;
    _posterPath = widget.item.posterPath;
    _videoFileName = widget.item.videoFileName;
  }

  @override
  void dispose() {
    _linkController.dispose();
    _captionController.dispose();
    super.dispose();
  }

  Future<void> _pickPoster() async {
    if (!_canSubmit) return;
    final result = await FilePicker.platform.pickFiles(
      type: FileType.image,
      allowMultiple: false,
    );
    if (result == null || result.files.isEmpty) return;
    final file = result.files.single;
    setState(() {
      _posterPath = file.path;
    });
  }

  Future<String?> _posterPayload() async {
    if (_posterPath == null) return null;
    final value = _posterPath!.trim();
    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
      return value;
    }
    if (kIsWeb) return value;
    return await CloudinaryService.uploadImage(value);
  }

  Future<void> _saveDraft() async {
    if (!_canSubmit) return;

    setState(() {
      _linkError = null;
      _captionError = null;
      _isSubmitting = true;
    });

    final provider = context.read<AppDataProvider>();
    final messenger = ScaffoldMessenger.of(context);
    final nav = Navigator.of(context);

    try {
      final poster = await _posterPayload();
      await provider.submitContentProof(
        contentPlanId: widget.item.id,
        videoLink: _linkController.text.trim(),
        caption: _captionController.text.trim(),
        posterPath: poster,
        videoFileName: _videoFileName,
        sendToReview: false,
      );
      if (!mounted) return;
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Draft konten berhasil disimpan!'),
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

  Future<void> _submitReview() async {
    if (!_canSubmit) return;

    bool hasError = false;
    final linkText = _linkController.text.trim();
    final captionText = _captionController.text.trim();

    if (linkText.isEmpty) {
      setState(() => _linkError = 'Link Google Drive / hasil konten wajib diisi');
      hasError = true;
    } else {
      final validation = validateDriveOrVideoUrl(linkText);
      if (!validation.isValid) {
        setState(() => _linkError = validation.message);
        hasError = true;
      }
    }

    if (captionText.isEmpty) {
      setState(() => _captionError = 'Caption / copywriting wajib diisi');
      hasError = true;
    }

    if (hasError) return;

    setState(() {
      _linkError = null;
      _captionError = null;
      _isSubmitting = true;
    });

    final provider = context.read<AppDataProvider>();
    final messenger = ScaffoldMessenger.of(context);
    final nav = Navigator.of(context);

    try {
      final poster = await _posterPayload();
      await provider.submitContentProof(
        contentPlanId: widget.item.id,
        videoLink: linkText,
        caption: captionText,
        posterPath: poster,
        videoFileName: _videoFileName,
        sendToReview: true,
      );
      if (!mounted) return;
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Hasil konten berhasil dikirim! Menunggu verifikasi Admin Humas.'),
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
        return Image.memory(bytes, height: 180, width: double.infinity, fit: BoxFit.cover);
      } catch (_) {
        return null;
      }
    }

    if (path.startsWith('http://') || path.startsWith('https://')) {
      return Image.network(path, height: 180, width: double.infinity, fit: BoxFit.cover);
    }

    if (!kIsWeb && File(path).existsSync()) {
      return Image.file(File(path), height: 180, width: double.infinity, fit: BoxFit.cover);
    }

    return null;
  }

  Widget _buildLockBanner() {
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
        message = 'Konten sudah disetujui Kepala Humas. Menunggu jadwal tayang.';
        color = AppColors.success;
        icon = Icons.check_circle_outline;
        break;
      case ContentPlanStatus.menungguPersetujuanKepalaHumas:
        message = 'Telah diverifikasi Admin. Menunggu persetujuan Kepala Humas.';
        color = const Color(0xFF7C3AED);
        icon = Icons.hourglass_top_outlined;
        break;
      case ContentPlanStatus.menungguVerifikasiAdmin:
        message = 'Hasil konten telah dikirim. Menunggu verifikasi Admin Humas.';
        color = AppColors.warning;
        icon = Icons.hourglass_top_outlined;
        break;
      case ContentPlanStatus.ditolak:
        message = 'Konten dibatalkan.';
        color = AppColors.danger;
        icon = Icons.block_outlined;
        break;
      case ContentPlanStatus.perluRevisi:
        message = 'Terdapat catatan revisi. Silakan perbaiki dan kirim ulang.';
        color = AppColors.warning;
        icon = Icons.edit_note_outlined;
        break;
      default:
        return const SizedBox.shrink();
    }

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final posterPreview = _buildPosterPreview();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.card,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Detail Content Plan',
          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Info Header Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    children: item.tags
                        .map(
                          (tag) => Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppColors.tealLight,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              tag,
                              style: const TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w600,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    item.description.isNotEmpty ? item.description : 'Tidak ada deskripsi/brief tambahan.',
                    style: TextStyle(color: AppColors.textSecondary, height: 1.5),
                  ),

                  // Catatan Verifikasi Admin
                  if (item.adminNotes != null && item.adminNotes!.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF0F9FF),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFBAE6FD)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.check_circle_outline, size: 16, color: Color(0xFF0284C7)),
                              SizedBox(width: 6),
                              Text(
                                'Catatan Verifikasi Admin Humas',
                                style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF0369A1)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            item.adminNotes!,
                            style: const TextStyle(color: Color(0xFF0369A1), fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                  ],

                  // Catatan Revisi
                  if (item.revisionNote != null && item.revisionNote!.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF7ED),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFFDBA74)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.replay_outlined, size: 16, color: Color(0xFFEA580C)),
                              SizedBox(width: 6),
                              Text(
                                'Catatan Revisi / Perbaikan',
                                style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF9A3412)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            item.revisionNote!,
                            style: const TextStyle(color: Color(0xFF9A3412), fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 16),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: item.progress / 100,
                      minHeight: 8,
                      backgroundColor: const Color(0xFFE5E7EB),
                      color: item.progress >= 100 ? AppColors.success : AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Progress: ${item.progress}%',
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            const Text('Tenggat Waktu', style: TextStyle(fontWeight: FontWeight.w600)),
                            const Spacer(),
                            const Icon(Icons.access_time, color: AppColors.danger, size: 18),
                            const SizedBox(width: 4),
                            Text(
                              item.deadlineLabel,
                              style: const TextStyle(
                                color: AppColors.danger,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            const Text('PIC Kreator', style: TextStyle(fontWeight: FontWeight.w600)),
                            const Spacer(),
                            Icon(Icons.person_outline, size: 18, color: AppColors.textSecondary),
                            const SizedBox(width: 4),
                            Text(item.pic),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            const Text('Status', style: TextStyle(fontWeight: FontWeight.w600)),
                            const Spacer(),
                            StatusBadge(label: item.statusLabel),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),
            _buildLockBanner(),

            // Form Pengiriman Hasil Konten
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Pengiriman Hasil Konten',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Lengkapi visual, link hasil karya (Google Drive), dan teks caption sebelum dikirim.',
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                  ),
                  const SizedBox(height: 16),

                  // 1. Upload Visual / Thumbnail Poster
                  const Text(
                    'Visual / Poster / Thumbnail',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                  const SizedBox(height: 8),
                  if (posterPreview != null) ...[
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: posterPreview,
                    ),
                    const SizedBox(height: 8),
                  ],
                  if (_canSubmit) ...[
                    OutlinedButton.icon(
                      onPressed: _isSubmitting ? null : _pickPoster,
                      icon: const Icon(Icons.photo_library_outlined, size: 18),
                      label: Text(
                        _posterPath != null ? 'Ganti Poster / Gambar' : 'Pilih File Poster / Gambar',
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // 2. Link Hasil Konten (Google Drive)
                  const Text(
                    'Link Hasil Konten (Google Drive / Video Link) *',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _linkController,
                    enabled: _canSubmit && !_isSubmitting,
                    readOnly: !_canSubmit,
                    onChanged: (_) {
                      if (_linkError != null) setState(() => _linkError = null);
                    },
                    decoration: InputDecoration(
                      hintText: 'https://drive.google.com/drive/folders/...',
                      filled: true,
                      fillColor: _canSubmit ? AppColors.card : const Color(0xFFF3F4F6),
                      errorText: _linkError,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 3. Caption & Copywriting
                  const Text(
                    'Caption & Copywriting *',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _captionController,
                    enabled: _canSubmit && !_isSubmitting,
                    readOnly: !_canSubmit,
                    maxLines: 5,
                    onChanged: (_) {
                      if (_captionError != null) setState(() => _captionError = null);
                    },
                    decoration: InputDecoration(
                      hintText: 'Tuliskan teks caption lengkap beserta hashtag dan mention...',
                      filled: true,
                      fillColor: _canSubmit ? AppColors.card : const Color(0xFFF3F4F6),
                      errorText: _captionError,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                      ),
                    ),
                  ),

                  if (_canSubmit) ...[
                    const SizedBox(height: 16),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.blueLight,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.info_outline, color: Color(0xFF0284C7), size: 18),
                          SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'File video/media utama disimpan di Google Drive agar tidak membebani server.',
                              style: TextStyle(color: Color(0xFF0284C7), fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Action Buttons: Simpan Draft & Kirim untuk Review
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: _isSubmitting ? null : _saveDraft,
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: const Text(
                              'Simpan Draft',
                              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          flex: 2,
                          child: ElevatedButton.icon(
                            onPressed: _isSubmitting ? null : _submitReview,
                            icon: _isSubmitting
                                ? const SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Icon(Icons.send, color: Colors.white, size: 18),
                            label: Text(
                              _isSubmitting ? 'Mengirim...' : 'Kirim untuk Review',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                                fontSize: 14,
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
