import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/saved_search.dart';
import 'core_providers.dart';

final savedSearchesProvider = FutureProvider<List<SavedSearch>>((ref) {
  return ref.watch(savedSearchRepositoryProvider).list();
});
