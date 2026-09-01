import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/employer.dart';
import 'core_providers.dart';

final employersMapProvider = FutureProvider<List<Employer>>((ref) {
  return ref.watch(employerRepositoryProvider).mapSearch();
});
