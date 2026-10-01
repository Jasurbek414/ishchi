import '../core/api_client.dart';
import '../models/enums.dart';
import '../models/saved_search.dart';

class SavedSearchRepository {
  SavedSearchRepository(this._client);

  final ApiClient _client;

  Future<List<SavedSearch>> list() async {
    final res = await _client.getList('/saved-searches');
    return res.map((e) => SavedSearch.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<SavedSearch> create({
    required String name,
    int? professionId,
    int? regionId,
    int? districtId,
    JobType? jobType,
    num? minPayment,
    bool notifyEnabled = true,
  }) async {
    final res = await _client.post('/saved-searches', data: _body(
      name: name,
      professionId: professionId,
      regionId: regionId,
      districtId: districtId,
      jobType: jobType,
      minPayment: minPayment,
      notifyEnabled: notifyEnabled,
    ));
    return SavedSearch.fromJson(res);
  }

  Future<SavedSearch> update(
    int id, {
    required String name,
    int? professionId,
    int? regionId,
    int? districtId,
    JobType? jobType,
    num? minPayment,
    required bool notifyEnabled,
  }) async {
    final res = await _client.patch('/saved-searches/$id', data: _body(
      name: name,
      professionId: professionId,
      regionId: regionId,
      districtId: districtId,
      jobType: jobType,
      minPayment: minPayment,
      notifyEnabled: notifyEnabled,
    ));
    return SavedSearch.fromJson(res);
  }

  Future<void> delete(int id) => _client.delete('/saved-searches/$id');

  /// Null fields are sent explicitly: a saved search is replaced wholesale, so leaving a cleared
  /// filter out of the body would keep the old value instead of removing it.
  Map<String, dynamic> _body({
    required String name,
    int? professionId,
    int? regionId,
    int? districtId,
    JobType? jobType,
    num? minPayment,
    required bool notifyEnabled,
  }) => {
        'name': name,
        'professionId': professionId,
        'regionId': regionId,
        'districtId': districtId,
        'jobType': jobType?.apiValue,
        'minPayment': minPayment,
        'notifyEnabled': notifyEnabled,
      };
}
