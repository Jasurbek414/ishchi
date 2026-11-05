import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/push_notifications.dart';
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
        WidgetsBinding.instance.addPostFrameCallback((_) {
          PushNotifications.checkPendingNavigation();
        });
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
      builder: (context, child) {
        final isDark = Theme.of(context).brightness == Brightness.dark;
        final icons = isDark ? Brightness.light : Brightness.dark;
        return AnnotatedRegion<SystemUiOverlayStyle>(
          value: SystemUiOverlayStyle(
            statusBarColor: Colors.transparent,
            statusBarIconBrightness: icons,
            statusBarBrightness: isDark ? Brightness.dark : Brightness.light,
            systemNavigationBarColor: Colors.transparent,
            systemNavigationBarIconBrightness: icons,
            systemNavigationBarDividerColor: Colors.transparent,
          ),
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}
