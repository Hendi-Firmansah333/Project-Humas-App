import 'package:flutter/material.dart';

/// Widget logo Humas menggunakan image asset logo.png
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
            color: const Color(0xFF32B0C5).withOpacity(0.28),
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
