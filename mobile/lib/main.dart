import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:flutter/services.dart';

import 'app.dart';
import 'core/push_notifications.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Android 15+ (API 35+) forces edge-to-edge display for apps targeting that SDK — without
  // this, MediaQuery's bottom padding doesn't reliably reflect the system navigation bar,
  // so SafeArea-wrapped widgets like the bottom nav render underneath it.
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  // Let the app's own background (per-screen, theme-matched) show through the system bars
  // instead of Android painting its own scrim there — that scrim is what showed up as a flash
  // of plain white/black behind the app on some screens.
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    systemNavigationBarColor: Colors.transparent,
    systemNavigationBarDividerColor: Colors.transparent,
  ));
  try {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  } catch (e) {
    // No google-services.json on this build, or Firebase project not reachable —
    // the app must still run fine without push notifications.
    debugPrint('Firebase init skipped: $e');
  }
  runApp(const ProviderScope(child: IshchiApp()));
}
