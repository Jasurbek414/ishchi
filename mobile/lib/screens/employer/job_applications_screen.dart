import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api_config.dart';
import '../../core/api_exception.dart';
import '../../l10n/l10n_x.dart';
import '../../models/enums.dart';
import '../../models/job_application.dart';
import '../../state/application_providers.dart';
import '../../state/core_providers.dart';
import '../../state/job_providers.dart';
import '../../widgets/async_view.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/rate_dialog.dart';
import '../../widgets/trust_badges.dart';
import '../../widgets/user_avatar.dart';

/// The workers who responded to one job.
///
/// This is the shortlist the employer works from, and the reason the phone number is shown here
/// while a general worker listing withholds it: these people asked to be called about this job.
class JobApplicationsScreen extends ConsumerWidget {
  const JobApplicationsScreen({super.key, required this.jobId});

  final int jobId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final applicationsAsync = ref.watch(jobApplicationsProvider(jobId));
    final jobAsync = ref.watch(jobDetailProvider(jobId));

    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.shortlistTitle)),
      body: AsyncView(
        value: applicationsAsync,
        onRetry: () => ref.invalidate(jobApplicationsProvider(jobId)),
        data: (applications) {
          if (applications.isEmpty) {
            return EmptyState(
              icon: Icons.people_outline,
              message: context.l10n.noResponsesYet,
            );
          }
          final jobIsFinished = jobAsync.valueOrNull?.status == JobStatus.completed;
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: applications.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (_, index) => _ApplicationCard(
              jobId: jobId,
              application: applications[index],
              canRate: jobIsFinished,
            ),
          );
        },
      ),
    );
  }
}

class _ApplicationCard extends ConsumerStatefulWidget {
  const _ApplicationCard({required this.jobId, required this.application, required this.canRate});

  final int jobId;
  final JobApplication application;
  final bool canRate;

  @override
  ConsumerState<_ApplicationCard> createState() => _ApplicationCardState();
}

class _ApplicationCardState extends ConsumerState<_ApplicationCard> {
  bool _busy = false;

  Future<void> _decide(ApplicationStatus status) async {
    setState(() => _busy = true);
    try {
      await ref.read(jobApplicationRepositoryProvider)
          .decide(widget.jobId, widget.application.workerId, status);
      ref.invalidate(jobApplicationsProvider(widget.jobId));
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(status == ApplicationStatus.hired
            ? context.l10n.hiredSuccess
            : context.l10n.declinedSuccess),
      ));
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _call(String phone) async {
    final uri = Uri(scheme: 'tel', path: phone);
    if (!await launchUrl(uri)) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(context.l10n.callFailedError(phone))));
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final a = widget.application;
    final decided = a.status != ApplicationStatus.interested;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                UserAvatar(
                  url: a.workerAvatarUrl == null ? null : ApiConfig.resolveMediaUrl(a.workerAvatarUrl!),
                  name: a.workerName ?? '',
                  radius: 24,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(a.workerName ?? '—',
                          style: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w700)),
                      if (a.professions.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(a.professions.join(', '),
                            style: TextStyle(color: cs.primary, fontSize: 13, fontWeight: FontWeight.w600)),
                      ],
                      if (a.verified || a.hasRating) ...[
                        const SizedBox(height: 6),
                        Wrap(spacing: 6, runSpacing: 6, children: [
                          if (a.verified) const VerifiedBadge(),
                          RatingBadge(average: a.ratingAverage, count: a.ratingCount ?? 0),
                        ]),
                      ],
                    ],
                  ),
                ),
                if (decided)
                  Chip(
                    label: Text(a.status.label(context), style: const TextStyle(fontSize: 11.5)),
                    visualDensity: VisualDensity.compact,
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (a.workerPhone != null)
                  OutlinedButton.icon(
                    onPressed: () => _call(a.workerPhone!),
                    icon: const Icon(Icons.call, size: 18),
                    label: Text(a.workerPhone!),
                  ),
                if (!decided) ...[
                  FilledButton.icon(
                    onPressed: _busy ? null : () => _decide(ApplicationStatus.hired),
                    icon: const Icon(Icons.check, size: 18),
                    label: Text(context.l10n.hireAction),
                  ),
                  TextButton(
                    onPressed: _busy ? null : () => _decide(ApplicationStatus.declined),
                    child: Text(context.l10n.declineAction),
                  ),
                ],
                // Rating is only offered once the job is finished and this worker was the one hired,
                // which is exactly what the server will accept.
                if (widget.canRate && a.status == ApplicationStatus.hired)
                  OutlinedButton.icon(
                    onPressed: () => RateDialog.show(
                      context,
                      jobId: widget.jobId,
                      rateeUserId: a.workerId,
                      subtitle: a.workerName ?? a.jobTitle,
                    ).then((saved) {
                      if (saved && context.mounted) {
                        ref.invalidate(jobApplicationsProvider(widget.jobId));
                        ScaffoldMessenger.of(context)
                            .showSnackBar(SnackBar(content: Text(context.l10n.ratingSavedSuccess)));
                      }
                    }),
                    icon: const Icon(Icons.star_outline, size: 18),
                    label: Text(context.l10n.rateAction),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
