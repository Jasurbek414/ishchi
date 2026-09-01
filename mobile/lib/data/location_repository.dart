import '../core/api_client.dart';
import '../models/region.dart';

class LocationRepository {
  LocationRepository(this._client);

  final ApiClient _client;

  Future<List<Region>> getRegions() async {
    final list = await _client.getList('/regions');
    return list.map((e) => Region.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<District>> getDistricts(int regionId) async {
    final list = await _client.getList('/regions/$regionId/districts');
    return list.map((e) => District.fromJson(e as Map<String, dynamic>)).toList();
  }
}
