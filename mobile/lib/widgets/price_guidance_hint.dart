import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/formatters.dart';
import '../l10n/l10n_x.dart';
import '../models/enums.dart';
import '../models/price_guidance.dart';
import '../state/core_providers.dart';

/// What comparable postings pay, shown while the payment field is being filled in.
///
/// Every posting already recorded profession, region and payment; nothing ever read it back, so both
/// sides were guessing. Stays silent until a profession is chosen, and when the server says there is
/// too little history to draw a median from — a figure based on two postings would mislead.
class PriceGuidanceHint extends ConsumerWidget {
  const PriceGuidanceHint({
    super.key,
    required this.professionId,
    required this.regionId,
    required this.paymentType,
  });

  final int? professionId;
  final int? regionId;
  final PaymentType paymentType;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (professionId == null) return const SizedBox.shrink();

    final cs = Theme.of(context).colorScheme;
    return FutureBuilder<PriceGuidance>(
      future: ref.read(jobRepositoryProvider).priceGuidance(
            professionId: professionId!,
            regionId: regionId,
            paymentType: paymentType,
          ),
      builder: (context, snapshot) {
        final guidance = snapshot.data;
        // A failure here is not worth reporting: it is a hint, not part of the form.
        if (guidance == null || !guidance.hasData) return const SizedBox.shrink();

        return Padding(
          padding: const EdgeInsets.only(top: 10),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: cs.primaryContainer.withValues(alpha: 0.45),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(Icons.insights_outlined, size: 18, color: cs.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${context.l10n.priceGuidanceTitle} '
                        '${context.l10n.priceGuidanceRange(
                          Formatters.money(context, guidance.lowPayment ?? guidance.medianPayment!),
                          Formatters.money(context, guidance.highPayment ?? guidance.medianPayment!),
                        )}',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 2),
                      Text(context.l10n.priceGuidanceSample(guidance.sampleSize),
                          style: TextStyle(color: cs.onSurfaceVariant, fontSize: 11.5)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
