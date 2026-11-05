import '../core/api_client.dart';
import '../models/in_app_notification.dart';

class NotificationRepository {
  NotificationRepository(this._client);

  final ApiClient _client;

  Future<void> registerToken(String token, {String platform = 'ANDROID'}) async {
    await _client.post('/notifications/device-token', {
      'token': token,
      'platform': platform,
    });
  }

  Future<List<InAppNotification>> getNotifications({int page = 0, int size = 50}) async {
    final res = await _client.get('/notifications?page=$page&size=$size');
    final list = res as List<dynamic>;
    return list.map((item) => InAppNotification.fromMap(item as Map<String, dynamic>)).toList();
  }

  Future<int> getUnreadCount() async {
    final res = await _client.get('/notifications/unread-count');
    final map = res as Map<String, dynamic>;
    return (map['unreadCount'] as num?)?.toInt() ?? 0;
  }

  Future<void> markAsRead(String id) async {
    await _client.post('/notifications/$id/read', {});
  }

  Future<void> markAllAsRead() async {
    await _client.post('/notifications/read-all', {});
  }

  Future<void> deleteNotification(String id) async {
    await _client.delete('/notifications/$id');
  }

  Future<void> clearAll() async {
    await _client.delete('/notifications');
  }
}
