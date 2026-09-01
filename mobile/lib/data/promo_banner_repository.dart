import '../core/api_client.dart';
import '../models/promo_banner.dart';

class PromoBannerRepository {
  PromoBannerRepository(this._client);

  final ApiClient _client;

  Future<List<ApiPromoBanner>> list({required String audience, int? regionId}) async {
    final res = await _client.getList('/promo-banners', query: {
      'audience': audience,
      if (regionId != null) 'regionId': regionId,
    });
    return res.map((e) => ApiPromoBanner.fromJson(e as Map<String, dynamic>)).toList();
  }
}
