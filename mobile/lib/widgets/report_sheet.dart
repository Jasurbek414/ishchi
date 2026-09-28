import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/api_exception.dart';
import '../l10n/l10n_x.dart';
import '../models/enums.dart';
import '../state/core_providers.dart';

/// Reports a posting or a person to the moderators.
///
/// There was no way to flag a fake posting or an abusive employer at all — moderation depended on an
/// admin happening to notice — so this is deliberately reachable from wherever the problem is seen.
class ReportSheet extends ConsumerStatefulWidget {
  const ReportSheet({super.key, this.jobId, this.reportedUserId, required this.subtitle})
      : assert(jobId != null || reportedUserId != null, 'a report needs a target');

  final int? jobId;
  final int? reportedUserId;
  final String subtitle;

  /// Returns true when a report was sent.
  static Future<bool> show(
    BuildContext context, {
    int? jobId,
    int? reportedUserId,
    required String subtitle,
  }) async {
    final sent = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: ReportSheet(jobId: jobId, reportedUserId: reportedUserId, subtitle: subtitle),
      ),
    );
    return sent ?? false;
  }

  @override
  ConsumerState<ReportSheet> createState() => _ReportSheetState();
}

class _ReportSheetState extends ConsumerState<ReportSheet> {
  final _detailsController = TextEditingController();
  ReportReason _reason = ReportReason.fakeJob;
  bool _sending = false;
  String? _error;

  Future<void> _submit() async {
    setState(() {
      _sending = true;
      _error = null;
    });
    try {
      await ref.read(reportRepositoryProvider).submit(
            jobId: widget.jobId,
            reportedUserId: widget.reportedUserId,
            reason: _reason,
            details: _detailsController.text,
          );
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  void dispose() {
    _detailsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(context.l10n.reportTitle,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(widget.subtitle, style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13)),
          const SizedBox(height: 16),
          DropdownButtonFormField<ReportReason>(
            value: _reason,
            decoration: InputDecoration(labelText: context.l10n.reportReasonFieldLabel),
            items: [
              for (final reason in ReportReason.values)
                DropdownMenuItem(value: reason, child: Text(reason.label(context))),
            ],
            onChanged: _sending ? null : (value) => setState(() => _reason = value ?? _reason),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _detailsController,
            maxLines: 4,
            maxLength: 1000,
            decoration: InputDecoration(labelText: context.l10n.reportDetailsHint),
          ),
          if (_error != null) ...[
            Text(_error!, style: TextStyle(color: cs.error, fontSize: 13)),
            const SizedBox(height: 8),
          ],
          ElevatedButton(
            onPressed: _sending ? null : _submit,
            child: _sending
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : Text(context.l10n.reportSubmitAction),
          ),
        ],
      ),
    );
  }
}
