import 'package:flutter/material.dart';
import 'package:poli_humas/config/api_config.dart';
import 'package:poli_humas/providers/app_data_provider.dart';
import 'package:poli_humas/screens/main_shell.dart';
import 'package:poli_humas/services/auth_service.dart';
import 'package:poli_humas/theme/app_colors.dart';
import 'package:poli_humas/widgets/logo_painter.dart';
import 'package:provider/provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with TickerProviderStateMixin {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _ingatSaya = false;
  bool _isLoading = false;

  // Staggered Animations
  late AnimationController _staggeredController;
  late Animation<double> _titleAnim;
  late Animation<double> _usernameAnim;
  late Animation<double> _passwordAnim;
  late Animation<double> _actionsAnim;
  late Animation<double> _buttonAnim;
  late Animation<double> _infoAnim;

  @override
  void initState() {
    super.initState();

    _staggeredController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );

    // Masing-masing delay sekitar 120 ms (dengan total durasi 1000 ms)
    _titleAnim = CurvedAnimation(
      parent: _staggeredController,
      curve: const Interval(0.0, 0.5, curve: Curves.easeOutCubic),
    );
    _usernameAnim = CurvedAnimation(
      parent: _staggeredController,
      curve: const Interval(0.12, 0.62, curve: Curves.easeOutCubic),
    );
    _passwordAnim = CurvedAnimation(
      parent: _staggeredController,
      curve: const Interval(0.24, 0.74, curve: Curves.easeOutCubic),
    );
    _actionsAnim = CurvedAnimation(
      parent: _staggeredController,
      curve: const Interval(0.36, 0.86, curve: Curves.easeOutCubic),
    );
    _buttonAnim = CurvedAnimation(
      parent: _staggeredController,
      curve: const Interval(0.48, 0.98, curve: Curves.easeOutCubic),
    );
    _infoAnim = CurvedAnimation(
      parent: _staggeredController,
      curve: const Interval(0.60, 1.0, curve: Curves.easeOutCubic),
    );

    // Mulai animasi staggered setelah transisi layar selesai
    Future.delayed(const Duration(milliseconds: 250), () {
      if (mounted) _staggeredController.forward();
    });
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _staggeredController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (_usernameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Username wajib diisi.')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      if (ApiConfig.enabled) {
        final error = await AuthService.instance.loginRemote(
          username: _usernameController.text.trim(),
          password: _passwordController.text,
        );
        if (error != null) {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(error), backgroundColor: AppColors.danger),
          );
          return;
        }
        if (!mounted) return;
        await context.read<AppDataProvider>().refreshAll(simulateNetwork: false);
      } else if (!AuthService.instance.verifyPassword(_passwordController.text)) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Password tidak sesuai.'),
            backgroundColor: AppColors.danger,
          ),
        );
        return;
      }

      await AuthService.instance.setLoggedIn(true);

      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const MainShell()),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    final isDark = brightness == Brightness.dark;
    final bgColor = isDark ? const Color(0xFF121212) : Colors.white;

    return Scaffold(
      backgroundColor: bgColor,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // 1. Soft Cyan Glows at the Four Corners (Premium Radial Gradients)
          Positioned(
            top: -120,
            left: -120,
            child: _buildGlowCircle(isDark),
          ),
          Positioned(
            top: -120,
            right: -120,
            child: _buildGlowCircle(isDark),
          ),
          Positioned(
            bottom: -120,
            left: -120,
            child: _buildGlowCircle(isDark),
          ),
          Positioned(
            bottom: -120,
            right: -120,
            child: _buildGlowCircle(isDark),
          ),

          // 2. Main Scrollable Content
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                physics: const ClampingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(height: 20),

                    // Logo dengan Hero (Berpindah dari Splash)
                    const Hero(
                      tag: 'app_logo',
                      flightShuttleBuilder: _flightShuttleBuilder,
                      child: HumasLogoVector(
                        size: 100,
                        showShadow: true,
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Staggered Judul
                    _buildStaggeredItem(
                      animation: _titleAnim,
                      child: Column(
                        children: [
                          Text(
                            'Masuk Ke Sistem',
                            style: TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.w900,
                              color: isDark ? Colors.white : const Color(0xFF1F2937),
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Silakan masuk dengan akun Humas Anda',
                            style: TextStyle(
                              fontSize: 14,
                              color: isDark ? const Color(0xFF9CA3AF) : const Color(0xFF6B7280),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Card Login Container (Fade, Slide Up, Scale sedikit)
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(isDark ? 0.25 : 0.05),
                            blurRadius: 40,
                            offset: const Offset(0, 12),
                          ),
                        ],
                        border: Border.all(
                          color: isDark ? Colors.white.withOpacity(0.06) : const Color(0xFFF3F4F6),
                        ),
                      ),
                      child: Column(
                        children: [
                          // Field Username Staggered
                          _buildStaggeredItem(
                            animation: _usernameAnim,
                            child: TextField(
                              controller: _usernameController,
                              enabled: !_isLoading,
                              style: TextStyle(color: isDark ? Colors.white : Colors.black87),
                              decoration: InputDecoration(
                                labelText: 'Username',
                                labelStyle: TextStyle(color: isDark ? const Color(0xFF9CA3AF) : const Color(0xFF6B7280)),
                                prefixIcon: Icon(Icons.person_outline_rounded, color: isDark ? const Color(0xFF9CA3AF) : const Color(0xFF6B7280)),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(16),
                                  borderSide: BorderSide(color: isDark ? Colors.white12 : Colors.black12),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(16),
                                  borderSide: BorderSide(color: isDark ? Colors.white.withOpacity(0.08) : const Color(0xFFE5E7EB)),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(16),
                                  borderSide: const BorderSide(color: Color(0xFF0D9488), width: 1.5),
                                ),
                                filled: true,
                                fillColor: isDark ? const Color(0xFF151515) : const Color(0xFFF9FAFB),
                              ),
                            ),
                          ),
                          const SizedBox(height: 18),

                          // Field Password Staggered
                          _buildStaggeredItem(
                            animation: _passwordAnim,
                            child: TextField(
                              controller: _passwordController,
                              enabled: !_isLoading,
                              obscureText: _obscurePassword,
                              style: TextStyle(color: isDark ? Colors.white : Colors.black87),
                              decoration: InputDecoration(
                                labelText: 'Password',
                                labelStyle: TextStyle(color: isDark ? const Color(0xFF9CA3AF) : const Color(0xFF6B7280)),
                                prefixIcon: Icon(Icons.lock_outline_rounded, color: isDark ? const Color(0xFF9CA3AF) : const Color(0xFF6B7280)),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _obscurePassword ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                                    color: isDark ? const Color(0xFF9CA3AF) : const Color(0xFF6B7280),
                                  ),
                                  onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                                ),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(16),
                                  borderSide: BorderSide(color: isDark ? Colors.white12 : Colors.black12),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(16),
                                  borderSide: BorderSide(color: isDark ? Colors.white.withOpacity(0.08) : const Color(0xFFE5E7EB)),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(16),
                                  borderSide: const BorderSide(color: Color(0xFF0D9488), width: 1.5),
                                ),
                                filled: true,
                                fillColor: isDark ? const Color(0xFF151515) : const Color(0xFFF9FAFB),
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Row Actions (Remember Me & Forgot Pass) Staggered
                          _buildStaggeredItem(
                            animation: _actionsAnim,
                            child: Row(
                              children: [
                                SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: Checkbox(
                                    value: _ingatSaya,
                                    onChanged: _isLoading ? null : (val) => setState(() => _ingatSaya = val ?? false),
                                    activeColor: const Color(0xFF0D9488),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'Ingat Saya',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: isDark ? const Color(0xFF9CA3AF) : const Color(0xFF4B5563),
                                  ),
                                ),
                                const Spacer(),
                                TextButton(
                                  onPressed: () {},
                                  style: TextButton.styleFrom(
                                    padding: EdgeInsets.zero,
                                    minimumSize: Size.zero,
                                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  ),
                                  child: const Text(
                                    'Lupa Password?',
                                    style: TextStyle(color: Color(0xFF0D9488), fontSize: 13, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 28),

                          // Button Login Staggered
                          _buildStaggeredItem(
                            animation: _buttonAnim,
                            child: SizedBox(
                              width: double.infinity,
                              height: 52,
                              child: ElevatedButton(
                                onPressed: _isLoading ? null : _login,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF0D9488),
                                  elevation: 0,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                ),
                                child: _isLoading
                                    ? const SizedBox(
                                        width: 22,
                                        height: 22,
                                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                      )
                                    : const Text(
                                        'Masuk',
                                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white),
                                      ),
                               ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Info Box Staggered (Hanya jika API aktif)
                    if (ApiConfig.enabled) ...[
                      const SizedBox(height: 24),
                      _buildStaggeredItem(
                        animation: _infoAnim,
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E1E1E).withOpacity(0.5) : const Color(0xFFF9FAFB),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: const Color(0xFF0D9488).withOpacity(isDark ? 0.15 : 0.08),
                            ),
                          ),
                          child: Text(
                            'Login Anggota Humas (terhubung ke web admin):\n'
                            '• budi.s / admin123 (PIC kegiatan)\n'
                            '• budi.fotografer / admin123\n'
                            '• rina.wati / admin123',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? const Color(0xFF9CA3AF) : const Color(0xFF4B5563),
                              height: 1.5,
                            ),
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Builder untuk membuat soft cyan glow
  Widget _buildGlowCircle(bool isDark) {
    return Container(
      width: 280,
      height: 280,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          colors: [
            const Color(0xFF00B4D8).withOpacity(isDark ? 0.06 : 0.08),
            const Color(0xFF00B4D8).withOpacity(0.0),
          ],
        ),
      ),
    );
  }

  // Builder untuk menerapkan staggered animation (Fade, Slide Up, Scale)
  Widget _buildStaggeredItem({
    required Animation<double> animation,
    required Widget child,
  }) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        final opacity = animation.value;
        // Transform translate Y
        final slideY = (1.0 - animation.value) * 24.0;
        // Transform scale
        final scale = 0.96 + (animation.value * 0.04);

        return Opacity(
          opacity: opacity,
          child: Transform.translate(
            offset: Offset(0.0, slideY),
            child: Transform.scale(
              scale: scale,
              child: child,
            ),
          ),
        );
      },
      child: child,
    );
  }
}

// Handler khusus untuk menjaga Hero transition tidak patah / tetap tajam saat transisi
Widget _flightShuttleBuilder(
  BuildContext flightContext,
  Animation<double> animation,
  HeroFlightDirection flightDirection,
  BuildContext fromHeroContext,
  BuildContext toHeroContext,
) {
  return AnimatedBuilder(
    animation: animation,
    builder: (context, child) {
      return const HumasLogoVector(
        size: 100,
        showShadow: false, // Hilangkan shadow selama penerbangan agar performa optimal
      );
    },
  );
}