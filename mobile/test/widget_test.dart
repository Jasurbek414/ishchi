import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:ishchi/app.dart';
import 'package:ishchi/state/core_providers.dart';

void main() {
  testWidgets('App boots to the splash screen', (WidgetTester tester) async {
    // main() opens the preferences before runApp and hands them to the app, so the saved colour,
    // language and filters are known on the very first frame; the test does the same.
    // A returning user: the colour and mode are already saved, so the app does not ask the server
    // for defaults (that request leaves a network timeout timer running when the test ends).
    SharedPreferences.setMockInitialValues({'theme_seed_color': 0xFF0284C7, 'theme_mode': 'light'});
    final prefs = await SharedPreferences.getInstance();

    await tester.pumpWidget(ProviderScope(
      overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
      child: const IshchiApp(),
    ));
    await tester.pump();

    expect(find.text('Ishchi'), findsOneWidget);
  });
}
