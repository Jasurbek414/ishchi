import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../core/api_exception.dart';
import '../../core/theme.dart';
import '../../l10n/l10n_x.dart';
import '../../models/job.dart';
import '../../state/job_providers.dart';
import '../../state/profile_provider.dart';
import '../../state/promo_banner_providers.dart';
import '../../widgets/async_view.dart';
import '../../widgets/job_card.dart';
import '../../widgets/promo_banners.dart';
import '../../widgets/promo_carousel.dart';
import '../../widgets/app_bottom_nav.dart';
import '../../widgets/unlock_job_sheet.dart';

class WorkerHomeScreen extends ConsumerStatefulWidget {
  const WorkerHomeScreen({super.key, this.onSeeAllJobs});

  final VoidCallback? onSeeAllJobs;

  @override
  ConsumerState<WorkerHomeScreen> createState() => _WorkerHomeScreenState();
}

class _WorkerHomeScreenState extends ConsumerState<WorkerHomeScreen> {
  int? _quickProfessionId;
  bool _togglingAvailability = false;

  static const _previewCount = 5;

  String _greeting(BuildContext context) {
    final hour = DateTime.now().hour;
    if (hour < 6) return context.l10n.greetingNight;
    if (hour < 12) return context.l10n.greetingMorning;
    if (hour < 18) return context.l10n.greetingDay;
    return context.l10n.greetingEvening;
  }

  Future<void> _openJob(Job job) async {
    if (await confirmJobUnlock(context, ref, job)) {
      if (mounted) context.push('/worker/jobs/${job.id}');
    }
  }

  Future<void> _toggleAvailability(bool current) async {
    setState(() => _togglingAvailability = true);
    try {
      await ref.read(profileProvider.notifier).updateProfile(available: !current);
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _togglingAvailability = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final profileAsync = ref.watch(profileProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ishchi'),
        actions: [
          IconButton(
            icon: const Icon(Icons.map_outlined),
            tooltip: context.l10n.viewEmployersOnMapTooltip,
            onPressed: () => context.push('/worker/employers-map'),
          ),
        ],
      ),
      body: AsyncView(
        value: profileAsync,
        data: (profile) {
          final JobFilter filter = (
            regionId: null,
            districtId: null,
            professionId: _quickProfessionId,
            jobType: null,
            minPayment: null,
            maxPayment: null,
            search: null,
            sort: 'nearest',
            nearRegionId: profile.regionId,
            nearDistrictId: profile.districtId,
          );
          final jobsAsync = ref.watch(jobsSearchProvider(filter));
          final bannersAsync = ref.watch(promoBannersProvider((audience: 'WORKER', regionId: profile.regionId)));
          final apiBanners = bannersAsync.valueOrNull ?? const [];
          final banners = apiBanners.isNotEmpty
              ? PromoBanners.fromApi(context, ref, apiBanners)
              : PromoBanners.workerFor(context);
          final available = profile.available ?? true;

          return RefreshIndicator(
            onRefresh: () => ref.refresh(jobsSearchProvider(filter).future),
            child: ListView(
              padding: EdgeInsets.fromLTRB(16, 12, 16, 12 + bottomNavClearance(context)),
              children: [
                Text(
                  '${_greeting(context)}, ${profile.firstName}!',
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 2),
                Text(
                  "${profile.regionName}, ${profile.districtName}",
                  style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13),
                ),
                const SizedBox(height: 14),
                PromoCarousel(banners: banners),
                const SizedBox(height: 16),
                _AvailabilityCard(
                  available: available,
                  busy: _togglingAvailability,
                  onToggle: () => _toggleAvailability(available),
                ),
                const SizedBox(height: 18),
                if (profile.professions.isNotEmpty) ...[
                  SizedBox(
                    height: 40,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: [
                        _QuickChip(
                          label: context.l10n.allFilterOption,
                          selected: _quickProfessionId == null,
                          onTap: () => setState(() => _quickProfessionId = null),
                        ),
                        for (final p in profile.professions)
                          _QuickChip(
                            label: p.name,
                            selected: _quickProfessionId == p.id,
                            onTap: () => setState(() => _quickProfessionId = p.id),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      context.l10n.jobsNearYouSection,
                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: cs.onSurface),
                    ),
                    TextButton(
                      onPressed: widget.onSeeAllJobs,
                      child: Text(context.l10n.viewAllAction),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                AsyncView(
                  value: jobsAsync,
                  onRetry: () => ref.invalidate(jobsSearchProvider(filter)),
                  data: (page) {
                    if (page.content.isEmpty) {
                      return Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 20),
                        decoration: BoxDecoration(
                          color: cs.surfaceContainerHigh,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          children: [
                            Icon(PhosphorIcons.briefcase(), size: 40, color: cs.onSurfaceVariant),
                            const SizedBox(height: 10),
                            Text(
                              context.l10n.noMatchingJobsYet,
                              style: TextStyle(color: cs.onSurfaceVariant, fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              context.l10n.addMoreProfessionsHint,
                              textAlign: TextAlign.center,
                              style: TextStyle(color: cs.onSurfaceVariant, fontSize: 12.5),
                            ),
                          ],
                        ),
                      );
                    }
                    final preview = page.content.take(_previewCount).toList();
                    return Column(
                      children: [
                        for (final job in preview) ...[
                          JobCard(job: job, onTap: () => _openJob(job)),
                          const SizedBox(height: 12),
                        ],
                        if (page.content.length > _previewCount || page.totalElements > _previewCount)
                          OutlinedButton(
                            onPressed: widget.onSeeAllJobs,
                            child: Text(context.l10n.seeMoreJobsAction),
                          ),
                      ],
                    );
                  },
                ),
                const SizedBox(height: 12),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _AvailabilityCard extends StatelessWidget {
  const _AvailabilityCard({required this.available, required this.busy, required this.onToggle});

  final bool available;
  final bool busy;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    final color = available ? context.themeSuccess : Theme.of(context).colorScheme.error;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          Icon(
            available ? PhosphorIcons.checkCircle(PhosphorIconsStyle.fill) : PhosphorIcons.pauseCircle(PhosphorIconsStyle.fill),
            color: color,
            size: 26,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  available ? context.l10n.availableStatusTitle : context.l10n.busyStatusTitle,
                  style: TextStyle(fontWeight: FontWeight.w700, color: color, fontSize: 14),
                ),
                Text(
                  available
                      ? context.l10n.availableStatusHint
                      : context.l10n.busyStatusHint,
                  style: TextStyle(fontSize: 12, color: color.withValues(alpha: 0.85)),
                ),
              ],
            ),
          ),
          if (busy)
            SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: color))
          else
            Switch(value: available, onChanged: (_) => onToggle(), activeColor: color),
        ],
      ),
    );
  }
}

class _QuickChip extends StatelessWidget {
  const _QuickChip({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(label: Text(label), selected: selected, onSelected: (_) => onTap()),
    );
  }
}
