import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../l10n/l10n_x.dart';
import '../state/auth_provider.dart';

class AdminNoticeScreen extends ConsumerWidget {
  const AdminNoticeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.admin_panel_settings_outlined, size: 56, color: cs.primary),
                const SizedBox(height: 16),
                Text(
                  context.l10n.adminNotAvailableTitle,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                Text(
                  context.l10n.adminNotAvailableMessage,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: cs.onSurfaceVariant),
                ),
                const SizedBox(height: 24),
                OutlinedButton(
                  onPressed: () => ref.read(authNotifierProvider.notifier).logout(),
                  child: Text(context.l10n.logoutAction),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
