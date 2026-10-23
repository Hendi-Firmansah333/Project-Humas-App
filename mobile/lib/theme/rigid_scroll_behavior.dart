import 'package:flutter/material.dart';

/// Clamped scroll without bounce; still scrollable for pull-to-refresh.
const appScrollPhysics = AlwaysScrollableScrollPhysics(
  parent: ClampingScrollPhysics(),
);

/// Scroll behavior without stretch, glow, or bounce at scroll boundaries.
class RigidScrollBehavior extends MaterialScrollBehavior {
  const RigidScrollBehavior();

  @override
  Widget buildOverscrollIndicator(
    BuildContext context,
    Widget child,
    ScrollableDetails details,
  ) {
    return child;
  }

  @override
  ScrollPhysics getScrollPhysics(BuildContext context) {
    return appScrollPhysics;
  }
}