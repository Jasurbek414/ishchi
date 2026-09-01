import '../core/api_client.dart';
import '../models/employer.dart';

class EmployerRepository {
  EmployerRepository(this._client);

  final ApiClient _client;

  Future<List<Employer>> mapSearch({int? regionId}) async {
    final res = await _client.getList('/employers/map', query: {
      if (regionId != null) 'regionId': regionId,
    });
    return res.map((e) => Employer.fromJson(e as Map<String, dynamic>)).toList();
  }
}
