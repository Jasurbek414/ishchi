import '../core/api_client.dart';
import '../models/profession.dart';

class ProfessionRepository {
  ProfessionRepository(this._client);

  final ApiClient _client;

  Future<List<Profession>> getProfessions() async {
    final list = await _client.getList('/professions');
    return list.map((e) => Profession.fromJson(e as Map<String, dynamic>)).toList();
  }
}
