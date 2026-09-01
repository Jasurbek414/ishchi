import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../l10n/l10n_x.dart';
import '../../models/enums.dart';
import '../../state/profile_provider.dart';
import '../../state/promo_banner_providers.dart';
import '../../state/worker_providers.dart';
import '../../widgets/async_view.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/promo_banners.dart';
import '../../widgets/promo_carousel.dart';
import '../../widgets/app_bottom_nav.dart';
import '../../widgets/worker_card.dart';
import '../../widgets/worker_filter_sheet.dart';

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
    );
    final workersAsync = ref.watch(workersSearchProvider(filter));
    final profileAsync = ref.watch(profileProvider);
    final bannersAsync = ref.watch(
        promoBannersProvider((audience: 'EMPLOYER', regionId: profileAsync.valueOrNull?.regionId)));
    final apiBanners = bannersAsync.valueOrNull ?? const [];
    final banners = apiBanners.isNotEmpty
        ? PromoBanners.fromApi(context, apiBanners)
        : PromoBanners.employerFor(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.workerSearchTitle),
        actions: [
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
                  if (page.content.isEmpty) {
                    return ListView(
                      children: [
                        const SizedBox(height: 60),
                        EmptyState(message: context.l10n.noWorkersFound, icon: Icons.person_search_outlined),
                      ],
                    );
                  }
                  return ListView.separated(
                    padding: EdgeInsets.fromLTRB(16, 0, 16, 16 + bottomNavClearance(context)),
                    itemCount: page.content.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, i) {
                      final worker = page.content[i];
                      return WorkerCard(worker: worker, onTap: () => context.push('/employer/workers/${worker.id}'));
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
