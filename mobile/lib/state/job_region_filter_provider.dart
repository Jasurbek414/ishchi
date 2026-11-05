import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core_providers.dart';

/// Persists the worker's preferred region/district filter for the jobs list across app
/// restarts, so it doesn't need to be re-picked every time the app is opened.
class JobRegionFilter {
  const JobRegionFilter({this.regionId, this.districtId});

  final int? regionId;
  final int? districtId;
}

const _kRegionKey = 'job_filter_region_id';
const _kDistrictKey = 'job_filter_district_id';

class JobRegionFilterNotifier extends Notifier<JobRegionFilter> {
  @override
  // Read synchronously: loading it asynchronously meant the jobs list was first fetched unfiltered
  // and then refetched with the saved region a moment later - a flicker and an extra request on
  // every launch.
  JobRegionFilter build() {
    final prefs = ref.read(sharedPreferencesProvider);
    return JobRegionFilter(
      regionId: prefs.getInt(_kRegionKey),
      districtId: prefs.getInt(_kDistrictKey),
    );
  }

  Future<void> set(int? regionId, int? districtId) async {
    state = JobRegionFilter(regionId: regionId, districtId: districtId);
    final prefs = ref.read(sharedPreferencesProvider);
    if (regionId == null) {
      await prefs.remove(_kRegionKey);
    } else {
      await prefs.setInt(_kRegionKey, regionId);
    }
    if (districtId == null) {
      await prefs.remove(_kDistrictKey);
    } else {
      await prefs.setInt(_kDistrictKey, districtId);
    }
  }
}

final jobRegionFilterProvider = NotifierProvider<JobRegionFilterNotifier, JobRegionFilter>(JobRegionFilterNotifier.new);
