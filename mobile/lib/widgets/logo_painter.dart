import 'package:flutter/material.dart';
import 'package:poli_humas/theme/app_colors.dart';

/// Widget logo PoliHumas menggunakan image asset logo.png (Logo P)
class HumasLogoVector extends StatelessWidget {
  const HumasLogoVector({
    super.key,
    this.size = 140,
    this.showShadow = true,
  });

  final double size;
  final bool showShadow;

  @override
  Widget build(BuildContext context) {
    final Widget logo = Image.asset(
      'assets/images/logo.png',
      width: size,
      height: size,
      fit: BoxFit.contain,
    );

    if (!showShadow) return logo;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(size * 0.18),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.25),
            blurRadius: size * 0.28,
            offset: Offset(0, size * 0.06),
            spreadRadius: 0,
          ),
        ],
      ),
      child: logo,
    );
  }
}
