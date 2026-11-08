import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../l10n/l10n_x.dart';
import '../../models/enums.dart';
import '../../state/profile_provider.dart';
import '../../state/promo_banner_providers.dart';
import '../../state/worker_providers.dart';
import '../../widgets/async_view.dart';
import '../../widgets/emergency_specialist_card.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/promo_banners.dart';
import '../../widgets/promo_carousel.dart';
import '../../widgets/app_bottom_nav.dart';
import '../../widgets/worker_card.dart';
import '../../widgets/worker_filter_sheet.dart';
import '../../widgets/notification_bell_button.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../widgets/role_switch_sheet.dart';

class WorkerSearchScreen extends ConsumerStatefulWidget {
  const WorkerSearchScreen({super.key});

  @override
  ConsumerState<WorkerSearchScreen> createState() => _WorkerSearchScreenState();
}

class _WorkerSearchScreenState extends ConsumerState<WorkerSearchScreen> {
  WorkerFilter _filter = defaultWorkerFilter;
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _openFilterSheet() async {
    final result = await showModalBottomSheet<WorkerFilter>(
      context: context,
      isScrollControlled: true,
      builder: (_) => WorkerFilterSheet(initial: _filter),
    );
    if (result != null) setState(() => _filter = result);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final filter = (
      regionId: _filter.regionId,
      districtId: _filter.districtId,
      professionId: _filter.professionId,
      minExperience: _filter.minExperience,
      search: _searchController.text.trim().isEmpty ? null : _searchController.text.trim(),
      workPreference: _filter.workPreference,
      availableToday: _filter.availableToday,
      emergency: _filter.emergency,
    );
    final workersAsync = ref.watch(workersSearchProvider(filter));
    final profileAsync = ref.watch(profileProvider);
    final bannersAsync = ref.watch(
        promoBannersProvider((audience: 'EMPLOYER', regionId: profileAsync.valueOrNull?.regionId)));
    final apiBanners = bannersAsync.valueOrNull ?? const [];
    final banners = apiBanners.isNotEmpty
        ? PromoBanners.fromApi(context, ref, apiBanners)
        : PromoBanners.employerFor(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.workerSearchTitle),
        actions: [
          IconButton(
            icon: Icon(PhosphorIcons.arrowsClockwise(PhosphorIconsStyle.bold)),
            tooltip: "Ishchi roliga o'tish",
            onPressed: () => showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
              ),
              builder: (_) => const RoleSwitchSheet(currentRole: UserRole.employer),
            ),
          ),
          const NotificationBellButton(),
          IconButton(
            icon: const Icon(Icons.map_outlined),
            tooltip: context.l10n.viewOnMapTooltip,
            onPressed: () => context.push('/employer/workers-map'),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: PromoCarousel(banners: banners),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(hintText: context.l10n.searchByNameOrProfessionHint, prefixIcon: const Icon(Icons.search)),
                    onSubmitted: (_) => setState(() {}),
                  ),
                ),
                const SizedBox(width: 10),
                IconButton.filled(
                  onPressed: _openFilterSheet,
                  icon: const Icon(Icons.tune),
                  style: IconButton.styleFrom(backgroundColor: cs.primary),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: SizedBox(
              height: 36,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  for (final wp in WorkPreference.values)
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(wp.label(context)),
                        selected: _filter.workPreference == wp,
                        onSelected: (selected) => setState(() {
                          _filter = (
                            regionId: _filter.regionId,
                            districtId: _filter.districtId,
                            professionId: _filter.professionId,
                            minExperience: _filter.minExperience,
                            search: _filter.search,
                            workPreference: selected ? wp : null,
                            availableToday: _filter.availableToday,
                            emergency: _filter.emergency,
                          );
                        }),
                      ),
                    ),
                ],
              ),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => ref.refresh(workersSearchProvider(filter).future),
              child: AsyncView(
                value: workersAsync,
                onRetry: () => ref.invalidate(workersSearchProvider(filter)),
                data: (page) {
                  final currentUserId = profileAsync.valueOrNull?.userId;
                  final workers = currentUserId != null
                      ? page.content.where((w) => w.userId != currentUserId).toList()
                      : page.content;

                  if (workers.isEmpty) {
                    return ListView(
                      padding: EdgeInsets.fromLTRB(16, 0, 16, 16 + bottomNavClearance(context)),
                      children: [
                        EmergencySpecialistCard(
                          onTap: () => context.push('/employer/emergency-specialists'),
                        ),
                        const SizedBox(height: 50),
                        EmptyState(message: context.l10n.noWorkersFound, icon: Icons.person_search_outlined),
                      ],
                    );
                  }
                  return ListView.separated(
                    padding: EdgeInsets.fromLTRB(16, 0, 16, 16 + bottomNavClearance(context)),
                    itemCount: workers.length + 1,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, i) {
                      if (i == 0) {
                        return EmergencySpecialistCard(
                          onTap: () => context.push('/employer/emergency-specialists'),
                        );
                      }
                      final worker = workers[i - 1];
                      return WorkerCard(worker: worker, onTap: () => context.push('/employer/workers/' + worker.id.toString()));
                    },
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}
