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

  /// Fire-and-forget: a missed impression/click hit isn't worth retrying or surfacing to the user.
  Future<void> recordView(int id) async {
    try {
      await _client.post('/promo-banners/$id/view');
    } catch (_) {}
  }

  Future<void> recordClick(int id) async {
    try {
      await _client.post('/promo-banners/$id/click');
    } catch (_) {}
  }
}
