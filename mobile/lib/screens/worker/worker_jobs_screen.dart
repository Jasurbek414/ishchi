import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../l10n/l10n_x.dart';
import '../../models/job.dart';
import '../../state/job_providers.dart';
import '../../state/job_region_filter_provider.dart';
import '../../state/location_providers.dart';
import '../../state/profile_provider.dart';
import '../../widgets/async_view.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/job_card.dart';
import '../../widgets/job_filter_sheet.dart';
import '../../widgets/region_district_selector.dart';
import '../../widgets/app_bottom_nav.dart';
import '../../widgets/unlock_job_sheet.dart';

class WorkerJobsScreen extends ConsumerStatefulWidget {
  const WorkerJobsScreen({super.key});

  @override
  ConsumerState<WorkerJobsScreen> createState() => _WorkerJobsScreenState();
}

class _WorkerJobsScreenState extends ConsumerState<WorkerJobsScreen> {
  // regionId/districtId live in jobRegionFilterProvider (persisted); everything else here.
  JobFilter _filter = defaultJobFilter;
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _openJob(Job job) async {
    if (await confirmJobUnlock(context, ref, job)) {
      if (mounted) context.push('/worker/jobs/${job.id}');
    }
  }

  void _openFilterSheet() async {
    final region = ref.read(jobRegionFilterProvider);
    final initial = (
      regionId: region.regionId,
      districtId: region.districtId,
      professionId: _filter.professionId,
      jobType: _filter.jobType,
      minPayment: _filter.minPayment,
      maxPayment: _filter.maxPayment,
      search: _filter.search,
      sort: _filter.sort,
      nearRegionId: _filter.nearRegionId,
      nearDistrictId: _filter.nearDistrictId,
      urgent: _filter.urgent,
    );
    final result = await showModalBottomSheet<JobFilter>(
      context: context,
      isScrollControlled: true,
      builder: (_) => JobFilterSheet(initial: initial),
    );
    if (result == null) return;
    await ref.read(jobRegionFilterProvider.notifier).set(result.regionId, result.districtId);
    setState(() {
      _filter = (
        regionId: null,
        districtId: null,
        professionId: result.professionId,
        jobType: result.jobType,
        minPayment: result.minPayment,
        maxPayment: result.maxPayment,
        search: result.search,
        sort: result.sort,
        nearRegionId: result.nearRegionId,
        nearDistrictId: result.nearDistrictId,
        urgent: result.urgent,
      );
    });
  }

  void _selectProfession(int? professionId) {
    setState(() {
      _filter = (
        regionId: _filter.regionId,
        districtId: _filter.districtId,
        professionId: professionId,
        jobType: _filter.jobType,
        minPayment: _filter.minPayment,
        maxPayment: _filter.maxPayment,
        search: _filter.search,
        sort: _filter.sort,
        nearRegionId: _filter.nearRegionId,
        nearDistrictId: _filter.nearDistrictId,
        urgent: _filter.urgent,
      );
    });
  }

