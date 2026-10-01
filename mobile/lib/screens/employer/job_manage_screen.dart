import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_exception.dart';
import '../../core/formatters.dart';
import '../../l10n/l10n_x.dart';
import '../../models/enums.dart';
import '../../state/core_providers.dart';
import '../../state/job_providers.dart';
import '../../widgets/async_view.dart';
import '../../widgets/status_badge.dart';

class JobManageScreen extends ConsumerStatefulWidget {
  const JobManageScreen({super.key, required this.jobId});

  final int jobId;

  @override
  ConsumerState<JobManageScreen> createState() => _JobManageScreenState();
}

class _JobManageScreenState extends ConsumerState<JobManageScreen> {
  bool _busy = false;

  void _invalidateAll() {
    ref.invalidate(jobDetailProvider(widget.jobId));
    for (final s in [null, ...JobStatus.values]) {
      ref.invalidate(myJobsProvider(s));
    }
  }

  Future<void> _changeStatus(JobStatus status) async {
    setState(() => _busy = true);
    try {
      await ref.read(jobRepositoryProvider).changeStatus(widget.jobId, status);
      _invalidateAll();
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  /// Posts the same job again as a fresh listing. Confirmed first, because it costs the posting fee
  /// where that is switched on.
  Future<void> _repost() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(dialogContext.l10n.repostAction),
        content: Text(dialogContext.l10n.repostConfirmBody),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: Text(dialogContext.l10n.commonCancel),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: Text(dialogContext.l10n.repostAction),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _busy = true);
    try {
      final created = await ref.read(jobRepositoryProvider).repost(widget.jobId);
      _invalidateAll();
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(context.l10n.repostedSuccess)));
      context.push('/employer/jobs/${created.id}/manage');
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _delete() async {
    final cs = Theme.of(context).colorScheme;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(context.l10n.deleteJobConfirmTitle),
        content: Text(context.l10n.deleteJobConfirmMessage),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(context.l10n.commonCancel)),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(context.l10n.deleteAction, style: TextStyle(color: cs.error)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _busy = true);
    try {
      await ref.read(jobRepositoryProvider).delete(widget.jobId);
      _invalidateAll();
      if (mounted) context.pop();
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final jobAsync = ref.watch(jobDetailProvider(widget.jobId));

    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.manageJobTitle)),
      body: AsyncView(
        value: jobAsync,
        onRetry: () => ref.invalidate(jobDetailProvider(widget.jobId)),
        data: (job) => ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Row(
              children: [
                Expanded(child: Text(job.title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800))),
                StatusBadge(status: job.status),
              ],
            ),
            const SizedBox(height: 8),
            Text('${job.regionName}, ${job.districtName}', style: TextStyle(color: cs.onSurfaceVariant)),
            const SizedBox(height: 4),
            Text(Formatters.money(context, job.payment),
                style: TextStyle(color: cs.primary, fontWeight: FontWeight.w700, fontSize: 16)),
            const SizedBox(height: 16),
            Text(job.description, style: const TextStyle(height: 1.4)),
            const SizedBox(height: 28),
            Text(context.l10n.actionsLabel, style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                // First, because the shortlist is the point of the posting — everything else here is
                // housekeeping around it.
                FilledButton.icon(
                  onPressed: _busy ? null : () => context.push('/employer/jobs/${job.id}/applications'),
                  icon: const Icon(Icons.people_outline),
                  label: Text((job.applicationCount ?? 0) > 0
                      ? '${context.l10n.shortlistTitle} · ${job.applicationCount}'
                      : context.l10n.shortlistTitle),
                ),
                OutlinedButton.icon(
                  onPressed: _busy ? null : () => context.push('/employer/jobs/${job.id}/edit'),
                  icon: const Icon(Icons.edit_outlined),
                  label: Text(context.l10n.editAction),
                ),
                OutlinedButton.icon(
                  onPressed: _busy ? null : _repost,
                  icon: const Icon(Icons.copy_all_outlined),
                  label: Text(context.l10n.repostAction),
                ),
                if (job.status == JobStatus.active) ...[
                  FilledButton.tonalIcon(
                    onPressed: _busy ? null : () => _changeStatus(JobStatus.inProgress),
                    icon: const Icon(Icons.play_arrow_outlined),
                    label: Text(context.l10n.moveToInProgressAction),
                  ),
                  FilledButton.tonalIcon(
                    onPressed: _busy ? null : () => _changeStatus(JobStatus.completed),
                    icon: const Icon(Icons.check_circle_outline),
                    label: Text(context.l10n.completeAction),
                  ),
                  OutlinedButton.icon(
                    onPressed: _busy ? null : () => _changeStatus(JobStatus.cancelled),
                    icon: Icon(Icons.cancel_outlined, color: cs.error),
                    label: Text(context.l10n.cancelJobAction, style: TextStyle(color: cs.error)),
                  ),
                ],
                if (job.status == JobStatus.inProgress) ...[
                  FilledButton.tonalIcon(
                    onPressed: _busy ? null : () => _changeStatus(JobStatus.completed),
                    icon: const Icon(Icons.check_circle_outline),
                    label: Text(context.l10n.completeAction),
                  ),
                  OutlinedButton.icon(
                    onPressed: _busy ? null : () => _changeStatus(JobStatus.cancelled),
                    icon: Icon(Icons.cancel_outlined, color: cs.error),
                    label: Text(context.l10n.cancelJobAction, style: TextStyle(color: cs.error)),
                  ),
                ],
                if (job.status == JobStatus.cancelled || job.status == JobStatus.expired)
                  FilledButton.tonalIcon(
                    onPressed: _busy ? null : () => _changeStatus(JobStatus.active),
                    icon: const Icon(Icons.refresh),
                    label: Text(context.l10n.reactivateAction),
                  ),
                OutlinedButton.icon(
                  onPressed: _busy ? null : _delete,
                  icon: Icon(Icons.delete_outline, color: cs.error),
                  label: Text(context.l10n.deleteAction, style: TextStyle(color: cs.error)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
