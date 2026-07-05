import 'dart:convert';
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:poli_humas/models/content_plan.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
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
  String? _posterPath;
  String? _posterFileName;
  String? _videoFileName;
  String? _linkError;
  bool _isSubmitting = false;

  bool get _canSubmit => widget.item.canSubmit;

  @override
  void initState() {
    super.initState();
    if (widget.item.videoLink != null) {
      _linkController.text = widget.item.videoLink!;
    }
    _posterPath = widget.item.posterPath;
    _videoFileName = widget.item.videoFileName;
  }

  @override
  void dispose() {
    _linkController.dispose();
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
      _posterFileName = file.name;
    });
  }

  Future<void> _pickVideo() async {
    if (!_canSubmit) return;
    final result = await FilePicker.platform.pickFiles(
      type: FileType.video,
      allowMultiple: false,
    );
    if (result == null || result.files.isEmpty) return;
    final file = result.files.single;
    setState(() => _videoFileName = file.name);
  }

  Future<String?> _posterPayload() async {
    if (_posterPath == null) return null;
    final value = _posterPath!.trim();
    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
      return value;
    }
    if (kIsWeb) return value;
    final file = File(value);
    if (!file.existsSync()) return null;
    final bytes = await file.readAsBytes();
    final ext = value.split('.').last.toLowerCase();
    final mime = ext == 'png' ? 'image/png' : 'image/jpeg';
    return 'data:$mime;base64,${base64Encode(bytes)}';
  }

  Future<void> _submit() async {
    if (!_canSubmit) return;

    final validation = validateDriveOrVideoUrl(_linkController.text);
    if (!validation.isValid) {
      setState(() => _linkError = validation.message);
      return;
    }

    setState(() {
      _linkError = null;
      _isSubmitting = true;
    });

    try {
      final poster = await _posterPayload();
      await context.read<AppDataProvider>().submitContentProof(
            contentPlanId: widget.item.id,
            videoLink: _linkController.text.trim(),
            posterPath: poster,
            videoFileName: _videoFileName,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Bukti penyelesaian berhasil dikirim! Menunggu review admin.'),
          backgroundColor: AppColors.success,
        ),
      );
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
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
        return Image.memory(bytes, height: 160, width: double.infinity, fit: BoxFit.cover);
      } catch (_) {
        return null;
      }
    }

    if (path.startsWith('http://') || path.startsWith('https://')) {
      return Image.network(path, height: 160, width: double.infinity, fit: BoxFit.cover);
    }

    if (!kIsWeb && File(path).existsSync()) {
      return Image.file(File(path), height: 160, width: double.infinity, fit: BoxFit.cover);
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
        message = 'Konten sudah disetujui admin. Pengiriman bukti dikunci.';
        color = AppColors.success;
        icon = Icons.verified_outlined;
        break;
      case ContentPlanStatus.menungguReview:
        message = 'Bukti sudah dikirim. Menunggu review admin humas.';
        color = AppColors.warning;
        icon = Icons.hourglass_top_outlined;
        break;
      case ContentPlanStatus.ditolak:
        message = 'Konten ditolak admin. Hubungi admin untuk membuka kembali.';
        color = AppColors.danger;
        icon = Icons.block_outlined;
        break;
      case ContentPlanStatus.perluRevisi:
        message = 'Admin meminta revisi. Silakan perbaiki dan kirim ulang bukti.';
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
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
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
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
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
                    item.description,
                    style: const TextStyle(color: AppColors.textSecondary, height: 1.5),
                  ),
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
                          const Text(
                            'Catatan Revisi Admin',
                            style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF9A3412)),
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
                    style: const TextStyle(
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
                            const Text('PIC', style: TextStyle(fontWeight: FontWeight.w600)),
                            const Spacer(),
                            const Icon(Icons.person_outline, size: 18, color: AppColors.textSecondary),
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
            const Text(
              'Bukti Penyelesaian',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
            ),
            const SizedBox(height: 12),
            if (_canSubmit) ...[
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _pickVideo,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text(
                        'Pilih File Video',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _isSubmitting ? null : _pickPoster,
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text(
                        'Upload Poster/Thumb',
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ],
            if (_videoFileName != null) ...[
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.videocam_outlined, color: AppColors.primary, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _videoFileName!,
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ],
            if (_posterFileName != null || _posterPath != null) ...[
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.image_outlined, color: AppColors.primary, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _posterFileName ?? 'Poster terpilih',
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ],
            if (posterPreview != null) ...[
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: posterPreview,
              ),
            ],
            const SizedBox(height: 16),
            const Text(
              'Link Video (YouTube/Drive)',
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
                hintText: 'Masukkan link video di sini...',
                filled: true,
                fillColor: _canSubmit ? Colors.white : const Color(0xFFF3F4F6),
                errorText: _linkError,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                ),
              ),
            ),
            if (_canSubmit) ...[
              const SizedBox(height: 14),
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
                        'Video tidak diupload langsung agar penyimpanan server tetap ringan.',
                        style: TextStyle(color: Color(0xFF0284C7), fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _isSubmitting ? null : _submit,
                  icon: _isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.send, color: Colors.white),
                  label: Text(
                    _isSubmitting ? 'Mengirim...' : 'Kirim Bukti',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}