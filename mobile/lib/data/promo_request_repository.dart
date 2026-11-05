import 'package:dio/dio.dart';

import '../core/api_client.dart';
import '../models/promo_request.dart';

class PromoRequestRepository {
  PromoRequestRepository(this._client);

  final ApiClient _client;

  Future<List<PromoRequestItem>> getMyRequests() async {
    final res = await _client.get('/promo-requests/my');
    final list = res as List<dynamic>;
    return list.map((item) => PromoRequestItem.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<PromoRequestItem> submitRequest({
    required String title,
    String? subtitle,
    String? linkUrl,
    String audience = 'ALL',
    int? regionId,
    int durationDays = 7,
    String? imagePath,
  }) async {
    final map = <String, dynamic>{
      'title': title,
      if (subtitle != null && subtitle.trim().isNotEmpty) 'subtitle': subtitle.trim(),
      if (linkUrl != null && linkUrl.trim().isNotEmpty) 'linkUrl': linkUrl.trim(),
      'audience': audience,
      if (regionId != null) 'regionId': regionId,
      'durationDays': durationDays,
    };

    if (imagePath != null && imagePath.isNotEmpty) {
      final res = await _client.postMultipart(
        '/promo-requests',
        () async => FormData.fromMap({
          ...map,
          'image': await MultipartFile.fromFile(imagePath),
        }),
      );
      return PromoRequestItem.fromJson(res);
    } else {
      final res = await _client.postMultipart(
        '/promo-requests',
        () async => FormData.fromMap(map),
      );
      return PromoRequestItem.fromJson(res);
    }
  }

  Future<void> cancelRequest(int id) async {
    await _client.delete('/promo-requests/$id');
  }
}
