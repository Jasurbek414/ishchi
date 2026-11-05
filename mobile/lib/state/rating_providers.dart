import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/page_response.dart';
import '../models/rating.dart';
import 'core_providers.dart';

/// Everything said about one person, newest first.
final userRatingsProvider = FutureProvider.family<PageResponse<Rating>, int>((ref, userId) {
  return ref.watch(ratingRepositoryProvider).forUser(userId, size: 20);
});
