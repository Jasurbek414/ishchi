import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/promo_banner.dart';
import 'core_providers.dart';

typedef PromoBannerFilter = ({String audience, int? regionId});

final promoBannersProvider = FutureProvider.family<List<ApiPromoBanner>, PromoBannerFilter>((ref, filter) async {
  final repo = ref.watch(promoBannerRepositoryProvider);
  final banners = await repo.list(audience: filter.audience, regionId: filter.regionId);
  // Fire once per actual fetch (not per widget rebuild) so an impression is counted
  // when the carousel's banner set loads, without over-counting on every repaint.
  for (final b in banners) {
    unawaited(repo.recordView(b.id));
  }
  return banners;
});
