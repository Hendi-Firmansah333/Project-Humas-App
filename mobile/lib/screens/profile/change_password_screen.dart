import 'package:flutter/material.dart';
import 'package:poli_humas/services/auth_service.dart';
import 'package:poli_humas/theme/app_colors.dart';

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _oldController = TextEditingController();
  final _newController = TextEditingController();
  final _confirmController = TextEditingController();

  bool _obscureOld = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _isSaving = false;

  @override
  void dispose() {
    _oldController.dispose();
    _newController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  String? _validateOld(String? value) {
    if (value == null || value.isEmpty) return 'Password lama wajib diisi.';
    if (!AuthService.instance.verifyPassword(value)) {
      return 'Password lama tidak sesuai.';
    }
    return null;
  }

  String? _validateNew(String? value) {
    if (value == null || value.isEmpty) return 'Password baru wajib diisi.';
    if (value.length < 8) return 'Minimal 8 karakter.';
    if (!RegExp(r'[A-Z]').hasMatch(value)) return 'Harus ada huruf besar.';
    if (!RegExp(r'[a-z]').hasMatch(value)) return 'Harus ada huruf kecil.';
    if (!RegExp(r'[0-9]').hasMatch(value)) return 'Harus ada angka.';
    if (value == _oldController.text) {
      return 'Harus berbeda dari password lama.';
    }
    return null;
  }

  String? _validateConfirm(String? value) {
    if (value == null || value.isEmpty) return 'Konfirmasi password wajib diisi.';
    if (value != _newController.text) return 'Konfirmasi password tidak cocok.';
    return null;
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    final success = await AuthService.instance.changePassword(
      oldPassword: _oldController.text,
      newPassword: _newController.text,
      confirmPassword: _confirmController.text,
    );
    if (!mounted) return;
    setState(() => _isSaving = false);

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Password berhasil diubah.'),
          backgroundColor: AppColors.success,
        ),
      );
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
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
          'Ubah Password',
          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.blueLight,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Ketentuan Password Baru',
                      style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF1D4ED8)),
                    ),
                    SizedBox(height: 6),
                    Text('• Minimal 8 karakter', style: TextStyle(fontSize: 12, color: Color(0xFF1D4ED8))),
                    Text('• Mengandung huruf besar & kecil', style: TextStyle(fontSize: 12, color: Color(0xFF1D4ED8))),
                    Text('• Mengandung angka', style: TextStyle(fontSize: 12, color: Color(0xFF1D4ED8))),
                    Text('• Berbeda dari password lama', style: TextStyle(fontSize: 12, color: Color(0xFF1D4ED8))),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              _passwordField(
                controller: _oldController,
                label: 'Password Lama',
                obscure: _obscureOld,
                onToggle: () => setState(() => _obscureOld = !_obscureOld),
                validator: _validateOld,
              ),
              const SizedBox(height: 16),
              _passwordField(
                controller: _newController,
                label: 'Password Baru',
                obscure: _obscureNew,
                onToggle: () => setState(() => _obscureNew = !_obscureNew),
                validator: _validateNew,
              ),
              const SizedBox(height: 16),
              _passwordField(
                controller: _confirmController,
                label: 'Konfirmasi Password Baru',
                obscure: _obscureConfirm,
                onToggle: () => setState(() => _obscureConfirm = !_obscureConfirm),
                validator: _validateConfirm,
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
                          'Simpan Password',
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

  Widget _passwordField({
    required TextEditingController controller,
    required String label,
    required bool obscure,
    required VoidCallback onToggle,
    required String? Function(String?) validator,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: obscure,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: const Icon(Icons.lock_outline),
        suffixIcon: IconButton(
          icon: Icon(obscure ? Icons.visibility_off : Icons.visibility),
          onPressed: onToggle,
        ),
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}