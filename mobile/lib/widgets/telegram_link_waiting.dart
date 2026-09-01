import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../l10n/l10n_x.dart';
import '../state/core_providers.dart';

/// Shown when the backend says a code can't be sent yet because this phone isn't linked to
/// a Telegram chat. Lets the user open the bot, then polls until the backend reports the
/// link is complete (at which point it has already sent the code via Telegram).
class TelegramLinkWaiting extends ConsumerStatefulWidget {
  const TelegramLinkWaiting({super.key, required this.phone, required this.linkUrl, required this.onLinked});

  final String phone;
  final String linkUrl;
  final VoidCallback onLinked;

  @override
  ConsumerState<TelegramLinkWaiting> createState() => _TelegramLinkWaitingState();
}

class _TelegramLinkWaitingState extends ConsumerState<TelegramLinkWaiting> {
  Timer? _timer;
  bool _opened = false;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 2), (_) => _check());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _check() async {
    try {
      final linked = await ref.read(authRepositoryProvider).telegramLinkStatus(widget.phone);
      if (linked && mounted) {
        _timer?.cancel();
        widget.onLinked();
      }
    } catch (_) {
      // transient network hiccup — keep polling silently
    }
  }

  Future<void> _open() async {
    setState(() => _opened = true);
    await launchUrl(Uri.parse(widget.linkUrl), mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(context.l10n.openTelegramBotTitle, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        Text(
          context.l10n.openTelegramBotHint,
          style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant, height: 1.4),
        ),
        const SizedBox(height: 20),
        ElevatedButton.icon(
          onPressed: _open,
          icon: const Icon(Icons.send_rounded),
          label: Text(context.l10n.openInTelegramAction),
        ),
        if (_opened) ...[
          const SizedBox(height: 20),
          Row(
            children: [
              const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2)),
              const SizedBox(width: 10),
              Text(context.l10n.waitingEllipsis, style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant)),
            ],
          ),
        ],
      ],
    );
  }
}
