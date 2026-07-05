import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:poli_humas/services/user_profile_service.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/widgets/profile_avatar.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _picker = ImagePicker();

  String? _photoPath;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final profile = UserProfileService.instance.profile;
    _nameController.text = profile.name;
    _phoneController.text = profile.phone;
    _emailController.text = profile.email;
    _photoPath = profile.photoPath;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto(ImageSource source) async {
    final picked = await _picker.pickImage(
      source: source,
      maxWidth: 800,
      maxHeight: 800,
      imageQuality: 85,
    );
    if (picked != null) {
      setState(() => _photoPath = picked.path);
    }
  }

  void _showPhotoOptions() {
    showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.photo_library_outlined),
                title: const Text('Pilih dari Galeri'),
                onTap: () {
                  Navigator.pop(context);
                  _pickPhoto(ImageSource.gallery);
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_camera_outlined),
                title: const Text('Ambil dengan Kamera'),
                onTap: () {
                  Navigator.pop(context);
                  _pickPhoto(ImageSource.camera);
                },
              ),
              if (_photoPath != null)
                ListTile(
                  leading: const Icon(Icons.delete_outline, color: AppColors.danger),
                  title: const Text('Hapus Foto', style: TextStyle(color: AppColors.danger)),
                  onTap: () {
                    Navigator.pop(context);
                    setState(() => _photoPath = null);
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    await UserProfileService.instance.saveProfile(
      name: _nameController.text,
      phone: _phoneController.text,
      email: _emailController.text,
      photoPath: _photoPath,
      clearPhoto: _photoPath == null,
    );

    if (!mounted) return;
    setState(() => _isSaving = false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Profil berhasil diperbarui.'),
        backgroundColor: AppColors.success,
      ),
    );
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final emailEditable = UserProfileService.instance.profile.emailEditable;

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
          'Ubah Profil',
          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              ProfileAvatar(
                photoPath: _photoPath,
                radius: 52,
                showEditBadge: true,
                onTap: _showPhotoOptions,
              ),
              const SizedBox(height: 8),
              const Text(
                'Ketuk foto untuk mengubah',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
              ),
              const SizedBox(height: 28),
              _buildField(
                controller: _nameController,
                label: 'Nama Lengkap',
                icon: Icons.person_outline,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Nama wajib diisi.';
                  }
                  if (value.trim().length < 3) {
                    return 'Nama minimal 3 karakter.';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              _buildField(
                controller: _phoneController,
                label: 'Nomor Telepon',
                icon: Icons.phone_outlined,
                keyboardType: TextInputType.phone,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Nomor telepon wajib diisi.';
                  }
                  final digits = value.replaceAll(RegExp(r'\D'), '');
                  if (digits.length < 10 || digits.length > 15) {
                    return 'Nomor telepon tidak valid (10-15 digit).';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              _buildField(
                controller: _emailController,
                label: 'Alamat Email',
                icon: Icons.email_outlined,
                keyboardType: TextInputType.emailAddress,
                readOnly: !emailEditable,
                validator: (value) {
                  if (!emailEditable) return null;
                  if (value == null || value.trim().isEmpty) {
                    return 'Email wajib diisi.';
                  }
                  final emailRegex = RegExp(r'^[\w\.\-]+@([\w\-]+\.)+[\w\-]{2,}$');
                  if (!emailRegex.hasMatch(value.trim())) {
                    return 'Format email tidak valid.';
                  }
                  return null;
                },
              ),
              if (!emailEditable)
                const Padding(
                  padding: EdgeInsets.only(top: 6),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'Email tidak dapat diubah oleh pengguna.',
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                    ),
                  ),
                ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _save,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: _isSaving
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text(
                          'Simpan Perubahan',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    required String? Function(String?) validator,
    TextInputType? keyboardType,
    bool readOnly = false,
  }) {
    return TextFormField(
      controller: controller,
      readOnly: readOnly,
      keyboardType: keyboardType,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon),
        filled: true,
        fillColor: readOnly ? const Color(0xFFF3F4F6) : Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}