  Future<void> _openRegionPicker() async {
    final current = ref.read(jobRegionFilterProvider);
    int? pickedRegion = current.regionId;
    int? pickedDistrict = current.districtId;

    final applied = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) => StatefulBuilder(
        builder: (sheetContext, setSheetState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(sheetContext).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(child: Text(context.l10n.fieldRegion, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800))),
                  TextButton(
                    onPressed: () => setSheetState(() {
                      pickedRegion = null;
                      pickedDistrict = null;
                    }),
                    child: Text(context.l10n.clearAction),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                context.l10n.regionFilterPersistedHint,
                style: TextStyle(fontSize: 12.5, color: Theme.of(sheetContext).colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: 14),
              RegionDistrictSelector(
                regionId: pickedRegion,
                districtId: pickedDistrict,
                onChanged: (r, d) => setSheetState(() {
                  pickedRegion = r;
                  pickedDistrict = d;
                }),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () => Navigator.of(sheetContext).pop(true),
                child: Text(context.l10n.applyAction),
              ),
            ],
          ),
        ),
      ),
    );

    if (applied == true) {
      await ref.read(jobRegionFilterProvider.notifier).set(pickedRegion, pickedDistrict);
    }
  }

  String _regionLabel(BuildContext context, JobRegionFilter region, List<dynamic> regions, List<dynamic> districts) {
    if (region.regionId == null) return context.l10n.allRegionsOption;
    final regionName = regions.cast<dynamic>().firstWhere(
          (r) => r.id == region.regionId,
          orElse: () => null,
        )?.name as String?;
    if (regionName == null) return context.l10n.regionSelectedFallback;
    if (region.districtId == null) return regionName;
    final districtName = districts.cast<dynamic>().firstWhere(
          (d) => d.id == region.districtId,
          orElse: () => null,
        )?.name as String?;
    return districtName != null ? '$regionName, $districtName' : regionName;
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final region = ref.watch(jobRegionFilterProvider);
    final filter = (
      regionId: region.regionId,
      districtId: region.districtId,
      professionId: _filter.professionId,
      jobType: _filter.jobType,
      minPayment: _filter.minPayment,
      maxPayment: _filter.maxPayment,
      search: _searchController.text.trim().isEmpty ? null : _searchController.text.trim(),
      sort: _filter.sort,
      nearRegionId: _filter.nearRegionId,
      nearDistrictId: _filter.nearDistrictId,
      urgent: _filter.urgent,
    );
    final jobsAsync = ref.watch(jobsSearchProvider(filter));
    final myProfessions = ref.watch(profileProvider).valueOrNull?.professions ?? const [];
    final regionsAsync = ref.watch(regionsProvider);
    final districtsAsync = region.regionId != null ? ref.watch(districtsProvider(region.regionId!)) : null;

    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.jobsTabLabel),
        actions: [
          IconButton(
            icon: const Icon(Icons.map_outlined),
            tooltip: context.l10n.viewOnMapTooltip,
            onPressed: () => context.push('/worker/jobs-map'),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
            child: InkWell(
              onTap: _openRegionPicker,
              borderRadius: BorderRadius.circular(14),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: cs.primary.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: cs.primary.withValues(alpha: 0.25)),
                ),
                child: Row(
                  children: [
                    Icon(PhosphorIcons.mapPin(PhosphorIconsStyle.fill), color: cs.primary, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        regionsAsync.when(
                          data: (regions) => _regionLabel(context, region, regions, districtsAsync?.valueOrNull ?? const []),
                          loading: () => context.l10n.loadingEllipsis,
                          error: (_, __) => context.l10n.allRegionsOption,
                        ),
                        style: TextStyle(color: cs.primary, fontWeight: FontWeight.w700, fontSize: 14),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Icon(PhosphorIcons.caretDown(), color: cs.primary, size: 16),
                  ],
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: context.l10n.searchHint,
                      prefixIcon: const Icon(Icons.search),
                    ),
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
          if (myProfessions.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: SizedBox(
                height: 34,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    ChoiceChip(
                      label: Text(context.l10n.allFilterOption),
                      selected: _filter.professionId == null,
                      onSelected: (_) => _selectProfession(null),
                    ),
                    const SizedBox(width: 8),
                    for (final p in myProfessions) ...[
                      ChoiceChip(
                        label: Text(p.name),
                        selected: _filter.professionId == p.id,
                        onSelected: (_) => _selectProfession(p.id),
                      ),
                      const SizedBox(width: 8),
                    ],
                  ],
                ),
              ),
            ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => ref.refresh(jobsSearchProvider(filter).future),
              child: AsyncView(
                value: jobsAsync,
                onRetry: () => ref.invalidate(jobsSearchProvider(filter)),
                data: (page) {
                  if (page.content.isEmpty) {
                    return ListView(
                      children: [
                        const SizedBox(height: 60),
                        EmptyState(message: context.l10n.noJobsFound, icon: Icons.search_off),
                      ],
                    );
                  }
                  return ListView.separated(
                    padding: EdgeInsets.fromLTRB(16, 0, 16, 16 + bottomNavClearance(context)),
                    itemCount: page.content.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, i) {
                      final job = page.content[i];
                      return JobCard(job: job, onTap: () => _openJob(job));
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
