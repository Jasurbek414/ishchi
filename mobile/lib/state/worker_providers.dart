import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/enums.dart';
import '../models/page_response.dart';
import '../models/worker.dart';
import 'core_providers.dart';

typedef WorkerFilter = ({
  int? regionId,
  int? districtId,
  int? professionId,
  int? minExperience,
  String? search,
  WorkPreference? workPreference,
  bool? availableToday,
});

const defaultWorkerFilter = (
  regionId: null,
  districtId: null,
  professionId: null,
  minExperience: null,
  search: null,
  workPreference: null,
  availableToday: null,
);

final workersSearchProvider = FutureProvider.family<PageResponse<Worker>, WorkerFilter>((ref, filter) {
  return ref.watch(workerRepositoryProvider).search(
        regionId: filter.regionId,
        districtId: filter.districtId,
        professionId: filter.professionId,
        minExperience: filter.minExperience,
        search: filter.search,
        workPreference: filter.workPreference,
        availableToday: filter.availableToday,
        size: 50,
      );
});

final workerDetailProvider = FutureProvider.family<Worker, int>((ref, id) {
  return ref.watch(workerRepositoryProvider).getById(id);
});

final workersMapProvider = FutureProvider<List<Worker>>((ref) {
  return ref.watch(workerRepositoryProvider).mapSearch();
});
