import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/promo_banner.dart';
import 'core_providers.dart';

typedef PromoBannerFilter = ({String audience, int? regionId});

final promoBannersProvider = FutureProvider.family<List<ApiPromoBanner>, PromoBannerFilter>((ref, filter) {
  return ref.watch(promoBannerRepositoryProvider).list(audience: filter.audience, regionId: filter.regionId);
});
