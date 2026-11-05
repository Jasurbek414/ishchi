import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';

import '../../core/formatters.dart';
import '../../l10n/l10n_x.dart';
import '../../models/job.dart';
import '../../state/core_providers.dart';
import '../../state/profile_provider.dart';
import '../../widgets/map/app_map.dart';
import '../../widgets/map/explore_map.dart';
import '../../widgets/trust_badges.dart';
import '../../widgets/unlock_job_sheet.dart';
import '../../widgets/user_avatar.dart';

/// Open jobs on a map, priced pins grouped by area. With [employerId] it shows only that
/// employer's jobs.
class JobsMapScreen extends ConsumerWidget {
  const JobsMapScreen({super.key, this.employerId, this.employerName});

  final int? employerId;
  final String? employerName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final profile = ref.watch(profileProvider).valueOrNull;
    final home = profile?.latitude != null && profile?.longitude != null
        ? LatLng(profile!.latitude!, profile.longitude!)
        : null;
    final repository = ref.read(jobRepositoryProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(employerName != null ? l10n.employerJobsMapTitle(employerName!) : l10n.jobsMapTitle),
      ),
      body: ExploreMap<Job>(
        load: (q) => repository.mapSearch(
          latitude: q.center?.latitude,
          longitude: q.center?.longitude,
          radiusDegrees: q.radiusDegrees,
          professionId: q.professionId,
          employerId: employerId,
          urgentOnly: q.urgentOnly,
        ),
        idOf: (job) => job.id,
        pointOf: (job) => LatLng(job.latitude!, job.longitude!),
        markerSize: PriceMarker.size,
        markerBuilder: (context, job, selected) => PriceMarker(
          label: job.payment > 0 ? compactPrice(context, job.payment) : '—',
          urgent: job.urgent,
          selected: selected,
        ),
        cardBuilder: (context, job, distance) => _JobMapCard(job: job, distance: distance),
        emptyText: l10n.noJobsInThisArea,
        showUrgentFilter: true,
        filters: employerId != null
            ? const []
            : [for (final p in profile?.professions ?? const []) MapFilterOption(p.id, p.name)],
        fallbackCenter: home,
      ),
    );
  }
}

class _JobMapCard extends ConsumerWidget {
  const _JobMapCard({required this.job, required this.distance});

  final Job job;
  final String? distance;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    Future<void> open() async {
      if (await confirmJobUnlock(context, ref, job)) {
        if (context.mounted) context.push('/worker/jobs/${job.id}');
      }
    }

    return MapItemCard(
      leading: UserAvatar(url: job.employerAvatarUrl, name: job.employerName, radius: 22),
      title: job.title,
      subtitle: job.location,
      badges: [
        if (job.urgent) const UrgentBadge(),
        if (job.hasResponded)
          SignalBadge(icon: Icons.check_circle_outline, label: l10n.respondedLabel, color: Colors.green.shade700),
      ],
      facts: [
        MapFact(icon: Icons.payments_outlined, text: Formatters.money(context, job.payment), strong: true),
        if (distance != null) MapFact(icon: Icons.near_me_outlined, text: distance!),
        MapFact(icon: Icons.schedule, text: Formatters.timeAgo(context, job.createdAt)),
      ],
      actionLabel: l10n.viewDetailsAction,
      onAction: open,
    );
  }
}
