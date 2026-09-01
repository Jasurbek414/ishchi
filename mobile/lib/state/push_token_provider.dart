import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/push_notifications.dart';
import 'core_providers.dart';

/// Requests notification permission and registers the device's FCM token with the
/// backend once the user is authenticated. Call [sync] after login/app-restore;
/// safe to call multiple times (e.g. on every app start) — it's just an upsert.
class PushTokenSync {
  PushTokenSync(this._ref);

  final Ref _ref;
  bool _refreshListenerAttached = false;

  Future<void> sync() async {
    try {
      await PushNotifications.instance.init();
      final granted = await PushNotifications.instance.requestPermission();
      if (!granted) return;

      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) await _register(token);

      if (!_refreshListenerAttached) {
        _refreshListenerAttached = true;
        FirebaseMessaging.instance.onTokenRefresh.listen(_register);
      }
    } catch (e) {
      // Push notifications are a nice-to-have — never let a Firebase hiccup
      // (e.g. no google-services config on a dev build) break the app.
      debugPrint('Push token sync failed: $e');
    }
  }

  Future<void> _register(String token) async {
    try {
      await _ref.read(notificationRepositoryProvider).registerToken(token);
    } catch (_) {
      // best-effort
    }
  }
}

final pushTokenSyncProvider = Provider<PushTokenSync>((ref) => PushTokenSync(ref));
