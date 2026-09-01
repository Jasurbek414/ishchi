import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/router.dart';
import 'core/theme.dart';
import 'l10n/gen/app_localizations.dart';
import 'state/auth_provider.dart';
import 'state/locale_provider.dart';
import 'state/push_token_provider.dart';
import 'state/theme_provider.dart';

class IshchiApp extends ConsumerWidget {
  const IshchiApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final themeState = ref.watch(themeProvider);
    final language = ref.watch(localeProvider);

    ref.listen(authNotifierProvider, (previous, next) {
      if (next.status == AuthStatus.authenticated) {
        ref.read(pushTokenSyncProvider).sync();
      }
    });

    return MaterialApp.router(
      title: 'Ishchi',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(themeState.seedColor),
      darkTheme: AppTheme.dark(themeState.seedColor),
      themeMode: themeState.themeMode,
      locale: language.locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      routerConfig: router,
      // Android 15+ forces edge-to-edge rendering, so screen content draws behind the system
      // navigation bar unless something consumes that bottom inset. Doing it once here (rather
      // than in every screen) guarantees no button/list end ever renders underneath it. `top:
      // false` leaves the status-bar inset alone — each screen's own AppBar already accounts
      // for that — and any SafeArea further down the tree just sees zero inset left to add.
      //
      // Deliberately NOT painting a solid Container behind this: the floating bottom nav pill
      // (AppBottomNav) is a frosted-glass shape with visible rounded corners and gaps on
      // either side, by design — a flat background color placed above the Scaffold would fill
      // those gaps in as a hard-edged rectangle and make the whole bar read as one solid block
      // instead of a floating pill. The system nav bar itself is made transparent in main.dart
      // instead, so the Scaffold's own background (which already matches the theme) shows
      // through cleanly with no extra layer needed.
      builder: (context, child) => SafeArea(top: false, bottom: true, child: child!),
    );
  }
}
