import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';

import '../../l10n/l10n_x.dart';
import '../../models/employer.dart';
import '../../state/core_providers.dart';
import '../../state/profile_provider.dart';
import '../../widgets/map/app_map.dart';
import '../../widgets/map/explore_map.dart';
import '../../widgets/user_avatar.dart';

/// Employers who put their location on the map; from one, the worker can open just their jobs.
class EmployersMapScreen extends ConsumerWidget {
  const EmployersMapScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final profile = ref.watch(profileProvider).valueOrNull;
    final home = profile?.latitude != null && profile?.longitude != null
        ? LatLng(profile!.latitude!, profile.longitude!)
        : null;
    final repository = ref.read(employerRepositoryProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.employersMapTitle)),
      body: ExploreMap<Employer>(
        load: (q) => repository.mapSearch(
          latitude: q.center?.latitude,
          longitude: q.center?.longitude,
          radiusDegrees: q.radiusDegrees,
        ),
        idOf: (e) => e.id,
        pointOf: (e) => LatLng(e.latitude!, e.longitude!),
        markerSize: AvatarMarker.size,
        markerBuilder: (context, e, selected) => AvatarMarker(
          selected: selected,
          child: UserAvatar(url: e.avatarUrl, name: e.fullName, radius: 20),
        ),
        cardBuilder: (context, e, distance) => MapItemCard(
          leading: UserAvatar(url: e.avatarUrl, name: e.fullName, radius: 24),
          title: e.fullName,
          subtitle: (e.about?.trim().isNotEmpty ?? false) ? e.about!.trim() : '${e.regionName}, ${e.districtName}',
          facts: [
            if (distance != null) MapFact(icon: Icons.near_me_outlined, text: distance),
            MapFact(icon: Icons.location_on_outlined, text: e.districtName),
          ],
          actionLabel: l10n.viewTheirJobsAction,
          onAction: () => context.push(Uri(
            path: '/worker/jobs-map',
            queryParameters: {'employerId': '${e.id}', 'name': e.fullName},
          ).toString()),
        ),
        emptyText: l10n.noEmployersInThisArea,
        fallbackCenter: home,
      ),
    );
  }
}
