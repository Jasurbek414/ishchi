import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/job_application.dart';
import '../models/page_response.dart';
import 'core_providers.dart';

/// The employer's shortlist for one job.
final jobApplicationsProvider = FutureProvider.family<List<JobApplication>, int>((ref, jobId) {
  return ref.watch(jobApplicationRepositoryProvider).forJob(jobId);
});

/// The worker's own responses, newest first.
final myApplicationsProvider = FutureProvider<PageResponse<JobApplication>>((ref) {
  return ref.watch(jobApplicationRepositoryProvider).mine(size: 50);
});
