import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api_config.dart';
import '../../core/api_exception.dart';
import '../../core/formatters.dart';
import '../../l10n/l10n_x.dart';
import '../../models/job.dart';
import '../../state/app_settings_provider.dart';
import '../../state/core_providers.dart';
import '../../state/job_providers.dart';
import '../../widgets/async_view.dart';
import '../../widgets/status_badge.dart';
import '../../widgets/user_avatar.dart';

class JobDetailScreen extends ConsumerWidget {
  const JobDetailScreen({super.key, required this.jobId});

  final int jobId;

  Future<void> _call(BuildContext context, String phone) async {
    final uri = Uri(scheme: 'tel', path: phone);
    if (!await launchUrl(uri)) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.l10n.callFailedError(phone))),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final jobAsync = ref.watch(jobDetailProvider(jobId));
    // Read once so the app bar style, body, and bottom bar all agree on the same
    // loaded-or-not state within a single build — the hero header needs a
    // transparent app bar floating over it, but the loading/error states need a
    // normal opaque one with a title.
    final job = jobAsync.valueOrNull;

    return Scaffold(
      extendBodyBehindAppBar: job != null,
      appBar: AppBar(
        backgroundColor: job != null ? Colors.transparent : null,
        foregroundColor: job != null ? Colors.white : null,
        elevation: 0,
        title: job == null ? Text(context.l10n.jobDetailTitle) : null,
      ),
      body: AsyncView(
        value: jobAsync,
        onRetry: () => ref.invalidate(jobDetailProvider(jobId)),
        data: (job) => _JobDetailBody(job: job),
      ),
      bottomNavigationBar: job == null
          ? null
          : Container(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(22)),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 20, offset: const Offset(0, -6))],
              ),
              child: job.unlocked && job.employerPhone != null
                  ? ElevatedButton.icon(
                      onPressed: () => _call(context, job.employerPhone!),
                      icon: const Icon(Icons.call, color: Colors.white),
                      label: Text(context.l10n.contactPhoneValue(job.employerPhone!)),
                    )
                  : _UnlockContactCard(jobId: jobId),
            ),
    );
  }
}

class _JobDetailBody extends StatelessWidget {
  const _JobDetailBody({required this.job});

  final Job job;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return ListView(
      padding: EdgeInsets.zero,
      children: [
        _JobHeader(job: job),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(job.title, style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w800, height: 1.25)),
                  ),
                  const SizedBox(width: 10),
                  StatusBadge(status: job.status),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 18,
                runSpacing: 8,
                children: [
                  _InfoRow(icon: Icons.location_on_outlined, text: job.location),
                  _InfoRow(icon: Icons.badge_outlined, text: job.professionName),
                ],
              ),
              const SizedBox(height: 22),
              _PriceCard(job: job),
              const SizedBox(height: 14),
              Card(
                margin: EdgeInsets.zero,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: _StatColumn(
                          icon: Icons.category_outlined,
                          label: context.l10n.jobTypeLabel,
                          value: job.jobType.label(context),
                        ),
                      ),
                      Expanded(
                        child: _StatColumn(
                          icon: Icons.groups_outlined,
                          label: context.l10n.workersNeededLabel,
                          value: '${job.workersNeeded}',
                        ),
                      ),
                      if (job.durationLabel(context) != null)
                        Expanded(
                          child: _StatColumn(
                            icon: Icons.schedule,
                            label: context.l10n.durationLabel,
                            value: job.durationLabel(context)!,
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              if (job.startDate != null) ...[
                const SizedBox(height: 14),
                _InfoRow(
                  icon: Icons.event_outlined,
                  text: context.l10n.startDateValue(Formatters.date(job.startDate!)),
                ),
              ],
              const SizedBox(height: 28),
              Text(context.l10n.descriptionLabel, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: cs.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(job.description, style: const TextStyle(height: 1.5)),
              ),
              const SizedBox(height: 28),
              Text(context.l10n.employerLabel, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: cs.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    UserAvatar(url: job.employerAvatarUrl, name: job.employerName, radius: 24),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(job.employerName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _JobHeader extends StatefulWidget {
  const _JobHeader({required this.job});

  final Job job;

  @override
  State<_JobHeader> createState() => _JobHeaderState();
}

class _JobHeaderState extends State<_JobHeader> {
  final _controller = PageController();
  int _page = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _openViewer(BuildContext context, int index) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => _ImageViewerScreen(images: widget.job.images, initialIndex: index),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final images = widget.job.images;

    if (images.isEmpty) {
      return Container(
        height: 200,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [cs.primary, Color.lerp(cs.primary, Colors.black, 0.35)!],
          ),
        ),
        child: Center(
          child: Icon(Icons.work_outline, size: 68, color: Colors.white.withValues(alpha: 0.35)),
        ),
      );
    }

    return SizedBox(
      height: 260,
      child: Stack(
        fit: StackFit.expand,
        children: [
          PageView.builder(
            controller: _controller,
            itemCount: images.length,
            onPageChanged: (i) => setState(() => _page = i),
            itemBuilder: (context, i) => GestureDetector(
              onTap: () => _openViewer(context, i),
              child: CachedNetworkImage(
                imageUrl: ApiConfig.resolveMediaUrl(images[i].url),
                fit: BoxFit.cover,
              ),
            ),
          ),
          IgnorePointer(
            child: Container(
              alignment: Alignment.bottomCenter,
              height: 90,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, Colors.black.withValues(alpha: 0.4)],
                ),
              ),
            ),
          ),
          if (images.length > 1)
            Positioned(
              bottom: 14,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(images.length, (i) {
                  final active = i == _page;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    width: active ? 18 : 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: active ? 0.95 : 0.5),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  );
                }),
              ),
            ),
        ],
      ),
    );
  }
}

