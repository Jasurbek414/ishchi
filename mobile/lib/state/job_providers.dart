import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/enums.dart';
import '../models/job.dart';
import '../models/page_response.dart';
import 'core_providers.dart';

typedef JobFilter = ({
  int? regionId,
  int? districtId,
  int? professionId,
  JobType? jobType,
  num? minPayment,
  num? maxPayment,
  String? search,
  String sort,
  int? nearRegionId,
  int? nearDistrictId,
});

const defaultJobFilter = (
  regionId: null,
  districtId: null,
  professionId: null,
  jobType: null,
  minPayment: null,
  maxPayment: null,
  search: null,
  sort: 'newest',
  nearRegionId: null,
  nearDistrictId: null,
);

final jobsSearchProvider = FutureProvider.family<PageResponse<Job>, JobFilter>((ref, filter) {
  return ref.watch(jobRepositoryProvider).search(
        regionId: filter.regionId,
        districtId: filter.districtId,
        professionId: filter.professionId,
        jobType: filter.jobType,
        minPayment: filter.minPayment,
        maxPayment: filter.maxPayment,
        search: filter.search,
        sort: filter.sort,
        nearRegionId: filter.nearRegionId,
        nearDistrictId: filter.nearDistrictId,
        size: 50,
      );
});

final jobDetailProvider = FutureProvider.family<Job, int>((ref, id) {
  return ref.watch(jobRepositoryProvider).getById(id);
});

final jobsMapProvider = FutureProvider<List<Job>>((ref) {
  return ref.watch(jobRepositoryProvider).mapSearch();
});

final myJobsProvider = FutureProvider.family<PageResponse<Job>, JobStatus?>((ref, status) {
  return ref.watch(jobRepositoryProvider).myJobs(status: status, size: 50);
});
