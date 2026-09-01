import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../l10n/l10n_x.dart';

class AsyncView<T> extends StatelessWidget {
  const AsyncView({
    super.key,
    required this.value,
    required this.data,
    this.onRetry,
  });

  final AsyncValue<T> value;
  final Widget Function(T data) data;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return value.when(
      data: data,
      loading: () => Center(child: Padding(
        padding: const EdgeInsets.all(32),
        child: CircularProgressIndicator(color: cs.primary),
      )),
      error: (error, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline, color: cs.error, size: 40),
              const SizedBox(height: 12),
              Text('$error', textAlign: TextAlign.center, style: TextStyle(color: cs.onSurfaceVariant)),
              if (onRetry != null) ...[
                const SizedBox(height: 16),
                OutlinedButton(onPressed: onRetry, child: Text(context.l10n.retryAction)),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
