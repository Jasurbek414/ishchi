import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/promo_request_repository.dart';
import '../models/promo_request.dart';
import 'core_providers.dart';

final promoRequestRepositoryProvider = Provider<PromoRequestRepository>((ref) {
  return PromoRequestRepository(ref.watch(apiClientProvider));
});

final myPromoRequestsProvider = FutureProvider.autoDispose<List<PromoRequestItem>>((ref) async {
  return ref.watch(promoRequestRepositoryProvider).getMyRequests();
});
