import '../core/api_client.dart';
import '../models/enums.dart';
import '../models/page_response.dart';
import '../models/worker.dart';

class WorkerRepository {
  WorkerRepository(this._client);

  final ApiClient _client;

  Future<PageResponse<Worker>> search({
    int? regionId,
    int? districtId,
    int? professionId,
    int? minExperience,
    String? search,
    WorkPreference? workPreference,
    bool? availableToday,
    int page = 0,
    int size = 20,
  }) async {
    final res = await _client.get('/workers', query: {
      if (regionId != null) 'regionId': regionId,
      if (districtId != null) 'districtId': districtId,
      if (professionId != null) 'professionId': professionId,
      if (minExperience != null) 'minExperience': minExperience,
      if (search != null && search.isNotEmpty) 'search': search,
      if (workPreference != null) 'workPreference': workPreference.apiValue,
      if (availableToday == true) 'availableToday': true,
      'page': page,
      'size': size,
    });
    return PageResponse.fromJson(res, Worker.fromJson);
  }

  Future<Worker> getById(int id) async {
    final res = await _client.get('/workers/$id');
    return Worker.fromJson(res);
  }

  Future<List<Worker>> mapSearch({int? regionId, int? professionId}) async {
    final res = await _client.getList('/workers/map', query: {
      if (regionId != null) 'regionId': regionId,
      if (professionId != null) 'professionId': professionId,
    });
    return res.map((e) => Worker.fromJson(e as Map<String, dynamic>)).toList();
  }
}
