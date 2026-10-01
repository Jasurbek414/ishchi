import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/api_exception.dart';
import '../l10n/l10n_x.dart';
import '../state/core_providers.dart';

/// Leaves a score for the other side of a finished job.
///
/// The server only accepts it when the application record says these two actually worked together,
/// so the dialog does not have to police that — it reports what comes back.
class RateDialog extends ConsumerStatefulWidget {
  const RateDialog({
    super.key,
    required this.jobId,
    required this.rateeUserId,
    required this.subtitle,
  });

  final int jobId;
  final int rateeUserId;

  /// Who or what is being rated, shown under the title.
  final String subtitle;

  /// Returns true when a rating was saved.
  static Future<bool> show(
    BuildContext context, {
    required int jobId,
    required int rateeUserId,
    required String subtitle,
  }) async {
    final saved = await showDialog<bool>(
      context: context,
      builder: (_) => RateDialog(jobId: jobId, rateeUserId: rateeUserId, subtitle: subtitle),
    );
    return saved ?? false;
  }

  @override
  ConsumerState<RateDialog> createState() => _RateDialogState();
}

class _RateDialogState extends ConsumerState<RateDialog> {
  final _commentController = TextEditingController();
  int _score = 0;
  bool _saving = false;
  String? _error;

  Future<void> _submit() async {
    if (_score == 0) {
      setState(() => _error = context.l10n.rateScoreRequired);
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await ref.read(ratingRepositoryProvider).rate(
            jobId: widget.jobId,
            rateeUserId: widget.rateeUserId,
            score: _score,
            comment: _commentController.text,
          );
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return AlertDialog(
      title: Text(context.l10n.rateTitle),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(widget.subtitle, style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13)),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              for (var star = 1; star <= 5; star++)
                IconButton(
                  onPressed: _saving ? null : () => setState(() => _score = star),
                  // A big enough target to hit on a phone, with the count also announced below.
                  iconSize: 34,
                  visualDensity: VisualDensity.compact,
                  icon: Icon(
                    star <= _score ? Icons.star_rounded : Icons.star_outline_rounded,
                    color: star <= _score ? cs.primary : cs.onSurfaceVariant,
                  ),
                  tooltip: '$star',
                ),
            ],
          ),
          const SizedBox(height: 4),
          TextField(
            controller: _commentController,
            maxLines: 3,
            maxLength: 500,
            decoration: InputDecoration(labelText: context.l10n.rateCommentHint),
          ),
          if (_error != null) ...[
            const SizedBox(height: 4),
            Text(_error!, style: TextStyle(color: cs.error, fontSize: 13)),
          ],
        ],
      ),
      actions: [
        TextButton(
          onPressed: _saving ? null : () => Navigator.of(context).pop(false),
          child: Text(context.l10n.commonCancel),
        ),
        FilledButton(
          onPressed: _saving ? null : _submit,
          child: _saving
              ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
              : Text(context.l10n.rateSubmitAction),
        ),
      ],
    );
  }
}
