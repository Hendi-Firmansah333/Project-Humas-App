import 'dart:ui';
import 'package:flutter/material.dart';

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
    return RepaintBoundary(
      child: SizedBox(
        width: size,
        height: size,
        child: CustomPaint(
          painter: HumasLogoPainter(showShadow: showShadow),
        ),
      ),
    );
  }
}

class HumasLogoPainter extends CustomPainter {
  HumasLogoPainter({required this.showShadow});

  final bool showShadow;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Gunakan bounds persegi untuk menjaga aspek rasio
    final side = w < h ? w : h;
    final scale = side / 100.0;

    final centerX = w / 2;
    final centerY = h / 2;

    // Buat path untuk komponen Logo H-Lens Modern
    final path = Path();

    // 1. Tiang Kiri (Kapsul)
    final leftRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(
        centerX - 35 * scale,
        centerY - 40 * scale,
        18 * scale,
        80 * scale,
      ),
      Radius.circular(9 * scale),
    );
    path.addRRect(leftRect);

    // 2. Tiang Kanan (Kapsul)
    final rightRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(
        centerX + 17 * scale,
        centerY - 40 * scale,
        18 * scale,
        80 * scale,
      ),
      Radius.circular(9 * scale),
    );
    path.addRRect(rightRect);

    // 3. Ring Tengah (Kamera Lens / Hubungan Komunikasi)
    final outerCircle = Path()
      ..addOval(Rect.fromCircle(
        center: Offset(centerX, centerY),
        radius: 26 * scale,
      ));
    final innerCircle = Path()
      ..addOval(Rect.fromCircle(
        center: Offset(centerX, centerY),
        radius: 12 * scale,
      ));

    // Kombinasikan ring tengah (outer minus inner) ke path utama
    final ringPath = Path.combine(PathOperation.difference, outerCircle, innerCircle);
    path.addPath(ringPath, Offset.zero);

    // 4. Jembatan Penghubung Horizontal (agar menyatu sebagai huruf H)
    final bridgeRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(
        centerX - 20 * scale,
        centerY - 8 * scale,
        40 * scale,
        16 * scale,
      ),
      Radius.circular(4 * scale),
    );
    path.addRRect(bridgeRect);

    // Tentukan Gradient untuk Logo (Teal ke Cyan modern)
    final gradient = LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: const [
        Color(0xFF0D9488), // Teal
        Color(0xFF00B4D8), // Cyan
      ],
    );

    final paint = Paint()
      ..shader = gradient.createShader(
        Rect.fromLTWH(centerX - 40 * scale, centerY - 40 * scale, 80 * scale, 80 * scale),
      )
      ..style = PaintingStyle.fill;

    // Gambar Shadow Terlebih Dahulu jika diaktifkan
    if (showShadow) {
      final shadowPaint = Paint()
        ..color = const Color(0xFF0D9488).withOpacity(0.22)
        ..style = PaintingStyle.fill
        ..imageFilter = ImageFilter.blur(
          sigmaX: 18 * scale,
          sigmaY: 18 * scale,
          tileMode: TileMode.decal,
        );

      canvas.save();
      // Geser sedikit ke bawah untuk efek elevasi natural
      canvas.translate(0, 4 * scale);
      canvas.drawPath(path, shadowPaint);
      canvas.restore();
    }

    // Gambar Logo utama di atas shadow
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant HumasLogoPainter oldDelegate) {
    return oldDelegate.showShadow != showShadow;
  }
}
