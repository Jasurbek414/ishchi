import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:go_router/go_router.dart';

import 'design_tokens.dart';
import 'navigator_key.dart';

/// Handles the device side of push notifications: local display for foreground
/// messages, requesting permission, and routing when notifications are tapped.
class PushNotifications {
  PushNotifications._();

  static final PushNotifications instance = PushNotifications._();

  static void Function(RemoteMessage message)? onMessageReceived;

  static String? pendingRoute;

  static void navigateToNotifications() {
    final context = rootNavigatorKey.currentContext;
    if (context != null) {
      try {
        GoRouter.of(context).push('/notifications');
        pendingRoute = null;
        return;
      } catch (_) {}
    }
    pendingRoute = '/notifications';
  }

  static void checkPendingNavigation() {
    if (pendingRoute != null) {
      final route = pendingRoute!;
      final context = rootNavigatorKey.currentContext;
      if (context != null) {
        try {
          GoRouter.of(context).push(route);
          pendingRoute = null;
        } catch (_) {}
      }
    }
  }

  static const _channel = AndroidNotificationChannel(
    'ishchi_default',
    'Bildirishnomalar',
    description: "Yangi buyurtmalar va boshqa muhim xabarlar",
    importance: Importance.high,
  );

  final _localNotifications = FlutterLocalNotificationsPlugin();
  bool _initialized = false;

  Future<void> init() async {
    if (_initialized) return;
    _initialized = true;

    await _localNotifications.initialize(
      const InitializationSettings(
        android: AndroidInitializationSettings('@drawable/ic_stat_notification'),
        iOS: DarwinInitializationSettings(),
      ),
      onDidReceiveNotificationResponse: (response) {
        _handleTap(null);
      },
    );
    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_channel);

    FirebaseMessaging.onMessage.listen(_showForegroundNotification);

    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      _handleTap(message);
    });

    final initial = await FirebaseMessaging.instance.getInitialMessage();
    if (initial != null) {
      _handleTap(initial);
    }
  }

  void _handleTap(RemoteMessage? message) {
    if (message != null && onMessageReceived != null) {
      onMessageReceived!(message);
    }
    navigateToNotifications();
  }

  Future<bool> requestPermission() async {
    final settings = await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    return settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional;
  }

  void _showForegroundNotification(RemoteMessage message) {
    onMessageReceived?.call(message);
    final notification = message.notification;
    if (notification == null) return;
    _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channel.id,
          _channel.name,
          channelDescription: _channel.description,
          importance: Importance.high,
          priority: Priority.high,
          icon: '@drawable/ic_stat_notification',
          color: DesignTokens.primary,
        ),
        iOS: const DarwinNotificationDetails(),
      ),
    );
  }
}

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // System tray already shows the notification for background/terminated state —
  // nothing else to do here. Required by firebase_messaging as a top-level function.
}
