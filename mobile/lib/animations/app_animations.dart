import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

extension PoliHumasMotion on Widget {
  /// Standard staggered list item entrance.
  Widget staggeredEntrance(int index, {bool visible = true}) {
    if (!visible) return this;
    return Animate(
      delay: Duration(milliseconds: index * 50),
      child: this,
    )
        .fadeIn(duration: 350.ms, curve: Curves.easeOutCubic)
        .slideY(begin: 0.08, end: 0, curve: Curves.easeOutCubic);
  }

  /// Horizontal list entrance (schedules, activity lists).
  Widget staggeredEntranceX(int index, {bool visible = true}) {
    if (!visible) return this;
    return Animate(
      delay: Duration(milliseconds: index * 45),
      child: this,
    )
        .fadeIn(duration: 300.ms, curve: Curves.easeOutCubic)
        .slideX(begin: 0.04, end: 0, curve: Curves.easeOutCubic);
  }

  /// Screen-level fade-in on mount.
  Widget screenEntrance() {
    return Animate(child: this)
        .fadeIn(duration: 250.ms, curve: Curves.easeOutCubic);
  }
}