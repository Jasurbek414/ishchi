import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../l10n/l10n_x.dart';

/// A small pill used for the trust and availability signals: verified, rating, free today, urgent.
///
/// Each carries an icon and a word, never colour alone, so it still reads in greyscale and for
/// anyone who cannot separate the hues.
class SignalBadge extends StatelessWidget {
  const SignalBadge({super.key, required this.icon, required this.label, required this.color});

  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(color: color, fontSize: 11.5, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

/// "Tasdiqlangan" — an admin checked this worker's documents.
class VerifiedBadge extends StatelessWidget {
  const VerifiedBadge({super.key});

  @override
  Widget build(BuildContext context) => SignalBadge(
        icon: Icons.verified_outlined,
        label: context.l10n.verifiedBadge,
        color: context.themeSuccess,
      );
}

/// The average score and how many ratings it rests on — a 5.0 from one job is not a 5.0 from twenty.
class RatingBadge extends StatelessWidget {
  const RatingBadge({super.key, required this.average, required this.count});

  final double? average;
  final int count;

  @override
  Widget build(BuildContext context) {
    if (average == null || count <= 0) {
      return const SizedBox.shrink();
    }
    return SignalBadge(
      icon: Icons.star_rounded,
      label: context.l10n.ratingSummary(average!.toStringAsFixed(1), count),
      color: Theme.of(context).colorScheme.primary,
    );
  }
}

/// "Bugun bo'sh" — the worker said so today, and it expires tonight.
class AvailableTodayBadge extends StatelessWidget {
  const AvailableTodayBadge({super.key});

  @override
  Widget build(BuildContext context) => SignalBadge(
        icon: Icons.today_outlined,
        label: context.l10n.availableTodayBadge,
        color: context.themeSuccess,
      );
}

/// "Shoshilinch" — same-day work, which also sorts ahead of newest in the list.
class UrgentBadge extends StatelessWidget {
  const UrgentBadge({super.key});

  @override
  Widget build(BuildContext context) => SignalBadge(
        icon: Icons.bolt_rounded,
        label: context.l10n.urgentBadge,
        color: Theme.of(context).colorScheme.error,
      );
}
