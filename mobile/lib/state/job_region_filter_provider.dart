import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

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
  JobRegionFilter build() {
    _load();
    return const JobRegionFilter();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    state = JobRegionFilter(
      regionId: prefs.getInt(_kRegionKey),
      districtId: prefs.getInt(_kDistrictKey),
    );
  }

  Future<void> set(int? regionId, int? districtId) async {
    state = JobRegionFilter(regionId: regionId, districtId: districtId);
    final prefs = await SharedPreferences.getInstance();
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
