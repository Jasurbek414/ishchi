import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/push_notifications.dart';
import '../models/in_app_notification.dart';
import 'auth_provider.dart';
import 'core_providers.dart';

const _kNotificationsStorageKey = 'cached_in_app_notifications_v1';

class InAppNotificationNotifier extends StateNotifier<List<InAppNotification>> {
  InAppNotificationNotifier(this._ref) : super(const []) {
    _loadFromStorage();
    _attachPushListener();
    fetchFromBackend();
  }

  final Ref _ref;
  bool _isLoading = false;
  bool get isLoading => _isLoading;

  void _loadFromStorage() {
    try {
      final prefs = _ref.read(sharedPreferencesProvider);
      final rawList = prefs.getStringList(_kNotificationsStorageKey);
      if (rawList != null && rawList.isNotEmpty) {
        final loaded = rawList
            .map((item) {
              try {
                return InAppNotification.fromJson(item);
              } catch (_) {
                return null;
              }
            })
            .whereType<InAppNotification>()
            .toList();
        state = loaded;
      }
    } catch (_) {}
  }

  Future<void> fetchFromBackend() async {
    final authState = _ref.read(authNotifierProvider);
    if (authState.status != AuthStatus.authenticated) return;

    _isLoading = true;
    try {
      final repo = _ref.read(notificationRepositoryProvider);
      final backendList = await repo.getNotifications(page: 0, size: 50);

      final existingIds = backendList.map((n) => n.id).toSet();
      final localOnly = state.where((n) => !existingIds.contains(n.id)).toList();

      state = [...backendList, ...localOnly];
      await _saveToStorage();
    } catch (_) {
      // Offline fallback
    } finally {
      _isLoading = false;
    }
  }

  void _attachPushListener() {
    PushNotifications.onMessageReceived = (message) {
      final notification = message.notification;
      final title = notification?.title ?? message.data['title']?.toString() ?? 'Bildirishnoma';
      final body = notification?.body ?? message.data['body']?.toString() ?? '';

      if (title.isEmpty && body.isEmpty) return;

      final item = InAppNotification(
        id: message.messageId ?? DateTime.now().millisecondsSinceEpoch.toString(),
        title: title,
        body: body,
        createdAt: DateTime.now(),
        isRead: false,
        type: NotificationType.fromString(message.data['type']?.toString()),
        data: message.data,
      );

      addNotification(item);
      // Also refresh from backend to ensure consistent state
      fetchFromBackend();
    };
  }

  Future<void> _saveToStorage() async {
    try {
      final prefs = _ref.read(sharedPreferencesProvider);
      final trimmed = state.take(50).map((n) => n.toJson()).toList();
      await prefs.setStringList(_kNotificationsStorageKey, trimmed);
    } catch (_) {}
  }

  void addNotification(InAppNotification item) {
    if (state.any((n) => n.id == item.id)) return;
    state = [item, ...state];
    _saveToStorage();
  }

  void markAsRead(String id) {
    state = [
      for (final n in state)
        if (n.id == id) n.copyWith(isRead: true) else n,
    ];
    _saveToStorage();
    _ref.read(notificationRepositoryProvider).markAsRead(id).catchError((_) {});
  }

  void markAllAsRead() {
    state = [for (final n in state) n.copyWith(isRead: true)];
    _saveToStorage();
    _ref.read(notificationRepositoryProvider).markAllAsRead().catchError((_) {});
  }

  void removeNotification(String id) {
    state = state.where((n) => n.id != id).toList();
    _saveToStorage();
    _ref.read(notificationRepositoryProvider).deleteNotification(id).catchError((_) {});
  }

  void clearAll() {
    state = const [];
    _saveToStorage();
    _ref.read(notificationRepositoryProvider).clearAll().catchError((_) {});
  }
}

final inAppNotificationsProvider =
    StateNotifierProvider<InAppNotificationNotifier, List<InAppNotification>>(
  (ref) => InAppNotificationNotifier(ref),
);

final unreadNotificationCountProvider = Provider<int>((ref) {
  final list = ref.watch(inAppNotificationsProvider);
  return list.where((n) => !n.isRead).length;
});
