import '../core/api_client.dart';
import '../models/employer.dart';

class EmployerRepository {
  EmployerRepository(this._client);

  final ApiClient _client;

  Future<List<Employer>> mapSearch({int? regionId, double? latitude, double? longitude, double? radiusDegrees}) async {
    final res = await _client.getList('/employers/map', query: {
      if (regionId != null) 'regionId': regionId,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (radiusDegrees != null) 'radiusDegrees': radiusDegrees,
    });
    return res.map((e) => Employer.fromJson(e as Map<String, dynamic>)).toList();
  }
}
