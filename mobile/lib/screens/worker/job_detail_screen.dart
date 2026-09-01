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
    final cs = Theme.of(context).colorScheme;
    final jobAsync = ref.watch(jobDetailProvider(jobId));

    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.jobDetailTitle)),
      body: AsyncView(
        value: jobAsync,
        onRetry: () => ref.invalidate(jobDetailProvider(jobId)),
        data: (job) => ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(job.title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                ),
                StatusBadge(status: job.status),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(Icons.location_on_outlined, size: 18, color: cs.onSurfaceVariant),
                const SizedBox(width: 6),
                Text(job.location, style: TextStyle(color: cs.onSurfaceVariant)),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(Icons.badge_outlined, size: 18, color: cs.onSurfaceVariant),
                const SizedBox(width: 6),
                Text(job.professionName, style: TextStyle(color: cs.onSurfaceVariant)),
              ],
            ),
            if (job.images.isNotEmpty) ...[
              const SizedBox(height: 16),
              _JobImagesGallery(images: job.images),
            ],
            const SizedBox(height: 20),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: _StatColumn(
                        icon: Icons.payments_outlined,
                        label: job.paymentType.label(context),
                        value: Formatters.money(context, job.payment),
                      ),
                    ),
                    Expanded(
                      child: _StatColumn(
                        icon: Icons.category_outlined,
                        label: context.l10n.jobTypeLabel,
                        value: job.jobType.label(context),
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
            const SizedBox(height: 20),
            if (job.startDate != null) ...[
              Text(context.l10n.startDateValue(Formatters.date(job.startDate!)),
                  style: TextStyle(color: cs.onSurfaceVariant)),
              const SizedBox(height: 8),
            ],
            Text(context.l10n.workersNeededValue(job.workersNeeded),
                style: TextStyle(color: cs.onSurfaceVariant)),
            const SizedBox(height: 20),
            Text(context.l10n.descriptionLabel, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
            const SizedBox(height: 8),
            Text(job.description, style: const TextStyle(height: 1.5)),
            const SizedBox(height: 28),
            Text(context.l10n.employerLabel, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
            const SizedBox(height: 10),
            Row(
              children: [
                UserAvatar(url: job.employerAvatarUrl, name: job.employerName, radius: 24),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(job.employerName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                ),
              ],
            ),
            const SizedBox(height: 24),
            if (job.unlocked && job.employerPhone != null)
              ElevatedButton.icon(
                onPressed: () => _call(context, job.employerPhone!),
                icon: const Icon(Icons.call, color: Colors.white),
                label: Text(context.l10n.contactPhoneValue(job.employerPhone!)),
              )
            else
              _UnlockContactCard(jobId: jobId),
          ],
        ),
      ),
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
      padding: const EdgeInsets.all(18),
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

class _JobImagesGallery extends StatelessWidget {
  const _JobImagesGallery({required this.images});

  final List<JobImage> images;

  void _openViewer(BuildContext context, int initialIndex) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => _ImageViewerScreen(images: images, initialIndex: initialIndex),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 120,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: images.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (context, index) => GestureDetector(
          onTap: () => _openViewer(context, index),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: CachedNetworkImage(
              imageUrl: ApiConfig.resolveMediaUrl(images[index].url),
              width: 120,
              height: 120,
              fit: BoxFit.cover,
            ),
          ),
        ),
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
