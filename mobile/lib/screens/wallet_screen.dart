import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../core/api_exception.dart';
import '../core/formatters.dart';
import '../core/theme.dart';
import '../l10n/l10n_x.dart';
import '../models/wallet.dart';
import '../state/wallet_provider.dart';
import '../widgets/async_view.dart';
import '../widgets/empty_state.dart';

class WalletScreen extends ConsumerStatefulWidget {
  const WalletScreen({super.key});

  @override
  ConsumerState<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends ConsumerState<WalletScreen> {
  bool _topUpBusy = false;

  Future<void> _openTopUpSheet() async {
    final amount = await showModalBottomSheet<num>(
      context: context,
      isScrollControlled: true,
      builder: (_) => const _TopUpSheet(),
    );
    if (amount == null) return;
    setState(() => _topUpBusy = true);
    try {
      await ref.read(walletProvider.notifier).topUp(amount);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.l10n.walletTopUpSuccess(Formatters.money(context, amount)))),
        );
      }
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _topUpBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final walletAsync = ref.watch(walletProvider);
    final transactionsAsync = ref.watch(walletTransactionsProvider);

    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.walletScreenTitle)),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(walletProvider);
          ref.invalidate(walletTransactionsProvider);
          await ref.read(walletProvider.future);
        },
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            AsyncView(
              value: walletAsync,
              onRetry: () => ref.invalidate(walletProvider),
              data: (wallet) => _BalanceCard(
                balance: wallet.balance,
                busy: _topUpBusy,
                onTopUp: _openTopUpSheet,
              ),
            ),
            const SizedBox(height: 28),
            Text(context.l10n.transactionsHistoryTitle, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
            const SizedBox(height: 12),
            AsyncView(
              value: transactionsAsync,
              onRetry: () => ref.invalidate(walletTransactionsProvider),
              data: (page) {
                if (page.content.isEmpty) {
                  return EmptyState(message: context.l10n.noTransactionsYet, icon: PhosphorIcons.receipt());
                }
                return Column(
                  children: [
                    for (final tx in page.content) ...[
                      _TransactionTile(tx: tx),
                      const SizedBox(height: 10),
                    ],
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _BalanceCard extends StatelessWidget {
  const _BalanceCard({required this.balance, required this.busy, required this.onTopUp});

  final num balance;
  final bool busy;
  final VoidCallback onTopUp;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final hsl = HSLColor.fromColor(cs.primary);
    final lighter = hsl.withLightness((hsl.lightness + 0.20).clamp(0.0, 1.0)).toColor();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [lighter, cs.primary],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: cs.primary.withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, 10)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(PhosphorIcons.wallet(PhosphorIconsStyle.fill), color: Colors.white, size: 22),
              const SizedBox(width: 8),
              Text(context.l10n.balanceLabel, style: const TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            Formatters.money(context, balance),
            style: const TextStyle(color: Colors.white, fontSize: 30, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: busy ? null : onTopUp,
              icon: busy
                  ? SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2, color: cs.primary))
                  : Icon(PhosphorIcons.plusCircle(), color: cs.primary, size: 20),
              label: Text(context.l10n.walletTopUpAction),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: cs.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TransactionTile extends StatelessWidget {
  const _TransactionTile({required this.tx});

  final WalletTransaction tx;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final color = tx.isCredit ? context.themeSuccess : cs.error;
    final icon = tx.isCredit ? PhosphorIcons.arrowDown() : PhosphorIcons.arrowUp();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.12), shape: BoxShape.circle),
              child: Icon(icon, color: color, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(tx.type.label(context), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5)),
                  const SizedBox(height: 2),
                  Text(Formatters.dateTime(tx.createdAt),
                      style: TextStyle(color: cs.onSurfaceVariant, fontSize: 11.5)),
                ],
              ),
            ),
            Text(
              '${tx.isCredit ? '+' : ''}${Formatters.money(context, tx.amount)}',
              style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 13.5),
            ),
          ],
        ),
      ),
    );
  }
}

class _TopUpSheet extends StatefulWidget {
  const _TopUpSheet();

  @override
  State<_TopUpSheet> createState() => _TopUpSheetState();
}

class _TopUpSheetState extends State<_TopUpSheet> {
  final _controller = TextEditingController();
  static const _presets = [50000, 100000, 200000, 500000];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: EdgeInsets.only(
        left: 20, right: 20, top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(context.l10n.walletTopUpAction, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          Text(
            context.l10n.walletTopUpNotice,
            style: TextStyle(fontSize: 12.5, color: cs.onSurfaceVariant, fontStyle: FontStyle.italic),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _controller,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(labelText: context.l10n.amountSomLabel),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _presets.map((p) {
              return ActionChip(
                label: Text(Formatters.money(context, p)),
                onPressed: () => setState(() => _controller.text = p.toString()),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: () {
              final amount = num.tryParse(_controller.text.trim());
              if (amount == null || amount < 1000) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(context.l10n.minAmountError)),
                );
                return;
              }
              Navigator.of(context).pop(amount);
            },
            child: Text(context.l10n.walletConfirmTopUpAction),
          ),
        ],
      ),
    );
  }
}
