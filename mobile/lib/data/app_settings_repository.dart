import '../core/api_client.dart';
import '../models/app_settings.dart';

class AppSettingsRepository {
  AppSettingsRepository(this._client);

  final ApiClient _client;

  Future<AppSettings> get() async {
    final res = await _client.get('/app-settings');
    return AppSettings.fromJson(res);
  }
}
