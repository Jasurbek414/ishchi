import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/api_exception.dart';
import '../core/formatters.dart';
import '../l10n/l10n_x.dart';
import '../models/job.dart';
import '../state/app_settings_provider.dart';
import '../state/core_providers.dart';
import '../state/wallet_provider.dart';

/// Call this before navigating from a job card to the job detail screen. If a
/// view fee is configured and this job isn't unlocked yet, it shows a payment
/// sheet up front instead of letting the worker discover the paywall only after
/// the detail screen has already loaded. Returns true once it's safe to navigate
/// (already unlocked, no fee configured, or the payment just succeeded).
Future<bool> confirmJobUnlock(BuildContext context, WidgetRef ref, Job job) async {
  final settings = ref.read(appSettingsProvider).valueOrNull;
  if (job.unlocked || settings?.jobViewFeeEnabled != true) return true;

  final result = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
    builder: (_) => _UnlockJobSheet(job: job),
  );
  return result ?? false;
}

class _UnlockJobSheet extends ConsumerStatefulWidget {
  const _UnlockJobSheet({required this.job});

  final Job job;

  @override
  ConsumerState<_UnlockJobSheet> createState() => _UnlockJobSheetState();
}

class _UnlockJobSheetState extends ConsumerState<_UnlockJobSheet> {
  bool _paying = false;

  Future<void> _pay() async {
    setState(() => _paying = true);
    try {
      await ref.read(jobRepositoryProvider).unlock(widget.job.id);
      ref.invalidate(walletProvider);
      if (mounted) Navigator.pop(context, true);
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.errorCode == 'INSUFFICIENT_BALANCE') {
        Navigator.pop(context, false);
        showDialog<void>(
          context: context,
          builder: (dialogContext) => AlertDialog(
            title: Text(context.l10n.insufficientBalanceTitle),
            content: Text(e.message),
            actions: [
              TextButton(onPressed: () => Navigator.pop(dialogContext), child: Text(context.l10n.commonClose)),
              FilledButton(
                onPressed: () {
                  Navigator.pop(dialogContext);
                  context.push('/profile/wallet');
                },
                child: Text(context.l10n.topUpWalletAction),
              ),
            ],
          ),
        );
      } else {
        setState(() => _paying = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final settings = ref.watch(appSettingsProvider).valueOrNull;
    final walletAsync = ref.watch(walletProvider);
    final fee = settings?.jobViewFee ?? 0;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 14, 24, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(color: cs.outlineVariant, borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 22),
            Center(
              child: Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(color: cs.primaryContainer, shape: BoxShape.circle),
                child: Icon(Icons.lock_outline, color: cs.primary, size: 28),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              context.l10n.unlockJobSheetTitle,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 6),
            Text(
              widget.job.title,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13.5, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 10),
            Text(
              context.l10n.unlockJobSheetMessage,
              textAlign: TextAlign.center,
              style: TextStyle(color: cs.onSurfaceVariant, height: 1.4),
            ),
            const SizedBox(height: 22),
            Container(
              padding: const EdgeInsets.symmetric(vertical: 18),
              decoration: BoxDecoration(color: cs.surfaceContainerHighest, borderRadius: BorderRadius.circular(16)),
              child: Column(
                children: [
                  Text(
                    Formatters.money(context, fee),
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: cs.primary),
                  ),
                  if (walletAsync.hasValue) ...[
                    const SizedBox(height: 6),
                    Text(
                      context.l10n.unlockJobBalanceLabel(Formatters.money(context, walletAsync.value!.balance)),
                      style: TextStyle(color: cs.onSurfaceVariant, fontSize: 12.5),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 22),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _paying ? null : () => Navigator.pop(context, false),
                    child: Text(context.l10n.commonCancel),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: FilledButton(
                    onPressed: _paying ? null : _pay,
                    child: _paying
                        ? const SizedBox(
                            height: 18,
                            width: 18,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : Text(context.l10n.unlockForFeeAction(Formatters.money(context, fee))),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