class _PriceCard extends StatelessWidget {
  const _PriceCard({required this.job});

  final Job job;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 20),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [cs.primary, Color.lerp(cs.primary, Colors.black, 0.18)!]),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: cs.primary.withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, 8))],
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.18), shape: BoxShape.circle),
            child: const Icon(Icons.payments_outlined, color: Colors.white, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  Formatters.money(context, job.payment),
                  style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 2),
                Text(
                  job.paymentType.label(context),
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 12.5, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 17, color: cs.onSurfaceVariant),
        const SizedBox(width: 6),
        Text(text, style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13.5)),
      ],
    );
  }
}

class _UnlockContactCard extends ConsumerStatefulWidget {
  const _UnlockContactCard({required this.jobId});

  final int jobId;

  @override
  ConsumerState<_UnlockContactCard> createState() => _UnlockContactCardState();
}

class _UnlockContactCardState extends ConsumerState<_UnlockContactCard> {
  bool _unlocking = false;

  Future<void> _unlock() async {
    setState(() => _unlocking = true);
    try {
      await ref.read(jobRepositoryProvider).unlock(widget.jobId);
      ref.invalidate(jobDetailProvider(widget.jobId));
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.errorCode == 'INSUFFICIENT_BALANCE') {
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
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _unlocking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final settings = ref.watch(appSettingsProvider).valueOrNull;
    final fee = settings?.jobViewFee ?? 0;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.primaryContainer.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cs.primary.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.lock_outline, color: cs.primary, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(context.l10n.contactLockedTitle,
                    style: TextStyle(fontWeight: FontWeight.w700, color: cs.primary, fontSize: 14.5)),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(context.l10n.contactLockedHint, style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13, height: 1.4)),
          const SizedBox(height: 14),
          ElevatedButton.icon(
            onPressed: _unlocking ? null : _unlock,
            icon: _unlocking
                ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.lock_open, color: Colors.white, size: 18),
            label: Text(context.l10n.unlockForFeeAction(Formatters.money(context, fee))),
          ),
        ],
      ),
    );
  }
}

class _ImageViewerScreen extends StatelessWidget {
  const _ImageViewerScreen({required this.images, required this.initialIndex});

  final List<JobImage> images;
  final int initialIndex;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(backgroundColor: Colors.black, iconTheme: const IconThemeData(color: Colors.white)),
      body: PageView.builder(
        controller: PageController(initialPage: initialIndex),
        itemCount: images.length,
        itemBuilder: (context, index) => InteractiveViewer(
          child: Center(
            child: CachedNetworkImage(imageUrl: ApiConfig.resolveMediaUrl(images[index].url)),
          ),
        ),
      ),
    );
  }
}

class _StatColumn extends StatelessWidget {
  const _StatColumn({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Column(
      children: [
        Icon(icon, color: cs.primary, size: 22),
        const SizedBox(height: 6),
        Text(value, textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
        const SizedBox(height: 2),
        Text(label, textAlign: TextAlign.center, style: TextStyle(color: cs.onSurfaceVariant, fontSize: 11)),
      ],
    );
  }
}
