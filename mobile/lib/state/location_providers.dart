import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/region.dart';
import 'core_providers.dart';

final regionsProvider = FutureProvider<List<Region>>((ref) {
  return ref.watch(locationRepositoryProvider).getRegions();
});

final districtsProvider = FutureProvider.family<List<District>, int>((ref, regionId) {
  return ref.watch(locationRepositoryProvider).getDistricts(regionId);
});
