import '../core/api_client.dart';

class NotificationRepository {
  NotificationRepository(this._client);

  final ApiClient _client;

  Future<void> registerToken(String token) async {
    await _client.post('/notifications/device-token', data: {
      'token': token,
      'platform': 'ANDROID',
    });
  }
}
