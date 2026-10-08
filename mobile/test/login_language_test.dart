// The login screen has a language switcher (the profile's language settings are not reachable before
// signing in). Opens the real screen, picks a language and checks the text and the saved choice change.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:ishchi/l10n/gen/app_localizations.dart';
import 'package:ishchi/screens/auth/login_screen.dart';
import 'package:ishchi/state/core_providers.dart';
import 'package:ishchi/state/locale_provider.dart';
import 'package:ishchi/widgets/language_switcher.dart';

class _App extends ConsumerWidget {
  const _App();
  @override
  Widget build(BuildContext context, WidgetRef ref) => MaterialApp(
        locale: ref.watch(localeProvider).locale,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: const LoginScreen(),
      );
}

void main() {
  testWidgets('login screen: switcher is there, offers four languages, switching changes the text and is saved', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    tester.view.physicalSize = const Size(1080, 2200);
    tester.view.devicePixelRatio = 2.75;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(ProviderScope(
      overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
      child: const _App(),
    ));
    await tester.pump(const Duration(milliseconds: 300));

    List<String> visibleTexts() => [
          for (final w in tester.widgetList<Text>(find.descendant(of: find.byType(LoginScreen), matching: find.byType(Text))))
            if ((w.data ?? w.textSpan?.toPlainText() ?? '').trim().isNotEmpty) (w.data ?? w.textSpan!.toPlainText())
        ];
    final uz = visibleTexts();
    // ignore: avoid_print
    print('LOGIN (Uzbek) visible texts: $uz');
    expect(uz.where((t) => t.contains("''")), isEmpty, reason: 'doubled apostrophe on the login page: ${uz.where((t) => t.contains("''"))}');
    // ignore: avoid_print
    print('LOGIN apostrophes shown (Uzbek): ${uz.where((t) => t.contains("'")).toList()}');

    expect(find.byType(LanguageSwitcher), findsOneWidget, reason: 'no language switcher on the login screen');
    final before = (tester.widget<Text>(find.byWidgetPredicate((w) => w is Text && w.style?.fontSize == 26)).data);
    // ignore: avoid_print
    print('LOGIN title before: "$before"');

    await tester.tap(find.byType(LanguageSwitcher));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 600));
    for (final name in ["O'zbekcha", 'Ўзбекча', 'Русский', 'English']) {
      expect(find.text(name), findsWidgets, reason: 'language "$name" missing from the picker');
    }

    await tester.tap(find.text('Русский'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 600));
    final after = tester.widget<Text>(find.byWidgetPredicate((w) => w is Text && w.style?.fontSize == 26)).data;
    // ignore: avoid_print
    print('LOGIN title after choosing Русский: "$after"');
    expect(after, isNot(before), reason: 'the screen text did not change after picking a language');
    expect(prefs.getString('app_language'), 'russian', reason: 'the choice was not saved');
  });
}
