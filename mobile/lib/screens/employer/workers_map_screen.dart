import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';

import '../../l10n/l10n_x.dart';
import '../../models/worker.dart';
import '../../state/core_providers.dart';
import '../../state/profession_providers.dart';
import '../../state/profile_provider.dart';
import '../../widgets/map/app_map.dart';
import '../../widgets/map/explore_map.dart';
import '../../widgets/trust_badges.dart';
import '../../widgets/user_avatar.dart';

/// Workers who put their location on the map, as photo pins; a green dot marks those free today.
class WorkersMapScreen extends ConsumerWidget {
  const WorkersMapScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final profile = ref.watch(profileProvider).valueOrNull;
    final professions = ref.watch(professionsProvider).valueOrNull ?? const [];
    final home = profile?.latitude != null && profile?.longitude != null
        ? LatLng(profile!.latitude!, profile.longitude!)
        : null;
    final repository = ref.read(workerRepositoryProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.workersMapTitle)),
      body: ExploreMap<Worker>(
        load: (q) => repository.mapSearch(
          latitude: q.center?.latitude,
          longitude: q.center?.longitude,
          radiusDegrees: q.radiusDegrees,
          professionId: q.professionId,
        ),
        idOf: (w) => w.id,
        pointOf: (w) => LatLng(w.latitude!, w.longitude!),
        markerSize: AvatarMarker.size,
        markerBuilder: (context, w, selected) => AvatarMarker(
          selected: selected,
          badgeColor: w.availableToday ? Colors.green.shade600 : null,
          child: UserAvatar(url: w.avatarUrl, name: w.fullName, radius: 20),
        ),
        cardBuilder: (context, w, distance) => MapItemCard(
          leading: UserAvatar(url: w.avatarUrl, name: w.fullName, radius: 24),
          title: w.fullName,
          subtitle: w.professions.map((p) => p.name).join(', '),
          badges: [
            if (w.verified) const VerifiedBadge(),
            if (w.ratingCount > 0) RatingBadge(average: w.ratingAverage, count: w.ratingCount),
            if (w.availableToday) const AvailableTodayBadge(),
          ],
          facts: [
            if (distance != null) MapFact(icon: Icons.near_me_outlined, text: distance),
            MapFact(icon: Icons.location_on_outlined, text: w.districtName),
          ],
          actionLabel: l10n.viewDetailsAction,
          onAction: () => context.push('/employer/workers/${w.id}'),
        ),
        emptyText: l10n.noWorkersInThisArea,
        filters: [for (final p in professions) MapFilterOption(p.id, p.name)],
        fallbackCenter: home,
      ),
    );
  }
}
