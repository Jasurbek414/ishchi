import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/push_notifications.dart';
import '../models/in_app_notification.dart';
import 'core_providers.dart';

const _kNotificationsStorageKey = 'cached_in_app_notifications_v1';

class InAppNotificationNotifier extends StateNotifier<List<InAppNotification>> {
  InAppNotificationNotifier(this._ref) : super(const []) {
    _loadFromStorage();
    _attachPushListener();
  }

  final Ref _ref;

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

  void _attachPushListener() {
    PushNotifications.onMessageReceived = (message) {
      final notification = message.notification;
      if (notification == null) return;

      final item = InAppNotification(
        id: message.messageId ?? DateTime.now().millisecondsSinceEpoch.toString(),
        title: notification.title ?? 'Bildirishnoma',
        body: notification.body ?? '',
        createdAt: DateTime.now(),
        isRead: false,
        type: NotificationType.fromString(message.data['type']?.toString()),
        data: message.data,
      );

      addNotification(item);
    };
  }

  Future<void> _saveToStorage() async {
    try {
      final prefs = _ref.read(sharedPreferencesProvider);
      // Keep only the most recent 50 notifications
      final trimmed = state.take(50).map((n) => n.toJson()).toList();
      await prefs.setStringList(_kNotificationsStorageKey, trimmed);
    } catch (_) {}
  }

  void addNotification(InAppNotification item) {
    // Avoid duplicate if same messageId arrives
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
  }

  void markAllAsRead() {
    state = [for (final n in state) n.copyWith(isRead: true)];
    _saveToStorage();
  }

  void removeNotification(String id) {
    state = state.where((n) => n.id != id).toList();
    _saveToStorage();
  }

  void clearAll() {
    state = const [];
    _saveToStorage();
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
