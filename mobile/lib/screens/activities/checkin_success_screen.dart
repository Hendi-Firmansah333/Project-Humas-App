import 'package:flutter/material.dart';
import 'package:poli_humas/models/activity.dart';
import 'package:poli_humas/theme/app_colors.dart';

void _popBack(BuildContext context, {required int steps}) {
  var remaining = steps;
  while (remaining > 0 && Navigator.canPop(context)) {
    Navigator.pop(context);
    remaining--;
  }
}

class CheckinSuccessScreen extends StatelessWidget {
  const CheckinSuccessScreen({
    super.key,
    required this.activity,
    required this.recordedTime,
    required this.isLate,
    required this.distanceMeters,
  });

  final ActivityItem activity;
  final String recordedTime;
  final bool isLate;
  final double distanceMeters;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const Spacer(),
              Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle, color: AppColors.success, size: 52),
              ),
              const SizedBox(height: 24),
              const Text(
                'Check-in Berhasil!',
                style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.primaryDark),
              ),
              const SizedBox(height: 8),
              Text(
                isLate
                    ? 'Kehadiran Anda telah dicatat (terlambat).'
                    : 'Kehadiran Anda telah tercatat dengan sukses.',
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.textSecondary, height: 1.5),
              ),
              const SizedBox(height: 28),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    _SummaryRow(label: 'Kegiatan', value: activity.title),
                    const Divider(height: 24),
                    _SummaryRow(label: 'Lokasi', value: activity.location),
                    const Divider(height: 24),
                    _SummaryRow(label: 'Waktu', value: '$recordedTime WIB'),
                    const Divider(height: 24),
                    _SummaryRow(
                      label: 'Status',
                      value: isLate ? 'Terlambat' : 'Tepat Waktu',
                      valueColor: isLate ? AppColors.warning : AppColors.success,
                    ),
                    const Divider(height: 24),
                    _SummaryRow(
                      label: 'GPS',
                      value: 'Valid (${distanceMeters.round()}m dari titik)',
                      valueColor: AppColors.success,
                    ),
                  ],
                ),
              ),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => _popBack(context, steps: 3),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Selesai', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => _popBack(context, steps: 3),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Kembali ke Detail Kegiatan', style: TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
    this.valueColor,
  });

  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(label, style: const TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
        ),
        Expanded(
          flex: 2,
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              color: valueColor ?? AppColors.textPrimary,
            ),
          ),
        ),
      ],
    );
  }
}